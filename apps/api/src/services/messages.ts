import { MessageType, ModerationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { assertApprovedMembership } from "./access.js";
import { moderateMessage } from "./moderation.js";
import { expiresAtForPolicy } from "./retention.js";
import { sanitizeOptionalText } from "../utils/sanitize.js";
import webpush from "web-push";

export const messageInclude = {
  membership: {
    select: {
      id: true,
      anonymousName: true,
      avatarSeed: true
    }
  },
  reactions: {
    select: {
      emoji: true,
      userId: true
    }
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      messageType: true,
      membership: {
        select: {
          anonymousName: true,
          avatarSeed: true
        }
      }
    }
  }
} as const;

export type MessageWithPublicRelations = Awaited<ReturnType<typeof createChatMessage>>;

export function toPublicMessage(message: {
  id: string;
  groupId: string;
  channelId: string;
  content: string | null;
  messageType: MessageType;
  mediaUrl: string | null;
  mediaMime: string | null;
  mediaSize: number | null;
  replyToId: string | null;
  threadRootId: string | null;
  moderationStatus: ModerationStatus;
  moderationReason: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  deletedAt: Date | null;
  membership: { id: string; anonymousName: string; avatarSeed: string };
  reactions: { emoji: string; userId: string }[];
  replyTo?: {
    id: string;
    content: string | null;
    messageType: MessageType;
    membership: { anonymousName: string; avatarSeed: string };
  } | null;
}) {
  const reactionCounts = message.reactions.reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
    return acc;
  }, {});

  return {
    id: message.id,
    groupId: message.groupId,
    channelId: message.channelId,
    content: message.deletedAt ? null : message.content,
    messageType: message.messageType,
    mediaUrl: message.deletedAt ? null : message.mediaUrl,
    mediaMime: message.mediaMime,
    mediaSize: message.mediaSize,
    replyToId: message.replyToId,
    threadRootId: message.threadRootId,
    moderationStatus: message.moderationStatus,
    moderationReason: message.moderationReason,
    createdAt: message.createdAt,
    expiresAt: message.expiresAt,
    deletedAt: message.deletedAt,
    author: {
      id: message.membership.id,
      anonymousName: message.membership.anonymousName,
      avatarSeed: message.membership.avatarSeed
    },
    reactions: reactionCounts,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          messageType: message.replyTo.messageType,
          author: message.replyTo.membership
        }
      : null
  };
}

export async function createChatMessage(input: {
  userId: string;
  groupId: string;
  channelId: string;
  content?: string | null | undefined;
  messageType?: MessageType | undefined;
  mediaUrl?: string | null | undefined;
  mediaKey?: string | null | undefined;
  mediaMime?: string | null | undefined;
  mediaSize?: number | null | undefined;
  replyToId?: string | null | undefined;
  threadRootId?: string | null | undefined;
  expiresInSeconds?: number | null | undefined;
}) {
  const [membership, group, channel] = await Promise.all([
    assertApprovedMembership(input.userId, input.groupId),
    prisma.group.findUnique({ where: { id: input.groupId } }),
    prisma.channel.findUnique({ where: { id: input.channelId } })
  ]);

  if (!group || !channel || channel.groupId !== group.id) {
    throw new Error("Channel not found.");
  }

  const messageType = input.messageType ?? MessageType.TEXT;
  const content = sanitizeOptionalText(input.content, messageType === MessageType.TEXT ? 4_000 : 1_000);

  if (messageType === MessageType.TEXT && !content) {
    throw new Error("Message content is required.");
  }

  const moderation = await moderateMessage(content);
  if (moderation.status === ModerationStatus.BLOCKED) {
    throw new Error("Message blocked by moderation policy.");
  }

  let expiresAt = expiresAtForPolicy(group.retentionPolicy);
  if (input.expiresInSeconds) {
    const userExpiry = new Date(Date.now() + input.expiresInSeconds * 1000);
    if (!expiresAt || userExpiry < expiresAt) {
      expiresAt = userExpiry;
    }
  }

  const message = await prisma.message.create({
    data: {
      groupId: group.id,
      channelId: channel.id,
      userId: input.userId,
      membershipId: membership.id,
      content,
      messageType,
      mediaUrl: input.mediaUrl ?? null,
      mediaKey: input.mediaKey ?? null,
      mediaMime: input.mediaMime ?? null,
      mediaSize: input.mediaSize ?? null,
      replyToId: input.replyToId ?? null,
      threadRootId: input.threadRootId ?? input.replyToId ?? null,
      moderationStatus: moderation.status,
      moderationReason: moderation.reason ?? null,
      expiresAt
    },
    include: messageInclude
  });

  setImmediate(async () => {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          user: { memberships: { some: { groupId: group.id } } },
          userId: { not: input.userId }
        }
      });
      const payload = JSON.stringify({
        title: group.name,
        body: `New message in ${group.name}`,
        groupId: group.id,
        channelId: input.channelId,
        url: `/`
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }, payload);
        } catch (e: any) {
          if (e.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    } catch (e) {
      console.error("Push notification error:", e);
    }
  });

  return message;
}
