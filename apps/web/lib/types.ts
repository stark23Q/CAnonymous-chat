export type Channel = {
  id: string;
  name: string;
  kind: "TEXT" | "VOICE_FUTURE";
  unread?: number;
};

export type Community = {
  id: string;
  name: string;
  slug?: string;
  description: string;
  createdById: string;
  rules: string;
  retentionPolicy: "HOURS_24" | "DAYS_7" | "DAYS_30" | "NEVER";
  privacyMode: boolean;
  readReceiptsEnabled: boolean;
  typingEnabled: boolean;
  e2eeMode: boolean;
  channels: Channel[];
  memberCount: number;
};

export type NoTraceUser = {
  id: string;
  anonymousName: string;
  avatarSeed: string;
  role: "ADMIN" | "MEMBER";
  recoveryPhrase?: string;
};

export type AnonymousAuthor = {
  id: string;
  anonymousName: string;
  avatarSeed: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  author: AnonymousAuthor;
  content: string | null;
  messageType: "TEXT" | "IMAGE" | "GIF" | "MEME" | "VIDEO" | "FILE" | "SYSTEM";
  mediaUrl?: string | null;
  mediaMime?: string | null;
  mediaSize?: number | null;
  createdAt: string;
  expiresAt?: string | null;
  deletedAt?: string | null;
  reactions: Record<string, number>;
  replyTo?: {
    id: string;
    content: string | null;
    author: Pick<AnonymousAuthor, "anonymousName" | "avatarSeed">;
  } | null;
};

export type JoinRequest = {
  id: string;
  groupId: string;
  groupName: string;
  requestedAlias: string | null;
  reason: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export type Member = {
  id: string;
  anonymousName: string;
  avatarSeed: string;
  status: "APPROVED" | "PENDING" | "BANNED" | "REMOVED" | "REJECTED";
  joinedAt: string | null;
};

export type PollOption = {
  id: string;
  label: string;
  _count: { votes: number };
};

export type Poll = {
  id: string;
  channelId: string;
  createdById: string;
  question: string;
  options: PollOption[];
  closesAt: string | null;
  createdAt: string;
  votes: { userId: string; optionId: string }[];
};

export type Confession = {
  id: string;
  groupId: string;
  content: string;
  createdAt: string;
  expiresAt: string | null;
};

export type Question = {
  id: string;
  groupId: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  anonymousName: string;
  role: "ADMIN" | "MEMBER";
  lastIp: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  sessionCount: number;
  aliases: {
    groupId: string;
    groupName: string;
    anonymousName: string;
    status: string;
    joinedAt: string | null;
  }[];
};
