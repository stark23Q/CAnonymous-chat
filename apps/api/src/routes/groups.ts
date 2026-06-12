import type { Router } from "express";
import express from "express";
import { MembershipStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { assertApprovedMembership } from "../services/access.js";
import { createUniqueMembershipIdentity } from "../services/identity.js";
import { messageInclude, toPublicMessage } from "../services/messages.js";
import { expiresAtForPolicy } from "../services/retention.js";
import { sanitizeText } from "../utils/sanitize.js";
import { getSocketServer } from "../realtime.js";

const answerSchema = z.object({
  answer: z.string().min(1).max(2_000)
});

const messagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

const pollSchema = z.object({
  question: z.string().min(1).max(240),
  options: z.array(z.string().min(1).max(80)).min(2).max(8),
  closesAt: z.string().datetime().optional()
});

const voteSchema = z.object({
  optionId: z.string().min(1)
});

const confessionSchema = z.object({
  content: z.string().min(1).max(2_000)
});

const questionSchema = z.object({
  question: z.string().min(1).max(1_000)
});

export function groupRoutes(): Router {
  const router = express.Router();

  router.use(requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const auth = req.auth!;

      if (auth.role === UserRole.ADMIN) {
        const groups = await prisma.group.findMany({
          include: {
            channels: { orderBy: { position: "asc" } },
            _count: {
              select: {
                memberships: true,
                messages: true,
                joinRequests: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        });

        res.json({ groups });
        return;
      }

      const memberships = await prisma.membership.findMany({
        where: {
          userId: auth.userId,
          status: MembershipStatus.APPROVED
        },
        include: {
          group: {
            include: {
              channels: { orderBy: { position: "asc" } }
            }
          }
        },
        orderBy: { joinedAt: "desc" }
      });

      res.json({
        groups: memberships.map((membership) => ({
          ...membership.group,
          membership: {
            id: membership.id,
            anonymousName: membership.anonymousName,
            avatarSeed: membership.avatarSeed
          }
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:groupId", async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const group = await prisma.group.findUniqueOrThrow({
        where: { id: req.params.groupId },
        include: {
          channels: { orderBy: { position: "asc" } },
          _count: {
            select: {
              memberships: true,
              messages: true
            }
          }
        }
      });

      res.json({ group });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:groupId/channels/:channelId/messages", async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const query = messagesQuerySchema.parse(req.query);
      const messages = await prisma.message.findMany({
        where: {
          groupId: req.params.groupId,
          channelId: req.params.channelId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          ...(query.before ? { createdAt: { lt: new Date(query.before) } } : {})
        },
        include: messageInclude,
        orderBy: { createdAt: "desc" },
        take: query.limit
      });

      res.json({
        messages: messages.reverse().map(toPublicMessage)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:groupId/channels/:channelId/polls", requireCsrf, async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const input = pollSchema.parse(req.body);
      const poll = await prisma.poll.create({
        data: {
          groupId: req.params.groupId,
          channelId: req.params.channelId,
          createdById: req.auth!.userId,
          question: sanitizeText(input.question, 240),
          closesAt: input.closesAt ? new Date(input.closesAt) : null,
          options: {
            create: input.options.map((option) => ({ label: sanitizeText(option, 80) }))
          }
        },
        include: {
          options: true,
          votes: true
        }
      });

      res.status(201).json({ poll });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:groupId/polls", async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const polls = await prisma.poll.findMany({
        where: { groupId: req.params.groupId },
        include: {
          options: {
            include: {
              _count: { select: { votes: true } }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      });

      res.json({ polls });
    } catch (error) {
      next(error);
    }
  });

  router.post("/polls/:pollId/votes", requireCsrf, async (req, res, next) => {
    try {
      const input = voteSchema.parse(req.body);
      const poll = await prisma.poll.findUniqueOrThrow({
        where: { id: req.params.pollId }
      });
      await assertApprovedMembership(req.auth!.userId, poll.groupId);

      if (poll.closesAt && poll.closesAt < new Date()) {
        res.status(409).json({ error: "Poll is closed." });
        return;
      }

      const vote = await prisma.pollVote.upsert({
        where: {
          pollId_userId: {
            pollId: poll.id,
            userId: req.auth!.userId
          }
        },
        update: { optionId: input.optionId },
        create: {
          pollId: poll.id,
          optionId: input.optionId,
          userId: req.auth!.userId
        }
      });

      res.status(201).json({ vote });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:groupId/confessions", requireCsrf, async (req, res, next) => {
    try {
      const membership = await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const group = await prisma.group.findUniqueOrThrow({ where: { id: req.params.groupId } });
      const input = confessionSchema.parse(req.body);
      const confession = await prisma.confession.create({
        data: {
          groupId: req.params.groupId,
          createdById: req.auth!.userId,
          content: sanitizeText(input.content, 2_000),
          expiresAt: expiresAtForPolicy(group.retentionPolicy)
        }
      });

      const responseConfession = {
        ...confession,
        author: {
          id: membership.id,
          anonymousName: membership.anonymousName,
          avatarSeed: membership.avatarSeed
        }
      };

      try {
        console.log(`[API] Broadcasting confession:new to group:${req.params.groupId}`);
        getSocketServer().to(`group:${req.params.groupId}`).emit("confession:new", { confession: responseConfession });
        console.log(`[API] Broadcasted confession successfully!`);
      } catch (err) {
        console.error("[API] Failed to broadcast confession:", err);
      }

      res.status(201).json({
        confession: responseConfession
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:groupId/confessions", async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const confessions = await prisma.confession.findMany({
        where: {
          groupId: req.params.groupId,
          deletedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      res.json({ confessions });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:groupId/questions", requireCsrf, async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const input = questionSchema.parse(req.body);
      const question = await prisma.question.create({
        data: {
          groupId: req.params.groupId,
          createdById: req.auth!.userId,
          question: sanitizeText(input.question, 1_000)
        }
      });

      res.status(201).json({ question });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:groupId/questions", async (req, res, next) => {
    try {
      await assertApprovedMembership(req.auth!.userId, req.params.groupId);
      const questions = await prisma.question.findMany({
        where: { groupId: req.params.groupId },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      res.json({ questions });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:groupId/membership/rotate-identity", requireCsrf, async (req, res, next) => {
    try {
      const membership = await assertApprovedMembership(req.auth!.userId, req.params.groupId);

      const identity = await createUniqueMembershipIdentity(req.params.groupId);

      const updated = await prisma.membership.update({
        where: { id: membership.id },
        data: {
          anonymousName: identity.anonymousName,
          avatarSeed: identity.avatarSeed
        },
        select: {
          id: true,
          anonymousName: true,
          avatarSeed: true
        }
      });

      res.json({ membership: updated });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:groupId/questions/:questionId/answer", requireCsrf, async (req, res, next) => {
    try {
      const auth = req.auth!;

      if (auth.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Only admins can answer questions." });
        return;
      }

      await assertApprovedMembership(auth.userId, req.params.groupId);

      const input = answerSchema.parse(req.body);

      const question = await prisma.question.update({
        where: {
          id: req.params.questionId,
          groupId: req.params.groupId
        },
        data: {
          answer: sanitizeText(input.answer, 2_000),
          answeredAt: new Date()
        }
      });

      res.json({ question });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
