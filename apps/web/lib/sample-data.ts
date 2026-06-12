import type { ChatMessage, Community, JoinRequest, Member } from "./types";

export const communities: Community[] = [
  {
    id: "notrace-lounge",
    name: "NoTrace Lounge",
    description: "Invite-only anonymous room",
    createdById: "1",
    rules: "Protect anonymity. No doxxing. No harassment. Report abusive content.",
    retentionPolicy: "DAYS_7",
    privacyMode: true,
    readReceiptsEnabled: false,
    typingEnabled: true,
    e2eeMode: false,
    memberCount: 428,
    channels: [
      { id: "general", name: "general", kind: "TEXT", unread: 3 },
      { id: "memes", name: "memes", kind: "TEXT", unread: 12 },
      { id: "confessions", name: "confessions", kind: "TEXT" },
      { id: "discussion", name: "discussion", kind: "TEXT" },
      { id: "voice-room", name: "voice-room", kind: "VOICE_FUTURE" }
    ]
  },
  {
    id: "g_1",
    name: "General Tech",
    createdById: "1",
    description: "Discuss all things software and hardware.",
    rules: "Short-lived messages, no personal identifiers.",
    retentionPolicy: "HOURS_24",
    privacyMode: true,
    readReceiptsEnabled: false,
    typingEnabled: true,
    e2eeMode: true,
    memberCount: 73,
    channels: [
      { id: "after-general", name: "general", kind: "TEXT" },
      { id: "after-memes", name: "memes", kind: "TEXT" }
    ]
  }
];

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    channelId: "general",
    author: { id: "a1", anonymousName: "ShadowFox", avatarSeed: "shadowfox" },
    content: "Invite queue cleared. New aliases are rotating cleanly.",
    messageType: "TEXT",
    createdAt: "2026-06-04T11:05:00.000Z",
    expiresAt: "2026-06-11T11:05:00.000Z",
    reactions: { "✅": 4, "👀": 2 }
  },
  {
    id: "m2",
    channelId: "general",
    author: { id: "a2", anonymousName: "SilentWolf", avatarSeed: "silentwolf" },
    content: "Can we keep read receipts off for the confessions channel?",
    messageType: "TEXT",
    createdAt: "2026-06-04T11:08:00.000Z",
    expiresAt: "2026-06-11T11:08:00.000Z",
    reactions: { "🫡": 3 },
    replyTo: {
      id: "m1",
      content: "Invite queue cleared. New aliases are rotating cleanly.",
      author: { anonymousName: "ShadowFox", avatarSeed: "shadowfox" }
    }
  },
  {
    id: "m3",
    channelId: "general",
    author: { id: "a3", anonymousName: "Phantom17", avatarSeed: "phantom17" },
    content: "Dropping the rules draft here before it disappears.",
    messageType: "FILE",
    mediaUrl: "/rules.pdf",
    mediaMime: "application/pdf",
    mediaSize: 824000,
    createdAt: "2026-06-04T11:15:00.000Z",
    expiresAt: "2026-06-11T11:15:00.000Z",
    reactions: { "📎": 1 }
  },
  {
    id: "m4",
    channelId: "memes",
    author: { id: "a4", anonymousName: "RavenX", avatarSeed: "ravenx" },
    content: "Approval queue after one viral invite.",
    messageType: "MEME",
    mediaUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    mediaMime: "image/jpeg",
    mediaSize: 512000,
    createdAt: "2026-06-04T11:18:00.000Z",
    expiresAt: "2026-06-11T11:18:00.000Z",
    reactions: { "😂": 8, "🔥": 5 }
  }
];

export const joinRequests: JoinRequest[] = [
  {
    id: "jr1",
    groupId: "notrace-lounge",
    groupName: "NoTrace Lounge",
    requestedAlias: "CipherMint",
    reason: "Friend from the design circle.",
    createdAt: "2026-06-04T10:45:00.000Z",
    status: "PENDING"
  },
  {
    id: "jr2",
    groupId: "after-hours",
    groupName: "After Hours",
    requestedAlias: null,
    reason: "Has one-time invite from SilentWolf.",
    createdAt: "2026-06-04T10:51:00.000Z",
    status: "PENDING"
  }
];

export const members: Member[] = [
  {
    id: "mem1",
    anonymousName: "ShadowFox",
    avatarSeed: "shadowfox",
    status: "APPROVED",
    joinedAt: "2026-05-28T09:00:00.000Z"
  },
  {
    id: "mem2",
    anonymousName: "SilentWolf",
    avatarSeed: "silentwolf",
    status: "APPROVED",
    joinedAt: "2026-05-28T09:04:00.000Z"
  },
  {
    id: "mem3",
    anonymousName: "StaticNova",
    avatarSeed: "staticnova",
    status: "BANNED",
    joinedAt: "2026-05-30T14:12:00.000Z"
  }
];
