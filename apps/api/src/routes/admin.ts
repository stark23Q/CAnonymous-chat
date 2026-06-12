import type { Router } from "express";
import express from "express";
import { ChannelKind, JoinRequestStatus, MembershipStatus, RetentionPolicy, TokenPurpose } from "@prisma/client";
import { nanoid } from "nanoid";
import { z } from "zod";
import { env } from "../config/env.js";
import { createOpaqueToken, hashLookupValue, hashToken } from "../lib/crypto.js";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { createUniqueMembershipIdentity } from "../services/identity.js";
import { audit } from "../utils/audit.js";
import { sanitizeOptionalText, sanitizeText } from "../utils/sanitize.js";

const groupSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(1_000),
  rules: z.string().min(1).max(4_000),
  retentionPolicy: z.nativeEnum(RetentionPolicy).default(RetentionPolicy.DAYS_7),
  privacyMode: z.boolean().default(true),
  readReceiptsEnabled: z.boolean().default(false),
  typingEnabled: z.boolean().default(true),
  e2eeMode: z.boolean().default(false)
});

const inviteSchema = z.object({
  label: z.string().max(80).optional(),
  maxUses: z.number().int().positive().max(100_000).optional(),
  expiresInHours: z.number().int().positive().max(24 * 365).optional()
});

const settingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(1).max(1_000).optional(),
  rules: z.string().min(1).max(4_000).optional(),
  retentionPolicy: z.nativeEnum(RetentionPolicy).optional(),
  privacyMode: z.boolean().optional(),
  readReceiptsEnabled: z.boolean().optional(),
  typingEnabled: z.boolean().optional(),
  e2eeMode: z.boolean().optional()
});

const reportUpdateSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED", "ACTIONED"])
});

function slugify(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)}-${nanoid(6)}`;
}

export function adminRoutes(): Router {
  const router = express.Router();

  router.use(requireAdmin);

  router.post("/groups", requireCsrf, async (req, res, next) => {
    try {
      const input = groupSchema.parse(req.body);
      const actorId = req.auth!.userId;
      const membershipIdentity = await createUniqueMembershipIdentity("pending");

      const group = await prisma.group.create({
        data: {
          name: sanitizeText(input.name, 80),
          slug: slugify(input.name),
          description: sanitizeText(input.description, 1_000),
          rules: sanitizeText(input.rules, 4_000),
          retentionPolicy: input.retentionPolicy,
          privacyMode: input.privacyMode,
          readReceiptsEnabled: input.readReceiptsEnabled,
          typingEnabled: input.typingEnabled,
          e2eeMode: input.e2eeMode,
          createdById: actorId,
          channels: {
            create: [
              { name: "general", position: 0 },
              { name: "memes", position: 1 },
              { name: "confessions", position: 2 },
              { name: "discussion", position: 3 },
              { name: "voice-room", kind: ChannelKind.VOICE_FUTURE, position: 4 }
            ]
          },
          memberships: {
            create: {
              userId: actorId,
              anonymousName: membershipIdentity.anonymousName,
              avatarSeed: membershipIdentity.avatarSeed,
              status: MembershipStatus.APPROVED,
              joinedAt: new Date()
            }
          }
        },
        include: {
          channels: true,
          memberships: true
        }
      });

      await audit({
        actorId,
        groupId: group.id,
        action: "group.created",
        targetId: group.id
      });

      res.status(201).json({ group });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/groups/:groupId/settings", requireCsrf, async (req, res, next) => {
    try {
      const input = settingsSchema.parse(req.body);
      const group = await prisma.group.update({
        where: { id: req.params.groupId },
        data: {
          ...(input.name ? { name: sanitizeText(input.name, 80) } : {}),
          ...(input.description ? { description: sanitizeText(input.description, 1_000) } : {}),
          ...(input.rules ? { rules: sanitizeText(input.rules, 4_000) } : {}),
          ...(input.retentionPolicy ? { retentionPolicy: input.retentionPolicy } : {}),
          ...(typeof input.privacyMode === "boolean" ? { privacyMode: input.privacyMode } : {}),
          ...(typeof input.readReceiptsEnabled === "boolean" ? { readReceiptsEnabled: input.readReceiptsEnabled } : {}),
          ...(typeof input.typingEnabled === "boolean" ? { typingEnabled: input.typingEnabled } : {}),
          ...(typeof input.e2eeMode === "boolean" ? { e2eeMode: input.e2eeMode } : {})
        },
        include: {
          channels: true,
          memberships: true
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: group.id,
        action: "group.settings_updated",
        targetId: group.id,
        metadata: input
      });

      res.json({ group });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/groups/:groupId", requireCsrf, async (req, res, next) => {
    try {
      const group = await prisma.group.findUnique({
        where: { id: req.params.groupId }
      });

      if (!group) {
        res.status(404).json({ error: "Group not found." });
        return;
      }

      await prisma.group.delete({
        where: { id: group.id }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/groups/:groupId/invitations", requireCsrf, async (req, res, next) => {
    try {
      const input = inviteSchema.parse(req.body);
      const code = createOpaqueToken("invite");
      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : null;

      const invitation = await prisma.invitation.create({
        data: {
          groupId: req.params.groupId,
          codeHash: hashLookupValue(code),
          createdById: req.auth!.userId,
          label: sanitizeOptionalText(input.label, 80),
          maxUses: input.maxUses ?? null,
          expiresAt
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: req.params.groupId,
        action: "invitation.created",
        targetId: invitation.id,
        metadata: { maxUses: input.maxUses, expiresAt }
      });

      res.status(201).json({
        invitation,
        code,
        requestUrl: `${env.APP_ORIGIN}/join?invite=${encodeURIComponent(code)}`
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/join-requests", async (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
      const requests = await prisma.joinRequest.findMany({
        where: {
          ...(groupId ? { groupId } : {}),
          ...(status ? { status: status as JoinRequestStatus } : {})
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      res.json({ requests });
    } catch (error) {
      next(error);
    }
  });

  router.post("/join-requests/:requestId/approve", requireCsrf, async (req, res, next) => {
    try {
      const request = await prisma.joinRequest.findUnique({
        where: { id: req.params.requestId }
      });

      if (!request || request.status !== JoinRequestStatus.PENDING) {
        res.status(404).json({ error: "Pending join request not found." });
        return;
      }

      if (!request.approvalTokenHash) {
        res.status(500).json({ error: "Join request is missing an approval token hash." });
        return;
      }

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.oneTimeToken.create({
          data: {
            purpose: TokenPurpose.JOIN,
            tokenHash: request.approvalTokenHash,
            groupId: request.groupId,
            expiresAt
          }
        }),
        prisma.joinRequest.update({
          where: { id: request.id },
          data: {
            status: JoinRequestStatus.APPROVED,
            decidedById: req.auth!.userId,
            decidedAt: new Date()
          }
        })
      ]);

      await audit({
        actorId: req.auth!.userId,
        groupId: request.groupId,
        action: "join_request.approved",
        targetId: request.id
      });

      res.json({
        requestId: request.id,
        expiresAt
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/join-requests/:requestId/reject", requireCsrf, async (req, res, next) => {
    try {
      const request = await prisma.joinRequest.update({
        where: { id: req.params.requestId },
        data: {
          status: JoinRequestStatus.REJECTED,
          decidedById: req.auth!.userId,
          decidedAt: new Date()
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: request.groupId,
        action: "join_request.rejected",
        targetId: request.id
      });

      res.json({ request });
    } catch (error) {
      next(error);
    }
  });

  router.get("/groups/:groupId/members", async (req, res, next) => {
    try {
      const members = await prisma.membership.findMany({
        where: { groupId: req.params.groupId },
        select: {
          id: true,
          anonymousName: true,
          avatarSeed: true,
          status: true,
          joinedAt: true,
          bannedAt: true,
          removedAt: true,
          user: {
            select: {
              id: true,
              role: true,
              createdAt: true,
              lastActiveAt: true
            }
          }
        },
        orderBy: { joinedAt: "desc" }
      });

      res.json({ members });
    } catch (error) {
      next(error);
    }
  });

  router.post("/memberships/:membershipId/ban", requireCsrf, async (req, res, next) => {
    try {
      const membership = await prisma.membership.update({
        where: { id: req.params.membershipId },
        data: {
          status: MembershipStatus.BANNED,
          bannedAt: new Date()
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: membership.groupId,
        action: "membership.banned",
        targetId: membership.id
      });

      res.json({ membership });
    } catch (error) {
      next(error);
    }
  });

  router.post("/memberships/:membershipId/remove", requireCsrf, async (req, res, next) => {
    try {
      const membership = await prisma.membership.update({
        where: { id: req.params.membershipId },
        data: {
          status: MembershipStatus.REMOVED,
          removedAt: new Date()
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: membership.groupId,
        action: "membership.removed",
        targetId: membership.id
      });

      res.json({ membership });
    } catch (error) {
      next(error);
    }
  });

  router.get("/reports", async (req, res, next) => {
    try {
      const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
      const reports = await prisma.report.findMany({
        where: groupId ? { groupId } : {},
        include: {
          message: {
            include: {
              membership: {
                select: {
                  anonymousName: true,
                  avatarSeed: true
                }
              }
            }
          },
          reporter: {
            select: {
              id: true,
              anonymousName: true,
              avatarSeed: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 100
      });

      res.json({ reports });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/reports/:reportId", requireCsrf, async (req, res, next) => {
    try {
      const input = reportUpdateSchema.parse(req.body);
      const report = await prisma.report.update({
        where: { id: req.params.reportId },
        data: {
          status: input.status,
          reviewedAt: new Date(),
          reviewedById: req.auth!.userId
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: report.groupId,
        action: "report.updated",
        targetId: report.id,
        metadata: input
      });

      res.json({ report });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function isDevDisclosure() {
  return env.MAGIC_LINK_DEV_MODE || env.NODE_ENV === "development";
}
