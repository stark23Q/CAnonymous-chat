import type { Router } from "express";
import express from "express";
import cookie from "cookie";
import { MembershipStatus, TokenPurpose, UserRole } from "@prisma/client";
import { z } from "zod";
import { env, isProduction } from "../config/env.js";
import { createOpaqueToken, hashLookupValue, hashToken, signAccessToken, verifyRefreshToken } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";
import { issueCsrfToken, requireCsrf } from "../middleware/csrf.js";
import { requireAuth } from "../middleware/auth.js";
import { createUniqueMembershipIdentity, normalizeRequestedAlias } from "../services/identity.js";
import { createPseudonym } from "../services/pseudonyms.js";
import {
  clearAuthCookies,
  createSession,
  isDevTokenDisclosureEnabled,
  refreshCookieName,
  setAuthCookies
} from "../services/sessions.js";
import { audit } from "../utils/audit.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import { getSocketServer } from "../realtime.js";

const joinRequestSchema = z.object({
  inviteCode: z.string().min(6).max(120),
  reason: z.string().max(1_000).optional(),
  requestedAlias: z.string().max(32).optional()
});

const claimSchema = z.object({
  token: z.string().min(16),
  customName: z.string().max(20).optional()
});

const refreshSchema = z.object({
  refreshToken: z.string().optional()
});

const recoveryLoginSchema = z.object({
  recoveryPhrase: z.string().min(10)
});

export function authRoutes(): Router {
  const router = express.Router();

  router.get("/csrf", (_req, res) => {
    const csrfToken = issueCsrfToken(res);
    res.json({ csrfToken });
  });

  router.post("/dev-session", requireCsrf, async (req, res, next) => {
    try {

      const { password } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (password !== expectedPassword) {
        res.status(401).json({ error: "Invalid admin password." });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;

      const user = await prisma.user.findFirst({
        where: { role: UserRole.ADMIN },
        orderBy: { createdAt: "asc" }
      });

      if (!user) {
        res.status(404).json({ error: "Seed an admin user before creating a development session." });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastIp: ipAddress ?? null }
      });

      const tokens = await createSession(user, ipAddress);
      setAuthCookies(res, tokens);

      res.status(201).json({
        user: {
          id: user.id,
          anonymousName: user.anonymousName,
          avatarSeed: user.avatarSeed,
          role: user.role
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/join/request", requireCsrf, async (req, res, next) => {
    try {
      const input = joinRequestSchema.parse(req.body);
      const codeHash = hashLookupValue(input.inviteCode);
      const invitation = await prisma.invitation.findUnique({
        where: { codeHash },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              description: true,
              rules: true
            }
          }
        }
      });

      const now = new Date();
      const inviteInvalid =
        !invitation ||
        invitation.disabledAt !== null ||
        (invitation.expiresAt !== null && invitation.expiresAt < now) ||
        (invitation.maxUses !== null && invitation.useCount >= invitation.maxUses);

      if (inviteInvalid || !invitation) {
        res.status(404).json({ error: "Invite code is invalid or expired." });
        return;
      }

      const claimToken = createOpaqueToken("join");
      const tokenHash = hashToken(claimToken);

      const joinRequest = await prisma.$transaction(async (tx) => {
        const created = await tx.joinRequest.create({
          data: {
            groupId: invitation.groupId,
            invitationId: invitation.id,
            reason: sanitizeOptionalText(input.reason, 1_000),
            requestedAlias: normalizeRequestedAlias(input.requestedAlias),
            approvalTokenHash: tokenHash
          }
        });

        await tx.invitation.update({
          where: { id: invitation.id },
          data: { useCount: { increment: 1 } }
        });

        return created;
      });

      getSocketServer().to(`group:${invitation.groupId}`).emit("request:new", {
        request: {
          id: joinRequest.id,
          groupId: invitation.groupId,
          groupName: invitation.group.name,
          requestedAlias: joinRequest.requestedAlias,
          reason: joinRequest.reason,
          createdAt: joinRequest.createdAt.toISOString(),
          status: joinRequest.status
        }
      });

      res.status(201).json({
        requestId: joinRequest.id,
        status: joinRequest.status,
        group: invitation.group,
        claimToken
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/join/status", async (req, res, next) => {
    try {
      const requestId = typeof req.query.requestId === "string" ? req.query.requestId : undefined;
      if (!requestId) {
        res.status(400).json({ error: "Missing requestId." });
        return;
      }
      const joinRequest = await prisma.joinRequest.findUnique({
        where: { id: requestId },
        select: { status: true }
      });
      if (!joinRequest) {
        res.status(404).json({ error: "Join request not found." });
        return;
      }
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.json({ status: joinRequest.status });
    } catch (error) {
      next(error);
    }
  });

  router.post("/join/claim", requireCsrf, async (req, res, next) => {
    try {
      const input = claimSchema.parse(req.body);
      const tokenHash = hashToken(input.token);
      const oneTimeToken = await prisma.oneTimeToken.findUnique({
        where: { tokenHash }
      });

      if (
        !oneTimeToken ||
        oneTimeToken.purpose !== TokenPurpose.JOIN ||
        oneTimeToken.usedAt !== null ||
        oneTimeToken.expiresAt < new Date() ||
        !oneTimeToken.groupId
      ) {
        res.status(401).json({ error: "Join token is invalid or expired." });
        return;
      }

      const groupId = oneTimeToken.groupId;
      const [userIdentity, membershipIdentity] = await Promise.all([
        Promise.resolve(createPseudonym()),
        createUniqueMembershipIdentity(groupId)
      ]);

      let finalUserName = userIdentity.anonymousName;
      let finalMembershipName = membershipIdentity.anonymousName;

      if (input.customName) {
        const customNameStr = sanitizeOptionalText(input.customName, 20);
        if (customNameStr) {
          finalUserName = customNameStr;
          const existing = await prisma.membership.findUnique({
            where: {
              groupId_anonymousName: {
                groupId,
                anonymousName: customNameStr
              }
            }
          });
          finalMembershipName = existing ? `${customNameStr}-${Math.floor(Math.random() * 1000)}` : customNameStr;
        }
      }

      const recoveryPhrase = createOpaqueToken("rcv");
      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;

      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            anonymousName: finalUserName,
            avatarSeed: userIdentity.avatarSeed,
            recoveryKeyHash: hashToken(recoveryPhrase),
            lastIp: ipAddress ?? null,
            memberships: {
              create: {
                groupId,
                anonymousName: finalMembershipName,
                avatarSeed: membershipIdentity.avatarSeed,
                status: MembershipStatus.APPROVED,
                joinedAt: new Date()
              }
            }
          }
        });

        await tx.oneTimeToken.update({
          where: { id: oneTimeToken.id },
          data: { usedAt: new Date() }
        });

        await tx.auditLog.create({
          data: {
            actorId: createdUser.id,
            groupId,
            action: "join.claimed",
            targetId: createdUser.id
          }
        });

        await tx.identityLog.create({
          data: {
            userId: createdUser.id,
            groupId,
            newName: finalMembershipName,
            action: "USER_JOINED"
          }
        });

        return createdUser;
      });

      const tokens = await createSession(user, ipAddress);
      setAuthCookies(res, tokens);

      res.status(201).json({
        user: {
          id: user.id,
          anonymousName: user.anonymousName,
          avatarSeed: user.avatarSeed,
          role: user.role,
          recoveryPhrase
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/recovery-login", requireCsrf, async (req, res, next) => {
    try {
      const { recoveryPhrase } = recoveryLoginSchema.parse(req.body);
      const user = await prisma.user.findFirst({
        where: { recoveryKeyHash: hashToken(recoveryPhrase) }
      });

      if (!user) {
        res.status(401).json({ error: "Invalid recovery phrase." });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastIp: ipAddress ?? null }
      });

      const tokens = await createSession(user, ipAddress);
      setAuthCookies(res, tokens);

      res.status(201).json({
        user: {
          id: user.id,
          anonymousName: user.anonymousName,
          avatarSeed: user.avatarSeed,
          role: user.role
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/refresh", requireCsrf, async (req, res, next) => {
    try {
      const input = refreshSchema.parse(req.body);
      const cookies = cookie.parse(req.headers.cookie ?? "");
      const refreshToken = input.refreshToken ?? cookies[refreshCookieName()];

      if (!refreshToken) {
        res.status(401).json({ error: "Refresh token required." });
        return;
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload.sid) {
        res.status(401).json({ error: "Invalid refresh token." });
        return;
      }

      const session = await prisma.authSession.findUnique({
        where: { id: payload.sid },
        include: { user: true }
      });

      if (
        !session ||
        session.revokedAt !== null ||
        session.expiresAt < new Date() ||
        session.refreshTokenHash !== hashToken(refreshToken)
      ) {
        res.status(401).json({ error: "Refresh token is invalid or expired." });
        return;
      }

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastIp: ipAddress ?? null }
      });

      const accessToken = signAccessToken({
        sub: session.userId,
        role: session.user.role,
        sid: session.id
      });

      setAuthCookies(res, {
        accessToken,
        refreshToken
      });

      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", requireCsrf, requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth!;
      if (auth.sessionId) {
        await prisma.authSession.updateMany({
          where: {
            id: auth.sessionId,
            userId: auth.userId,
            revokedAt: null
          },
          data: { revokedAt: new Date() }
        });
      }

      clearAuthCookies(res);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth!;
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: auth.userId },
        select: {
          id: true,
          anonymousName: true,
          avatarSeed: true,
          role: true,
          memberships: {
            where: { status: MembershipStatus.APPROVED },
            select: {
              id: true,
              groupId: true,
              anonymousName: true,
              avatarSeed: true,
              status: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  privacyMode: true,
                  retentionPolicy: true
                }
              }
            }
          }
        }
      });

      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.post("/magic-links", requireCsrf, requireAuth, async (req, res, next) => {
    try {
      const auth = req.auth!;
      const token = createOpaqueToken("magic");
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await prisma.oneTimeToken.create({
        data: {
          purpose: TokenPurpose.MAGIC_LINK,
          tokenHash: hashToken(token),
          userId: auth.userId,
          expiresAt
        }
      });

      await audit({
        actorId: auth.userId,
        action: "magic_link.created"
      });

      const magicLink = `${env.APP_ORIGIN}/magic?token=${encodeURIComponent(token)}`;
      res.status(201).json({
        expiresAt,
        ...(isDevTokenDisclosureEnabled() ? { token, magicLink } : {})
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/magic-login", requireCsrf, async (req, res, next) => {
    try {
      const input = claimSchema.parse(req.body);
      const oneTimeToken = await prisma.oneTimeToken.findUnique({
        where: { tokenHash: hashToken(input.token) }
      });

      if (
        !oneTimeToken ||
        oneTimeToken.purpose !== TokenPurpose.MAGIC_LINK ||
        oneTimeToken.usedAt !== null ||
        oneTimeToken.expiresAt < new Date() ||
        !oneTimeToken.userId
      ) {
        res.status(401).json({ error: "Magic link is invalid or expired." });
        return;
      }

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: oneTimeToken.userId }
      });

      await prisma.oneTimeToken.update({
        where: { id: oneTimeToken.id },
        data: { usedAt: new Date() }
      });

      const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastIp: ipAddress ?? null }
      });

      const tokens = await createSession(user, ipAddress);
      setAuthCookies(res, tokens);

      res.json({
        user: {
          id: user.id,
          anonymousName: user.anonymousName,
          avatarSeed: user.avatarSeed,
          role: user.role
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
