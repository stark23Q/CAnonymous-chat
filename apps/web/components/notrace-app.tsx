"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellOff, CircleDot, Ghost, Hash, Menu, MessageSquare, Plus, RefreshCw, Search, Settings, Shield, UserPlus, VenetianMask, Vote } from "lucide-react";
import { ChannelList } from "@/components/chat/channel-list";
import { Composer } from "@/components/chat/composer";
import { ConfessionComposer } from "@/components/chat/confession-composer";
import { ConfessionsPanel } from "@/components/chat/confessions-panel";
import { EphemeralChat } from "@/components/chat/ephemeral-chat";
import { IdentityPanel } from "@/components/chat/identity-panel";
import { MessageList } from "@/components/chat/message-list";
import { PollsPanel } from "@/components/chat/polls-panel";
import { QAPanel } from "@/components/chat/qa-panel";
import { AdminPanel } from "@/components/dashboard/admin-panel";
import type { AdminReport } from "@/components/dashboard/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { communities as seedCommunities, initialMessages, joinRequests as seedRequests, members as seedMembers } from "@/lib/sample-data";
import type { Channel, ChatMessage, Community, JoinRequest, Member, NoTraceUser, Poll, Confession, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { useRouter } from "next/navigation";
import { AccessPortal } from "@/components/access-portal";

type AuthResponse = {
  user: NoTraceUser;
  accessToken: string;
};

type ApiGroup = Community & {
  _count?: {
    memberships?: number;
    messages?: number;
    joinRequests?: number;
  };
};

type ApiJoinRequest = {
  id: string;
  groupId: string;
  requestedAlias: string | null;
  reason: string | null;
  createdAt: string;
  status: JoinRequest["status"];
  group: {
    id: string;
    name: string;
  };
};

type ApiMember = Member & {
  user?: {
    id: string;
    role: string;
  };
};

const fallbackNotice = "Live API unavailable, showing local sample data.";

function toCommunity(group: ApiGroup): Community {
  return {
    id: group.id,
    ...(group.slug ? { slug: group.slug } : {}),
    name: group.name,
    description: group.description,
    createdById: group.createdById,
    rules: group.rules,
    retentionPolicy: group.retentionPolicy,
    privacyMode: group.privacyMode,
    readReceiptsEnabled: group.readReceiptsEnabled,
    typingEnabled: group.typingEnabled,
    e2eeMode: group.e2eeMode,
    channels: group.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      kind: channel.kind
    })),
    memberCount: group._count?.memberships ?? group.memberCount ?? 0
  };
}

function toJoinRequest(request: ApiJoinRequest): JoinRequest {
  return {
    id: request.id,
    groupId: request.groupId,
    groupName: request.group.name,
    requestedAlias: request.requestedAlias,
    reason: request.reason ?? "No reason provided.",
    createdAt: request.createdAt,
    status: request.status
  };
}

function toMember(member: ApiMember): Member {
  return {
    id: member.id,
    anonymousName: member.anonymousName,
    avatarSeed: member.avatarSeed,
    status: member.status,
    joinedAt: member.joinedAt
  };
}

export function NoTraceApp() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem("notrace_access")
  );
  const [user, setUser] = useState<NoTraceUser | null>(null);
  const [communities, setCommunities] = useState<Community[]>(seedCommunities);
  const [selectedCommunityId, setSelectedCommunityId] = useState(seedCommunities[0]?.id ?? "");
  const [selectedChannelId, setSelectedChannelId] = useState(seedCommunities[0]?.channels[0]?.id ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [requests, setRequests] = useState<JoinRequest[]>(seedRequests);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [latestInvite, setLatestInvite] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState("Connecting to NoTrace API...");
  const [loading, setLoading] = useState(true);
  const [liveReady, setLiveReady] = useState(false);

  // Phase 2 — Polls & Confessions
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showPolls, setShowPolls] = useState(false);
  const [showConfessions, setShowConfessions] = useState(false);


  // Phase 3 — Q&A, Identity, Ephemeral Chat
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQA, setShowQA] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);

  // Rename Dialogs
  const [channelDialog, setChannelDialog] = useState<{ open: boolean; mode: "CREATE" | "RENAME"; channelId?: string; name: string }>({ open: false, mode: "CREATE", name: "" });
  const [groupRenameDialog, setGroupRenameDialog] = useState<{ open: boolean; groupId: string; name: string }>({ open: false, groupId: "", name: "" });
  
  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; communityId?: string; name?: string }>({ open: false, x: 0, y: 0 });

  const { socket, connected } = useSocket(accessToken);
  const selectedCommunity = communities.find((community) => community.id === selectedCommunityId) ?? communities[0];
  const selectedChannel =
    selectedCommunity?.channels.find((channel) => channel.id === selectedChannelId) ?? selectedCommunity?.channels[0];

  const channelMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return messages.filter((message) => {
      if (message.channelId !== selectedChannel?.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      return `${message.author.anonymousName} ${message.content ?? ""}`.toLowerCase().includes(query);
    });
  }, [messages, searchQuery, selectedChannel?.id]);

  const loadGroups = useCallback(async () => {
    const data = await apiFetch<{ groups: ApiGroup[] }>("/api/groups");
    const nextCommunities = data.groups.map(toCommunity);
    const firstCommunity = nextCommunities[0];
    setCommunities(nextCommunities);
    setSelectedCommunityId(firstCommunity?.id ?? "");
    setSelectedChannelId(firstCommunity?.channels[0]?.id ?? "");
    setMessages([]);
    setRequests([]);
    setMembers([]);
    setLiveReady(true);
    setNotice(nextCommunities.length ? "Live API connected." : "Live API connected. Create a community to begin.");
  }, []);

  const loadRequests = useCallback(async (groupId: string) => {
    const data = await apiFetch<{ requests: ApiJoinRequest[] }>(
      `/api/admin/join-requests?groupId=${encodeURIComponent(groupId)}`
    );
    setRequests(data.requests.map(toJoinRequest));
  }, []);

  const loadMembers = useCallback(async (groupId: string) => {
    const data = await apiFetch<{ members: ApiMember[] }>(`/api/admin/groups/${groupId}/members`);
    setMembers(data.members.map(toMember));
  }, []);

  const loadReports = useCallback(async (groupId: string) => {
    try {
      const data = await apiFetch<{ reports: AdminReport[] }>(`/api/admin/reports?groupId=${groupId}`);
      setReports(data.reports);
    } catch {
      // non-critical, don't surface error
    }
  }, []);

  const loadMessages = useCallback(async (groupId: string, channelId: string) => {
    const data = await apiFetch<{ messages: ChatMessage[] }>(
      `/api/groups/${groupId}/channels/${channelId}/messages?limit=80`
    );
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        let token = typeof window === "undefined" ? null : window.localStorage.getItem("notrace_access");
        if (token) {
          try {
            const data = await apiFetch<{ user: NoTraceUser }>("/api/auth/me");
            if (!active) {
              return;
            }
            setUser(data.user);
            setAccessToken(token);
          } catch {
            window.localStorage.removeItem("notrace_access");
            token = null;
          }
        }

        if (!token) {
          if (active) {
            setLoading(false);
          }
        }
      } catch {
        if (active) {
          setNotice(fallbackNotice);
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    setLoading(true);
    setLiveReady(false);
    loadGroups()
      .catch(() => {
        if (active) {
          setLiveReady(false);
          setNotice(fallbackNotice);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, loadGroups]);

  useEffect(() => {
    if (!selectedCommunity) {
      return;
    }

    if (selectedCommunity.id !== selectedCommunityId) {
      setSelectedCommunityId(selectedCommunity.id);
      setSelectedChannelId(selectedCommunity.channels[0]?.id ?? "");
      return;
    }

    if (!selectedCommunity.channels.some((channel) => channel.id === selectedChannelId)) {
      setSelectedChannelId(selectedCommunity.channels[0]?.id ?? "");
    }
  }, [selectedChannelId, selectedCommunity, selectedCommunityId]);

  useEffect(() => {
    if (!liveReady || !accessToken || !selectedCommunity?.id || !selectedChannel?.id) {
      return;
    }

    if (selectedCommunity.id !== selectedCommunityId || selectedChannel.id !== selectedChannelId) {
      return;
    }

    void loadMessages(selectedCommunity.id, selectedChannel.id).catch(() => setNotice("Could not load messages."));
  }, [accessToken, liveReady, loadMessages, selectedChannel?.id, selectedChannelId, selectedCommunity?.id, selectedCommunityId]);

  useEffect(() => {
    if (!liveReady || !accessToken || !selectedCommunity?.id || user?.role !== "ADMIN") {
      return;
    }

    if (selectedCommunity.id !== selectedCommunityId) {
      return;
    }

    void Promise.all([loadRequests(selectedCommunity.id), loadMembers(selectedCommunity.id), loadReports(selectedCommunity.id)]).catch(() =>
      setNotice("Could not load admin data.")
    );
  }, [accessToken, liveReady, loadMembers, loadReports, loadRequests, selectedCommunity?.id, selectedCommunityId, user?.role]);

  useEffect(() => {
    if (!liveReady || !socket || !selectedCommunity?.id || !selectedChannel?.id) {
      return;
    }

    if (selectedCommunity.id !== selectedCommunityId || selectedChannel.id !== selectedChannelId) {
      return;
    }

    socket.emit("group:join", { groupId: selectedCommunity.id });
    socket.emit("channel:join", { groupId: selectedCommunity.id, channelId: selectedChannel.id });

    const upsertMessage = ({ message }: { message: ChatMessage }) => {
      setMessages((current) => {
        const exists = current.some((item) => item.id === message.id);
        if (exists) {
          return current.map((item) => (item.id === message.id ? message : item));
        }

        return [...current, message];
      });
    };

    const onTyping = (payload: { channelId: string; anonymousName: string; isTyping: boolean }) => {
      if (payload.channelId === selectedChannel.id) {
        setTyping(payload.isTyping ? payload.anonymousName : null);
      }
    };

    socket.on("message:new", upsertMessage);
    socket.on("message:deleted", upsertMessage);
    socket.on("reaction:updated", upsertMessage);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("message:new", upsertMessage);
      socket.off("message:deleted", upsertMessage);
      socket.off("reaction:updated", upsertMessage);
      socket.off("typing:update", onTyping);
    };
  }, [liveReady, socket, connected, selectedCommunity?.id, selectedCommunityId, selectedChannel?.id, selectedChannelId]);

  if (!selectedCommunity || !selectedChannel) {
    return (
      <div className="grid h-dvh place-items-center bg-background text-sm text-muted-foreground">
        {loading ? "Opening NoTrace..." : notice}
      </div>
    );
  }

  const selectCommunity = (community: Community) => {
    setSelectedCommunityId(community.id);
    setSelectedChannelId(community.channels[0]?.id ?? "");
  };

  const createCommunity = async () => {
    try {
      const label = communities.length + 1;
      const data = await apiFetch<{ group: ApiGroup }>("/api/admin/groups", {
        method: "POST",
        body: JSON.stringify({
          name: `NoTrace Room ${label}`,
          description: "New invite-only anonymous community",
          rules: "Protect anonymity. No doxxing. No harassment.",
          retentionPolicy: "DAYS_7",
          privacyMode: true,
          readReceiptsEnabled: false,
          typingEnabled: true,
          e2eeMode: false
        })
      });
      const community = toCommunity(data.group);
      setCommunities((current) => [community, ...current]);
      setSelectedCommunityId(community.id);
      setSelectedChannelId(community.channels[0]?.id ?? "");
      setNotice(`${community.name} created.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create community.");
    }
  };

  const deleteCommunity = async () => {
    if (!window.confirm("Are you sure you want to delete this room? This action cannot be undone.")) return;
    try {
      await apiFetch(`/api/admin/groups/${selectedCommunity.id}`, {
        method: "DELETE"
      });
      const remaining = communities.filter(c => c.id !== selectedCommunity.id);
      setCommunities(remaining);
      if (remaining.length > 0) {
        selectCommunity(remaining[0]);
      } else {
        setSelectedCommunityId("");
        setSelectedChannelId("");
      }
      setNotice("Room deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not delete room.");
    }
  };

  const submitChannelDialog = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = channelDialog.name.trim();
    if (!name || !accessToken || !selectedCommunityId) return;

    try {
      if (channelDialog.mode === "CREATE") {
        const res = await apiFetch<{ channel: Channel }>(`/api/admin/groups/${selectedCommunityId}/channels`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name })
        });
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === selectedCommunityId ? { ...c, channels: [...c.channels, res.channel] } : c
          )
        );
        setSelectedChannelId(res.channel.id);
        setNotice(`Channel #${res.channel.name} created.`);
      } else if (channelDialog.mode === "RENAME" && channelDialog.channelId) {
        const res = await apiFetch<{ channel: Channel }>(`/api/admin/groups/${selectedCommunityId}/channels/${channelDialog.channelId}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name })
        });
        setCommunities((prev) =>
          prev.map((c) =>
            c.id === selectedCommunityId ? {
              ...c,
              channels: c.channels.map(ch => ch.id === channelDialog.channelId ? { ...ch, name } : ch)
            } : c
          )
        );
        setNotice(`Channel renamed to #${name}`);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save channel");
    } finally {
      setChannelDialog({ open: false, mode: "CREATE", name: "" });
    }
  };

  const createInvite = async () => {
    try {
      const data = await apiFetch<{ code: string; requestUrl: string }>(
        `/api/admin/groups/${selectedCommunity.id}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({
            label: "Generated from NoTrace UI",
            maxUses: 50,
            expiresInHours: 72
          })
        }
      );
      setLatestInvite(data.requestUrl);
      await navigator.clipboard?.writeText(data.requestUrl);
      setNotice("Live invite generated and copied.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create invite.");
    }
  };

  const sendMessage = (content: string, kind: "TEXT" | "MEME" | "FILE" = "TEXT", expiresInSeconds?: number | null, fileMeta?: { size: number; mime: string; name: string }) => {
    const payload = {
      groupId: selectedCommunity.id,
      channelId: selectedChannel.id,
      content: kind === "MEME" ? "Shared an image" : content,
      messageType: kind,
      mediaUrl:
        kind === "MEME"
          ? content
          : undefined,
      mediaMime: kind === "FILE" ? fileMeta?.mime || "application/octet-stream" : kind === "MEME" ? "image/jpeg" : undefined,
      mediaSize: kind === "FILE" ? fileMeta?.size || 0 : kind === "MEME" ? 420_000 : undefined,
      replyToId: replyTo?.id,
      expiresInSeconds: expiresInSeconds ?? undefined,
      clientId: `web-${Date.now()}`
    };

    setReplyTo(null);

    if (socket && connected) {
      socket.emit("message:send", payload, (response: { ok: boolean; error?: string }) => {
        if (!response.ok) {
          setNotice(response.error ?? "Message failed.");
        }
      });
      return;
    }

    void apiFetch<{ message: ChatMessage }>("/api/messages", {
      method: "POST",
      body: JSON.stringify(payload)
    })
      .then((data) => setMessages((current) => [...current, data.message]))
      .catch((error) => setNotice(error instanceof Error ? error.message : "Message failed."));
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (socket && connected) {
      socket.emit("reaction:toggle", { messageId, emoji });
      return;
    }

    void apiFetch<{ message: ChatMessage }>(`/api/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji })
    })
      .then((data) => setMessages((current) => current.map((message) => (message.id === messageId ? data.message : message))))
      .catch((error) => setNotice(error instanceof Error ? error.message : "Reaction failed."));
  };

  const deleteMessage = (messageId: string) => {
    if (socket && connected) {
      socket.emit("message:delete", { messageId });
      return;
    }

    void apiFetch<{ message: ChatMessage }>(`/api/messages/${messageId}`, { method: "DELETE" })
      .then((data) => setMessages((current) => current.map((message) => (message.id === messageId ? data.message : message))))
      .catch((error) => setNotice(error instanceof Error ? error.message : "Delete failed."));
  };

  // ─── Phase 2: Polls ───────────────────────────────────────────
  const loadPolls = useCallback(async (groupId: string) => {
    try {
      const data = await apiFetch<{ polls: Poll[] }>(`/api/groups/${groupId}/polls`);
      setPolls(data.polls);
    } catch { /* non-critical */ }
  }, []);

  const createPoll = async (payload: { question: string; options: string[]; closesAt?: string }) => {
    const { question, options, closesAt } = payload;
    if (!selectedCommunity || !selectedChannel) return;
    try {
      const data = await apiFetch<{ poll: Poll }>(
        `/api/groups/${selectedCommunity.id}/channels/${selectedChannel.id}/polls`,
        { method: "POST", body: JSON.stringify({ question, options, closesAt }) }
      );
      setPolls((current) => [data.poll, ...current]);
      setNotice("Poll created!");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Poll creation failed.");
    }
  };

  const votePoll = async (pollId: string, optionId: string) => {
    try {
      await apiFetch(`/api/groups/polls/${pollId}/votes`, {
        method: "POST",
        body: JSON.stringify({ optionId })
      });
      if (selectedCommunity) await loadPolls(selectedCommunity.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Vote failed.");
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!selectedCommunity || !selectedChannel) return;
    try {
      await apiFetch(`/api/groups/${selectedCommunity.id}/channels/${selectedChannel.id}/polls/${pollId}`, {
        method: "DELETE"
      });
      setPolls(prev => prev.filter(p => p.id !== pollId));
      setNotice("Poll deleted.");
    } catch (error) {
      setNotice("Failed to delete poll.");
    }
  };

  // ─── Phase 2: Confessions ────────────────────────────────────
  const postConfession = useCallback(
    async (content: string) => {
      if (!selectedCommunity) return;
      try {
        const response = await apiFetch<{ confession: Confession }>(`/api/groups/${selectedCommunity.id}/confessions`, {
          method: "POST",
          body: JSON.stringify({ content })
        });
        setNotice("🤫 Confession posted anonymously!");
        window.dispatchEvent(new CustomEvent("confession:posted", { detail: response.confession }));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Failed to post confession");
      }
    },
    [selectedCommunity]
  );
  // ─── Phase 3: Q&A ────────────────────────────────────────────
  const loadQuestions = useCallback(async (groupId: string) => {
    try {
      const data = await apiFetch<{ questions: Question[] }>(`/api/groups/${groupId}/questions`);
      setQuestions(data.questions);
    } catch { /* non-critical */ }
  }, []);

  const askQuestion = async (question: string) => {
    if (!selectedCommunity) return;
    try {
      const data = await apiFetch<{ question: Question }>(`/api/groups/${selectedCommunity.id}/questions`, {
        method: "POST",
        body: JSON.stringify({ question })
      });
      setQuestions((current) => [data.question, ...current]);
      setNotice("❓ Question submitted anonymously!");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Question failed.");
    }
  };

  const answerQuestion = async (questionId: string, answer: string) => {
    if (!selectedCommunity) return;
    try {
      const data = await apiFetch<{ question: Question }>(
        `/api/groups/${selectedCommunity.id}/questions/${questionId}/answer`,
        { method: "PATCH", body: JSON.stringify({ answer }) }
      );
      setQuestions((current) => current.map((q) => (q.id === questionId ? data.question : q)));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Answer failed.");
    }
  };

  // ─── Phase 3: Identity Rotation ──────────────────────────────
  const rotateIdentity = async () => {
    if (!selectedCommunity) return;
    setIdentityLoading(true);
    try {
      const data = await apiFetch<{ membership: { anonymousName: string; avatarSeed: string } }>(
        `/api/groups/${selectedCommunity.id}/membership/rotate-identity`,
        { method: "PATCH", body: JSON.stringify({}) }
      );
      if (user) {
        setUser({ ...user, anonymousName: data.membership.anonymousName, avatarSeed: data.membership.avatarSeed });
      }
      setShowIdentity(false);
      setNotice("🔄 Identity rotated! You're now anonymous under a new alias.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Identity rotation failed.");
    } finally {
      setIdentityLoading(false);
    }
  };

  const startDirectMessage = async (targetMembershipId: string) => {
    try {
      const data = await apiFetch<{ group: ApiGroup }>("/api/groups/dm", {
        method: "POST",
        body: JSON.stringify({ targetMembershipId })
      });
      const dmCommunity = toCommunity(data.group);
      
      setCommunities((current) => {
        if (!current.some(c => c.id === dmCommunity.id)) {
          return [dmCommunity, ...current];
        }
        return current;
      });
      
      setSelectedCommunityId(dmCommunity.id);
      setSelectedChannelId(dmCommunity.channels[0]?.id ?? "");
      setNotice("Direct Message started.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start DM.");
    }
  };

  const reportMessage = async (messageId: string, reason: string) => {
    try {
      await apiFetch(`/api/groups/${selectedCommunity.id}/messages/${messageId}/report`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      setNotice("Message reported to admin.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not report message.");
    }
  };

  const updateIdentityName = async (newName: string) => {
    if (!accessToken || !user || !selectedCommunityId) return;
    setIdentityLoading(true);
    try {
      const { membership } = await apiFetch<{ membership: { id: string; anonymousName: string; avatarSeed: string } }>(
        `/api/groups/${selectedCommunityId}/membership/name`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ newName })
        }
      );
      setUser({ ...user, anonymousName: membership.anonymousName });
      setNotice("Your alias has been changed successfully.");
    } catch (err) {
      setNotice("Could not change name.");
    } finally {
      setIdentityLoading(false);
    }
  };

  const updateGroupName = async (newName: string, targetGroupId?: string) => {
    const idToUpdate = targetGroupId || selectedCommunityId;
    if (!accessToken || !user || !idToUpdate) return;
    try {
      await apiFetch(
        `/api/admin/groups/${idToUpdate}/settings`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ name: newName })
        }
      );
      setCommunities(prev => prev.map(c => c.id === idToUpdate ? { ...c, name: newName } : c));
      setNotice("The group name has been updated.");
    } catch (err) {
      setNotice("Could not rename group.");
    }
  };

  const reviewReport = async (reportId: string, action: "DISMISSED" | "ACTIONED") => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: action })
      });
      setReports((current) =>
        current.map((r) => (r.id === reportId ? { ...r, status: action } : r))
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Report review failed.");
    }
  };

  const updateGroupSettings = async (settings: Partial<Community>) => {
    const data = await apiFetch<{ group: ApiGroup }>(`/api/admin/groups/${selectedCommunity.id}/settings`, {
      method: "PATCH",
      body: JSON.stringify(settings)
    });
    const updated = toCommunity(data.group);
    setCommunities((current) => current.map((community) => (community.id === updated.id ? updated : community)));
  };

  const approveRequest = async (requestId: string) => {
    setBusyRequestId(requestId);
    try {
      await apiFetch(`/api/admin/join-requests/${requestId}/approve`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setNotice("Join request approved. The user will automatically join.");
      await loadRequests(selectedCommunity.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setBusyRequestId(null);
    }
  };

  const rejectRequest = async (requestId: string) => {
    setBusyRequestId(requestId);
    try {
      await apiFetch(`/api/admin/join-requests/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({})
      });
      setNotice("Join request rejected.");
      await loadRequests(selectedCommunity.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Reject failed.");
    } finally {
      setBusyRequestId(null);
    }
  };

  const toggleBan = async (member: Member) => {
    try {
      await apiFetch(`/api/admin/memberships/${member.id}/${member.status === "BANNED" ? "remove" : "ban"}`, {
        method: "POST",
        body: JSON.stringify({})
      });
      await loadMembers(selectedCommunity.id);
      setNotice(member.status === "BANNED" ? "Member removed." : "Member banned.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Member action failed.");
    }
  };

  return (
    <TooltipProvider>
      <div className="noise" />
      {(!accessToken || !user) ? (
        <AccessPortal
          onAuthenticated={(token, usr) => {
            window.localStorage.setItem("notrace_access", token);
            setAccessToken(token);
            setUser(usr);
          }}
        />
      ) : (
      <main className="relative z-10 grid h-dvh grid-cols-[64px_minmax(0,1fr)] overflow-hidden bg-transparent text-foreground lg:grid-cols-[72px_280px_minmax(0,1fr)]">
        <nav className="flex h-full flex-col items-center border-r border-white/5 glass-panel py-3">
          <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-primary/40 bg-primary/20 text-primary shadow-[0_0_15px_-3px] shadow-primary/30">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex flex-1 flex-col items-center gap-3">
            {communities.map((community) => (
              <Tooltip key={community.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => selectCommunity(community)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (community.id === "DM" || community.id.startsWith("dm_")) {
                        setNotice("Cannot modify DM groups.");
                        return;
                      }
                      if (user?.role === "ADMIN" || community.createdById === user?.id) {
                        setContextMenu({ open: true, x: e.clientX, y: e.clientY, communityId: community.id, name: community.name });
                      } else {
                        setNotice("Only admins can manage this group.");
                      }
                    }}
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl border text-sm font-black transition-all hover:scale-105",
                      community.id === selectedCommunityId
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_-3px] shadow-primary/40"
                        : "border-white/10 bg-black/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    )}
                  >
                    {community.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{community.name}</TooltipContent>
              </Tooltip>
            ))}
            <Button type="button" variant="ghost" size="icon" onClick={() => void createCommunity()}>
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => setNotice("Use the Admin settings panel on the right.")}>
            <Settings className="h-4 w-4" aria-hidden />
          </Button>
        </nav>

        <section
          className={cn(
            "absolute inset-y-0 left-16 z-20 w-[280px] border-r border-white/5 glass-panel shadow-soft transition-transform lg:static lg:z-auto lg:block lg:w-auto lg:translate-x-0 lg:shadow-none",
            mobileChannelsOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ChannelList
            community={selectedCommunity}
            activeChannelId={selectedChannelId}
            onSelect={(ch) => {
              setSelectedChannelId(ch.id);
              setMobileChannelsOpen(false);
            }}
            {...(user?.role === "ADMIN" || selectedCommunity.createdById === user?.id
              ? {
                  onAddChannel: () => setChannelDialog({ open: true, mode: "CREATE", name: "" }),
                  onEditChannel: (ch: Channel) => setChannelDialog({ open: true, mode: "RENAME", channelId: ch.id, name: ch.name })
                }
              : {})}
          />
        </section>

        {/* Main Interface */}
        <section className={cn(
          "grid min-w-0 min-h-0 grid-cols-[minmax(0,1fr)]",
          user?.role === "ADMIN" && "xl:grid-cols-[minmax(0,1fr)_344px]"
        )}>
          <div className="flex min-w-0 min-h-0 flex-col bg-transparent">
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 glass-panel px-3 md:px-5">
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                className="lg:hidden"
                onClick={() => setMobileChannelsOpen((current) => !current)}
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
              <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground">
                <Hash className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="shrink-0 text-sm font-bold md:text-base">#{selectedChannel.name}</h1>
                  <Badge tone={connected ? "good" : "neutral"} className="hidden sm:inline-flex">
                    {connected ? "realtime" : "api"}
                  </Badge>
                  {selectedCommunity.privacyMode ? (
                    <Badge tone="warn" className="hidden sm:inline-flex">
                      private
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <CircleDot className={cn("h-3 w-3", connected ? "text-primary" : "text-muted-foreground")} aria-hidden />
                  <span>{notice}</span>
                  {typing ? <span>{typing} typing</span> : null}
                </div>
              </div>
              <div className="hidden w-full max-w-xs items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 2xl:flex focus-within:border-primary/50 transition-colors">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  className="h-6 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Button type="button" variant={muted ? "secondary" : "ghost"} size="iconSm" onClick={() => setMuted((current) => !current)}>
                {muted ? <BellOff className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
              </Button>
              <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={showConfessions ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      setShowConfessions((v) => !v);
                      setShowPolls(false);
                      setShowQA(false);
                    }}
                  >
                    <Ghost className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Confessions</span>
                  </Button>
                  <Button
                    type="button"
                    variant={showPolls ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      setShowPolls((v) => !v);
                      setShowConfessions(false);
                      setShowQA(false);
                    }}
                  >
                    <Vote className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Polls</span>
                    {polls.length > 0 && (
                      <Badge tone="neutral" className="ml-1 h-5 px-1.5 font-normal">
                        {polls.length}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant={showQA ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => {
                      setShowQA((v) => !v);
                      setShowPolls(false);
                      setShowConfessions(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Q&A</span>
                  </Button>
                </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant={showIdentity ? "secondary" : "outline"} 
                    size="sm" 
                    onClick={() => { setShowIdentity((v) => !v); setShowPolls(false); setShowQA(false); setShowConfessions(false); }}
                    className="gap-2 border-primary/50 text-primary shadow-[0_0_15px_-3px] shadow-primary/30"
                  >
                    <VenetianMask className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">Identity</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate identity</TooltipContent>
              </Tooltip>
              <Button type="button" variant="secondary" size="sm" className="hidden sm:inline-flex" onClick={() => void createInvite()}>
                <UserPlus className="h-4 w-4" aria-hidden />
                Invite
              </Button>
            </header>

            <div className="border-b border-border bg-card/35 px-4 py-3 md:hidden">
              <div className="scrollbar-thin flex gap-2 overflow-x-auto">
                {selectedCommunity.channels.map((channel) => (
                  <Button
                    key={channel.id}
                    type="button"
                    size="sm"
                    variant={channel.id === selectedChannel.id ? "secondary" : "outline"}
                    onClick={() => setSelectedChannelId(channel.id)}
                  >
                    {channel.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden relative">
              {/* Main Content Area */}
              {showConfessions ? (
                <div className="flex-1 overflow-hidden bg-background/50">
                  <ConfessionsPanel
                    groupId={selectedCommunity.id}
                    socket={socket}
                    onClose={() => setShowConfessions(false)}
                  />
                </div>
              ) : showPolls && user ? (
                <div className="flex-1 overflow-hidden bg-background/50">
                  <PollsPanel
                    polls={polls}
                    currentUserId={user.id}
                    isAdmin={user.role === "ADMIN"}
                    onCreatePoll={createPoll}
                    onVote={votePoll}
                    onDeletePoll={deletePoll}
                    onClose={() => setShowPolls(false)}
                  />
                </div>
              ) : showQA ? (
                <div className="flex-1 overflow-hidden bg-background/50">
                  <QAPanel
                    questions={questions}
                    isAdmin={user?.role === "ADMIN"}
                    onAskQuestion={askQuestion}
                    onAnswerQuestion={answerQuestion}
                    onClose={() => setShowQA(false)}
                  />
                </div>
              ) : (
                <MessageList
                  messages={channelMessages}
                  onReact={toggleReaction}
                  onDelete={deleteMessage}
                  onReport={reportMessage}
                  onReply={setReplyTo}
                  onAvatarClick={(author) => void startDirectMessage(author.id)}
                />
              )}

              {/* Ephemeral floating panels */}
              {showIdentity && user && (
                <IdentityPanel
                  currentUser={{ anonymousName: user.anonymousName, avatarSeed: user.avatarSeed }}
                  onRotate={rotateIdentity}
                  onUpdateName={updateIdentityName}
                  onClose={() => setShowIdentity(false)}
                  isLoading={identityLoading}
                />
              )}

              {/* Composer */}
              <div className="shrink-0 pb-4">
                <Composer
                  channelName={selectedChannel.name}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                  onTyping={(isTyping) => {
                    if (!socket || !selectedCommunity?.typingEnabled) return;
                    socket.emit(isTyping ? "typing:start" : "typing:stop", { groupId: selectedCommunity.id, channelId: selectedChannel.id });
                  }}
                  onSend={sendMessage}
                  onConfess={postConfession}
                  forceConfessionMode={showConfessions}
                />
              </div>
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <AdminPanel
              community={selectedCommunity}
              requests={requests}
              members={members}
              reports={reports}
              onApprove={approveRequest}
              onReject={rejectRequest}
              onUpdateName={updateGroupName}
              busyRequestId={busyRequestId}
              onTogglePrivacy={(enabled) =>
                void updateGroupSettings({ privacyMode: enabled }).catch((error) =>
                  setNotice(error instanceof Error ? error.message : "Privacy update failed.")
                )
              }
              onToggleE2EE={(enabled) =>
                void updateGroupSettings({ e2eeMode: enabled }).catch((error) =>
                  setNotice(error instanceof Error ? error.message : "E2EE update failed.")
                )
              }
              onToggleReadReceipts={(enabled) =>
                void updateGroupSettings({ readReceiptsEnabled: enabled }).catch((error) =>
                  setNotice(error instanceof Error ? error.message : "Read receipts update failed.")
                )
              }
              onToggleTyping={(enabled) =>
                void updateGroupSettings({ typingEnabled: enabled }).catch((error) =>
                  setNotice(error instanceof Error ? error.message : "Typing indicators update failed.")
                )
              }
              onRetentionChange={(policy) =>
                void updateGroupSettings({ retentionPolicy: policy }).catch((error) =>
                  setNotice(error instanceof Error ? error.message : "Retention update failed.")
                )
              }
              onCreateInvite={() => void createInvite()}
              onDeleteRoom={() => void deleteCommunity()}
              onReviewReport={(reportId, action) => void reviewReport(reportId, action)}
              onToggleBan={(member) => void toggleBan(member)}
              latestInvite={latestInvite}
            />
          )}
        </section>
      </main>
      )}

      {/* Channel Dialog */}
      <Dialog open={channelDialog.open} onOpenChange={(open) => setChannelDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{channelDialog.mode === "CREATE" ? "Create New Channel" : "Rename Channel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitChannelDialog} className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="e.g., general, memes, study"
              value={channelDialog.name}
              onChange={(e) => setChannelDialog(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black/50 border-white/10"
              maxLength={40}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setChannelDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit" disabled={!channelDialog.name.trim()}>
                {channelDialog.mode === "CREATE" ? "Create Channel" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Group Rename Dialog */}
      <Dialog open={groupRenameDialog.open} onOpenChange={(open) => setGroupRenameDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md bg-black/90 border-white/10 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = groupRenameDialog.name.trim();
            if (trimmed) {
              await updateGroupName(trimmed, groupRenameDialog.groupId);
              setGroupRenameDialog({ open: false, groupId: "", name: "" });
            }
          }} className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="Enter new group name"
              value={groupRenameDialog.name}
              onChange={(e) => setGroupRenameDialog(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black/50 border-white/10"
              maxLength={80}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGroupRenameDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
              <Button type="submit" disabled={!groupRenameDialog.name.trim()}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Group Context Menu */}
      {contextMenu.open && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setContextMenu({ open: false, x: 0, y: 0 })}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ open: false, x: 0, y: 0 }); }}
          />
          <div 
            className="fixed z-50 w-48 bg-black/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button 
              className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/10 transition-colors"
              onClick={() => {
                setContextMenu({ open: false, x: 0, y: 0 });
                if (contextMenu.communityId && contextMenu.name) {
                  setGroupRenameDialog({ open: true, groupId: contextMenu.communityId, name: contextMenu.name });
                }
              }}
            >
              Rename Group
            </button>
            <button 
              className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              onClick={async () => {
                setContextMenu({ open: false, x: 0, y: 0 });
                if (contextMenu.communityId) {
                  if (confirm("Are you sure you want to delete this group forever?")) {
                    try {
                      await apiFetch(`/api/admin/groups/${contextMenu.communityId}`, { method: "DELETE" });
                      setCommunities(prev => prev.filter(c => c.id !== contextMenu.communityId));
                      if (selectedCommunityId === contextMenu.communityId) {
                        setSelectedCommunityId(communities[0]?.id || "");
                      }
                      setNotice("Group deleted successfully.");
                    } catch (err) {
                      setNotice("Failed to delete group.");
                    }
                  }
                }
              }}
            >
              Delete Group
            </button>
          </div>
        </>
      )}
    </TooltipProvider>
  );
}
