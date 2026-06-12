import type { Server as HttpServer } from "node:http";
import cookie from "cookie";
import { MessageType, UserRole } from "@prisma/client";
import { Redis } from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { z } from "zod";
import { env } from "./config/env.js";
import { verifyAccessToken } from "./lib/crypto.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { assertApprovedMembership } from "./services/access.js";
import { createChatMessage, messageInclude, toPublicMessage } from "./services/messages.js";
import { audit } from "./utils/audit.js";
import { validateEmoji } from "./utils/sanitize.js";

type SocketAuth = {
  userId: string;
  role: UserRole;
  sessionId?: string;
};

type Ack<T> = (response: { ok: true; data: T } | { ok: false; error: string }) => void;

const groupJoinSchema = z.object({
  groupId: z.string().min(1)
});

const channelJoinSchema = z.object({
  groupId: z.string().min(1),
  channelId: z.string().min(1)
});

const sendMessageSchema = z.object({
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
  clientId: z.string().max(80).optional()
});

const messageActionSchema = z.object({
  messageId: z.string().min(1)
});

const reactionSchema = messageActionSchema.extend({
  emoji: z.string().min(1).max(32)
});

const voiceJoinSchema = z.object({
  groupId: z.string().min(1),
  channelId: z.string().min(1)
});

const voiceSignalSchema = z.object({
  targetSocketId: z.string().min(1),
  signal: z.any()
});

function roomForGroup(groupId: string) {
  return `group:${groupId}`;
}

function roomForChannel(channelId: string) {
  return `channel:${channelId}`;
}

function tokenFromHandshake(socketCookie: string | undefined, authToken: unknown) {
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const cookies = cookie.parse(socketCookie ?? "");
  return cookies.notrace_access ?? null;
}

function ackError<T>(ack: Ack<T> | undefined, error: unknown) {
  const message = error instanceof Error ? error.message : "Realtime event failed.";
  ack?.({ ok: false, error: message });
}

let ioInstance: Server | null = null;

export function getSocketServer() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

export async function setupRealtime(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.APP_ORIGIN,
      credentials: true
    },
    maxHttpBufferSize: 1_000_000,
    transports: ["websocket", "polling"]
  });

  if (env.REDIS_URL) {
    const pubClient = new Redis(env.REDIS_URL);
    const subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("socket.io redis adapter enabled");
  }

  io.use((socket, next) => {
    try {
      const token = tokenFromHandshake(socket.handshake.headers.cookie, socket.handshake.auth.token);
      if (!token) {
        next(new Error("Authentication required."));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.auth = {
        userId: payload.sub,
        role: payload.role as UserRole,
        ...(payload.sid ? { sessionId: payload.sid } : {})
      } satisfies SocketAuth;
      next();
    } catch {
      next(new Error("Invalid authentication token."));
    }
  });

  io.on("connection", (socket) => {
    const auth = socket.data.auth as SocketAuth;

    void prisma.user.update({
      where: { id: auth.userId },
      data: { lastActiveAt: new Date() }
    });

    socket.on("group:join", async (payload, ack?: Ack<{ joined: true }>) => {
      try {
        const input = groupJoinSchema.parse(payload);
        await assertApprovedMembership(auth.userId, input.groupId);
        await socket.join(roomForGroup(input.groupId));
        ack?.({ ok: true, data: { joined: true } });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("channel:join", async (payload, ack?: Ack<{ joined: true }>) => {
      try {
        const input = channelJoinSchema.parse(payload);
        await assertApprovedMembership(auth.userId, input.groupId);
        const channel = await prisma.channel.findUniqueOrThrow({ where: { id: input.channelId } });
        if (channel.groupId !== input.groupId) {
          throw new Error("Channel not found.");
        }

        await socket.join(roomForChannel(input.channelId));
        ack?.({ ok: true, data: { joined: true } });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("typing:start", async (payload) => {
      try {
        const input = channelJoinSchema.parse(payload);
        const [membership, group] = await Promise.all([
          assertApprovedMembership(auth.userId, input.groupId),
          prisma.group.findUniqueOrThrow({ where: { id: input.groupId } })
        ]);

        if (!group.typingEnabled) {
          return;
        }

        socket.to(roomForChannel(input.channelId)).emit("typing:update", {
          channelId: input.channelId,
          anonymousName: membership.anonymousName,
          avatarSeed: membership.avatarSeed,
          isTyping: true
        });
      } catch {
        // Typing indicators are ephemeral; failed updates do not need client-visible errors.
      }
    });

    socket.on("typing:stop", async (payload) => {
      try {
        const input = channelJoinSchema.parse(payload);
        const membership = await assertApprovedMembership(auth.userId, input.groupId);
        socket.to(roomForChannel(input.channelId)).emit("typing:update", {
          channelId: input.channelId,
          anonymousName: membership.anonymousName,
          avatarSeed: membership.avatarSeed,
          isTyping: false
        });
      } catch {
        // Ephemeral event.
      }
    });

    socket.on("message:send", async (payload, ack?: Ack<{ message: unknown; clientId?: string }>) => {
      try {
        const input = sendMessageSchema.parse(payload);
        const message = await createChatMessage({
          userId: auth.userId,
          groupId: input.groupId,
          channelId: input.channelId,
          content: input.content,
          messageType: input.messageType,
          mediaUrl: input.mediaUrl,
          mediaKey: input.mediaKey,
          mediaMime: input.mediaMime,
          mediaSize: input.mediaSize,
          replyToId: input.replyToId,
          threadRootId: input.threadRootId
        });
        const publicMessage = toPublicMessage(message);

        io.to(roomForChannel(input.channelId)).emit("message:new", {
          message: publicMessage,
          clientId: input.clientId
        });
        ack?.({
          ok: true,
          data: {
            message: publicMessage,
            ...(input.clientId ? { clientId: input.clientId } : {})
          }
        });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("message:delete", async (payload, ack?: Ack<{ message: unknown }>) => {
      try {
        const input = messageActionSchema.parse(payload);
        const message = await prisma.message.findUniqueOrThrow({ where: { id: input.messageId } });
        await assertApprovedMembership(auth.userId, message.groupId);

        if (message.userId !== auth.userId && auth.role !== UserRole.ADMIN) {
          throw new Error("Only the author or an administrator can delete this message.");
        }

        const deleted = await prisma.message.update({
          where: { id: message.id },
          data: {
            deletedAt: new Date(),
            deletedById: auth.userId,
            content: null,
            mediaUrl: null,
            mediaKey: null
          },
          include: messageInclude
        });
        const publicMessage = toPublicMessage(deleted);

        io.to(roomForChannel(message.channelId)).emit("message:deleted", { message: publicMessage });
        ack?.({ ok: true, data: { message: publicMessage } });

        await audit({
          actorId: auth.userId,
          groupId: message.groupId,
          action: "message.deleted",
          targetId: message.id
        });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("reaction:toggle", async (payload, ack?: Ack<{ message: unknown }>) => {
      try {
        const input = reactionSchema.parse(payload);
        const emoji = validateEmoji(input.emoji);
        const message = await prisma.message.findUniqueOrThrow({ where: { id: input.messageId } });
        await assertApprovedMembership(auth.userId, message.groupId);

        const existing = await prisma.reaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId: message.id,
              userId: auth.userId,
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
              userId: auth.userId,
              emoji
            }
          });
        }

        const updated = await prisma.message.findUniqueOrThrow({
          where: { id: message.id },
          include: messageInclude
        });
        const publicMessage = toPublicMessage(updated);

        io.to(roomForChannel(message.channelId)).emit("reaction:updated", { message: publicMessage });
        ack?.({ ok: true, data: { message: publicMessage } });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("message:read", async (payload) => {
      try {
        const input = channelJoinSchema.parse(payload);
        const [membership, group] = await Promise.all([
          assertApprovedMembership(auth.userId, input.groupId),
          prisma.group.findUniqueOrThrow({ where: { id: input.groupId } })
        ]);

        if (!group.readReceiptsEnabled) {
          return;
        }

        socket.to(roomForChannel(input.channelId)).emit("message:receipt", {
          channelId: input.channelId,
          membershipId: membership.id,
          anonymousName: membership.anonymousName,
          readAt: new Date().toISOString()
        });
      } catch {
        // Optional privacy-sensitive feature; ignore failed receipts.
      }
    });

    socket.on("voice:join", async (payload, ack?: Ack<{ peers: { socketId: string; userId: string; anonymousName: string; avatarSeed: string }[] }>) => {
      try {
        const input = voiceJoinSchema.parse(payload);
        const membership = await assertApprovedMembership(auth.userId, input.groupId);
        const voiceRoom = `voice:${input.channelId}`;

        // Store user details in socket data
        socket.data.voiceUser = {
          anonymousName: membership.anonymousName,
          avatarSeed: membership.avatarSeed
        };

        // Find existing peers in this room
        const socketIdsInRoom = Array.from(io.sockets.adapter.rooms.get(voiceRoom) || []);
        const activePeers: { socketId: string; userId: string; anonymousName: string; avatarSeed: string }[] = [];

        for (const sid of socketIdsInRoom) {
          const s = io.sockets.sockets.get(sid);
          if (s && s.id !== socket.id) {
            activePeers.push({
              socketId: s.id,
              userId: s.data.auth.userId,
              anonymousName: s.data.voiceUser?.anonymousName || "Anonymous",
              avatarSeed: s.data.voiceUser?.avatarSeed || ""
            });
          }
        }

        await socket.join(voiceRoom);

        // Notify others
        socket.to(voiceRoom).emit("voice:user-joined", {
          socketId: socket.id,
          userId: auth.userId,
          anonymousName: membership.anonymousName,
          avatarSeed: membership.avatarSeed
        });

        ack?.({ ok: true, data: { peers: activePeers } });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("voice:leave", async (payload, ack?: Ack<{ success: true }>) => {
      try {
        const input = voiceJoinSchema.parse(payload);
        const voiceRoom = `voice:${input.channelId}`;

        await socket.leave(voiceRoom);

        socket.to(voiceRoom).emit("voice:user-left", {
          socketId: socket.id,
          userId: auth.userId
        });

        ack?.({ ok: true, data: { success: true } });
      } catch (error) {
        ackError(ack, error);
      }
    });

    socket.on("voice:signal", (payload) => {
      try {
        const input = voiceSignalSchema.parse(payload);
        io.to(input.targetSocketId).emit("voice:signal", {
          senderSocketId: socket.id,
          signal: input.signal
        });
      } catch {
        // Silent catch for invalid signals
      }
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith("voice:")) {
          socket.to(room).emit("voice:user-left", {
            socketId: socket.id,
            userId: auth.userId
          });
        }
      });
    });

    socket.on("disconnect", () => {
      void prisma.user.update({
        where: { id: auth.userId },
        data: { lastActiveAt: new Date() }
      });
    });
  });

  ioInstance = io;
  return io;
}
