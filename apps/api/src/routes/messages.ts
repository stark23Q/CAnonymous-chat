import type { Router } from "express";
import express from "express";
import { MessageType, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { assertApprovedMembership } from "../services/access.js";
import { createChatMessage, messageInclude, toPublicMessage } from "../services/messages.js";
import { createPresignedUpload } from "../services/storage.js";
import { audit } from "../utils/audit.js";
import { mediaUploadSchema, sanitizeText, validateEmoji } from "../utils/sanitize.js";

const createMessageSchema = z.object({
  groupId: z.string().min(1),
  channelId: z.string().min(1),
  content: z.string().max(10_000_000).optional(),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
  mediaUrl: z.string().max(10_000_000).optional(),
  mediaKey: z.string().min(1).optional(),
  mediaMime: z.string().max(120).optional(),
  mediaSize: z.number().int().positive().optional(),
  replyToId: z.string().min(1).optional(),
  threadRootId: z.string().min(1).optional(),
  // Self-destruct: seconds from now (e.g. 3600 = 1 hour). Capped at 30 days.
  expiresInSeconds: z.number().int().min(60).max(2_592_000).optional()
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(32)
});

const reportSchema = z.object({
  reason: z.string().min(1).max(1_000)
});

export function messageRoutes(): Router {
  const router = express.Router();

  router.use(requireAuth);

  router.post("/", requireCsrf, async (req, res, next) => {
    try {
      const input = createMessageSchema.parse(req.body);
      const message = await createChatMessage({
        userId: req.auth!.userId,
        groupId: input.groupId,
        channelId: input.channelId,
        content: input.content,
        messageType: input.messageType,
        mediaUrl: input.mediaUrl,
        mediaKey: input.mediaKey,
        mediaMime: input.mediaMime,
        mediaSize: input.mediaSize,
        replyToId: input.replyToId,
        threadRootId: input.threadRootId,
        expiresInSeconds: input.expiresInSeconds
      });

      res.status(201).json({ message: toPublicMessage(message) });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:messageId", requireCsrf, async (req, res, next) => {
    try {
      const message = await prisma.message.findUniqueOrThrow({
        where: { id: req.params.messageId }
      });
      await assertApprovedMembership(req.auth!.userId, message.groupId);

      if (message.userId !== req.auth!.userId && req.auth!.role !== UserRole.ADMIN) {
        res.status(403).json({ error: "Only the author or an administrator can delete this message." });
        return;
      }

      const deleted = await prisma.message.update({
        where: { id: message.id },
        data: {
          deletedAt: new Date(),
          deletedById: req.auth!.userId,
          content: null,
          mediaUrl: null,
          mediaKey: null
        },
        include: messageInclude
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: message.groupId,
        action: "message.deleted",
        targetId: message.id
      });

      res.json({ message: toPublicMessage(deleted) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:messageId/reactions", requireCsrf, async (req, res, next) => {
    try {
      const input = reactionSchema.parse(req.body);
      const emoji = validateEmoji(input.emoji);
      const message = await prisma.message.findUniqueOrThrow({
        where: { id: req.params.messageId }
      });
      await assertApprovedMembership(req.auth!.userId, message.groupId);

      const existing = await prisma.reaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: message.id,
            userId: req.auth!.userId,
            emoji
          }
        }
      });

      if (existing) {
        await prisma.reaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.reaction.create({
          data: {
            messageId: message.id,
            userId: req.auth!.userId,
            emoji
          }
        });
      }

      const updated = await prisma.message.findUniqueOrThrow({
        where: { id: message.id },
        include: messageInclude
      });

      res.json({ message: toPublicMessage(updated) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:messageId/reports", requireCsrf, async (req, res, next) => {
    try {
      const input = reportSchema.parse(req.body);
      const message = await prisma.message.findUniqueOrThrow({
        where: { id: req.params.messageId }
      });
      await assertApprovedMembership(req.auth!.userId, message.groupId);

      const report = await prisma.report.create({
        data: {
          groupId: message.groupId,
          messageId: message.id,
          reporterId: req.auth!.userId,
          reason: sanitizeText(input.reason, 1_000)
        }
      });

      await audit({
        actorId: req.auth!.userId,
        groupId: message.groupId,
        action: "message.reported",
        targetId: message.id
      });

      res.status(201).json({ report });
    } catch (error) {
      next(error);
    }
  });

  router.post("/media/presign", requireCsrf, async (req, res, next) => {
    try {
      const input = mediaUploadSchema.parse(req.body);
      await assertApprovedMembership(req.auth!.userId, input.groupId);
      const upload = await createPresignedUpload(input);
      res.status(201).json({ upload });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
