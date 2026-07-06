"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bell, BellOff, CircleDot, Ghost, Hash, Menu, MessageSquare, Plus, RefreshCw, Search, Settings, Shield, Sparkles, UserPlus, VenetianMask, Vote } from "lucide-react";
import { ChannelList } from "@/components/chat/channel-list";
import { Composer } from "@/components/chat/composer";
import { ConfessionComposer } from "@/components/chat/confession-composer";
import { ConfessionsPanel } from "@/components/chat/confessions-panel";
import { EphemeralChat } from "@/components/chat/ephemeral-chat";
import { IdentityPanel } from "@/components/chat/identity-panel";
import { MessageList } from "@/components/chat/message-list";
import { PollsPanel } from "@/components/chat/polls-panel";
import { QAPanel } from "@/components/chat/qa-panel";
import { VoiceChannel } from "@/components/chat/voice-channel";
import { AdminPanel } from "@/components/dashboard/admin-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import type { Channel, ChatMessage, Community, JoinRequest, Member, NoTraceUser, Poll, Confession, Question, AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/use-socket";
import { useNoTraceSocket } from "@/hooks/use-notrace-socket";
import { useNoTraceE2EE } from "@/hooks/use-notrace-e2ee";
import { useNoTraceAuth } from "@/hooks/use-notrace-auth";
import { useNoTraceData, ApiGroup, toCommunity } from "@/hooks/use-notrace-data";
import { deriveKey, encryptText } from "@/lib/e2ee";
import { useRouter } from "next/navigation";
import { AccessPortal } from "@/components/access-portal";

const fallbackNotice = "Live API unavailable, showing local sample data.";




export function NoTraceApp() {
  const router = useRouter();
  const {
    accessToken,
    setAccessToken,
    user,
    setUser,
    welcomePhrase,
    setWelcomePhrase,
    loading,
    setLoading,
    notice,
    setNotice,
    logout
  } = useNoTraceAuth({ fallbackNotice });

  const {
    communities,
    setCommunities,
    selectedCommunityId,
    setSelectedCommunityId,
    selectedChannelId,
    setSelectedChannelId,
    selectedCommunity,
    selectedChannel,
    messages,
    setMessages,
    requests,
    setRequests,
    members,
    setMembers,
    reports,
    setReports,
    adminUsers,
    setAdminUsers,
    liveReady,
    setLiveReady,
    loadAdminUsers,
    loadRequests,
    loadMembers,
    loadReports
  } = useNoTraceData({ accessToken, user, setLoading, setNotice, fallbackNotice });

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [mobileChannelsOpen, setMobileChannelsOpen] = useState(false);
  const [latestInvite, setLatestInvite] = useState<string | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [muted, setMuted] = useState(false);

  // Phase 2 — Polls & Confessions
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showPolls, setShowPolls] = useState(false);
  const [showConfessions, setShowConfessions] = useState(false);


  // Phase 3 — Q&A, Identity, Ephemeral Chat
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQA, setShowQA] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);

  // E2EE & Read Receipts States
  const {
    groupPassphrases,
    setGroupPassphrases,
    groupKeys,
    setGroupKeys,
    decryptedContents,
    setDecryptedContents
  } = useNoTraceE2EE({
    messages,
    selectedCommunityId,
    selectedChannelId,
    e2eeMode: selectedCommunity?.e2eeMode
  });
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});

  // Settings & Theme states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("notrace_theme") || "dark";
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("notrace_sound");
    return stored === null ? true : stored === "true";
  });

  // Refs for socket events to avoid dependency thrashing
  const soundEnabledRef = useRef(soundEnabled);
  const mutedRef = useRef(muted);
  const userRef = useRef(user);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Audio beep notification helper
  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current || mutedRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context block
    }
  }, []);

  // Rename Dialogs
  const [channelDialog, setChannelDialog] = useState<{ open: boolean; mode: "CREATE" | "RENAME"; channelId?: string; name: string }>({ open: false, mode: "CREATE", name: "" });
  const [groupRenameDialog, setGroupRenameDialog] = useState<{ open: boolean; groupId: string; name: string }>({ open: false, groupId: "", name: "" });
  
  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number; communityId?: string; name?: string }>({ open: false, x: 0, y: 0 });

  const { socket, connected } = useSocket(accessToken);

  const channelMessages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isE2EE = selectedCommunity?.e2eeMode;
    return messages.filter((message) => {
      if (message.channelId !== selectedChannel?.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      const content = isE2EE ? (decryptedContents[message.id] ?? "") : (message.content ?? "");
      return `${message.author.anonymousName} ${content}`.toLowerCase().includes(query);
    }).map((message) => {
      if (isE2EE) {
        return {
          ...message,
          content: decryptedContents[message.id] ?? (message.content ? "[Decrypting message...]" : null)
        };
      }
      return message;
    });
  }, [messages, searchQuery, selectedChannel?.id, selectedCommunity?.e2eeMode, decryptedContents]);



  useEffect(() => {
    setReadReceipts({});
  }, [selectedChannelId]);

  // Listen for notification click deep-links from service worker
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        const { groupId, channelId } = event.data;
        if (groupId) {
          const community = communities.find(c => c.id === groupId);
          if (community) {
            setSelectedCommunityId(community.id);
            if (channelId) {
              const channel = community.channels.find(ch => ch.id === channelId);
              setSelectedChannelId(channel?.id ?? community.channels[0]?.id ?? "");
            } else {
              setSelectedChannelId(community.channels[0]?.id ?? "");
            }
          }
        }
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [communities, setSelectedCommunityId, setSelectedChannelId]);

  const { sendReadReceipt } = useNoTraceSocket({
    socket,
    connected,
    liveReady,
    selectedCommunityId,
    selectedChannelId,
    readReceiptsEnabled: selectedCommunity?.readReceiptsEnabled,
    userAnonymousName: userRef.current?.anonymousName,
    setMessages,
    setReadReceipts,
    setTyping,
    setRequests,
    setNotice,
    playNotificationSound
  });

  useEffect(() => {
    if (selectedChannel?.id && messages.length > 0) {
      sendReadReceipt();
    }
  }, [selectedChannel?.id, messages.length, sendReadReceipt]);

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

  const sendMessage = async (content: string, kind: "TEXT" | "MEME" | "FILE" = "TEXT", expiresInSeconds?: number | null, fileMeta?: { size: number; mime: string; name: string }) => {
    let finalContent = content;
    if (selectedCommunity.e2eeMode && kind === "TEXT") {
      const key = groupKeys[selectedCommunity.id];
      if (!key) {
        setNotice("Cannot encrypt message. Key not derived.");
        return;
      }
      try {
        finalContent = await encryptText(content, key);
      } catch (err) {
        setNotice("Failed to encrypt message.");
        return;
      }
    }

    const payload = {
      groupId: selectedCommunity.id,
      channelId: selectedChannel.id,
      content: kind === "MEME" ? "Shared an image" : finalContent,
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
      socket.emit("message:send", payload, (response: any) => {
        if (!response.ok) {
          setNotice(response.error ?? "Message failed.");
        } else if (selectedCommunity.e2eeMode && response.data?.message?.id) {
          setDecryptedContents((current) => ({
            ...current,
            [response.data.message.id]: content
          }));
        }
      });
      return;
    }

    void apiFetch<{ message: ChatMessage }>("/api/messages", {
      method: "POST",
      body: JSON.stringify(payload)
    })
      .then((data) => {
        setMessages((current) => [...current, data.message]);
        if (selectedCommunity.e2eeMode) {
          setDecryptedContents((current) => ({
            ...current,
            [data.message.id]: content
          }));
        }
      })
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
      await apiFetch(`/api/messages/${messageId}/reports`, {
        method: "POST",
        body: JSON.stringify({ reason })
      });
      setNotice("Message reported to admin.");
      void loadReports(selectedCommunity.id);
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

  const handleLogout = () => {
    window.localStorage.removeItem("notrace_access");
    window.localStorage.removeItem("notrace_recovery");
    setAccessToken(null);
    setUser(null);
    window.location.reload();
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
      <div className={cn("h-full min-h-screen text-foreground bg-background transition-colors duration-300", {
        "theme-cyberpunk": theme === "cyberpunk",
        "theme-emerald": theme === "emerald",
        "theme-light": theme === "light"
      })}>
        <div className="noise" />
      {(!accessToken || !user) ? (
        <AccessPortal
          onAuthenticated={(token, usr) => {
            window.localStorage.setItem("notrace_access", token);
            setAccessToken(token);
            if (usr.recoveryPhrase) {
              window.localStorage.setItem("notrace_recovery", usr.recoveryPhrase);
              setWelcomePhrase(usr.recoveryPhrase);
            }
            setUser(usr);
          }}
        />
      ) : (
      <main className="relative z-10 grid h-dvh grid-cols-[64px_minmax(0,1fr)] overflow-hidden bg-transparent text-foreground lg:grid-cols-[72px_280px_minmax(0,1fr)] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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
          <Button type="button" variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
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
            <header className="flex h-16 shrink-0 min-w-0 items-center gap-3 border-b border-white/5 glass-panel px-3 md:px-5">
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                className="lg:hidden shrink-0"
                onClick={() => setMobileChannelsOpen((current) => !current)}
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                <Hash className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-[120px] flex-1 overflow-hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-sm font-bold md:text-base">#{selectedChannel.name}</h1>
                  <Badge tone={connected ? "good" : "neutral"} className="hidden sm:inline-flex shrink-0">
                    {connected ? "realtime" : "api"}
                  </Badge>
                  {selectedCommunity.privacyMode ? (
                    <Badge tone="warn" className="hidden sm:inline-flex shrink-0">
                      private
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <CircleDot className={cn("h-3 w-3 shrink-0", connected ? "text-primary" : "text-muted-foreground")} aria-hidden />
                  <span className="truncate">{notice}</span>
                  {typing ? <span className="shrink-0">{typing} typing</span> : null}
                </div>
              </div>
              <div className="hidden min-w-[120px] max-w-[240px] shrink items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 2xl:flex focus-within:border-primary/50 transition-colors">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search"
                  className="h-6 min-w-0 flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Button type="button" variant={muted ? "secondary" : "ghost"} size="iconSm" onClick={() => setMuted((current) => !current)}>
                {muted ? <BellOff className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
              </Button>
              <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant={showConfessions ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 gap-1.5 px-2 sm:px-3"
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
                    className="h-8 gap-1.5 px-2 sm:px-3"
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
                    className="h-8 gap-1.5 px-2 sm:px-3 hidden min-[400px]:inline-flex"
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
              {selectedCommunity.e2eeMode && !groupKeys[selectedCommunity.id] ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                  <div className="max-w-md w-full border border-violet-500/20 bg-black/60 rounded-2xl p-6 shadow-2xl text-center space-y-6">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-500/40 bg-violet-500/10 text-violet-400 animate-pulse">
                      <Shield className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold tracking-tight text-white">End-to-End Encrypted Room</h2>
                      <p className="text-sm text-muted-foreground">
                        This group is secured with client-side zero-knowledge E2EE. Enter the group passphrase to derive the decryption key.
                      </p>
                    </div>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem("passphrase") as HTMLInputElement;
                        const val = input.value.trim();
                        if (val) {
                          setNotice("Deriving key...");
                          try {
                            const derived = await deriveKey(val, selectedCommunity.id);
                            setGroupPassphrases((prev) => ({ ...prev, [selectedCommunity.id]: val }));
                            setGroupKeys((prev) => ({ ...prev, [selectedCommunity.id]: derived }));
                            setNotice("Decryption key active.");
                          } catch (err) {
                            setNotice("Failed to derive encryption key.");
                          }
                        }
                      }}
                      className="space-y-4"
                    >
                      <Input
                        name="passphrase"
                        type="password"
                        placeholder="Enter group passphrase"
                        className="bg-card border-border text-center font-mono placeholder:font-sans"
                        required
                        autoFocus
                      />
                      <Button
                        type="submit"
                        className="w-full bg-violet-600 text-white hover:bg-violet-500 font-semibold shadow-[0_0_20px_-5px] shadow-violet-500/40"
                      >
                        Unlock Messages
                      </Button>
                    </form>
                  </div>
                </div>
              ) : showConfessions ? (
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
              ) : selectedChannel.kind === "VOICE_FUTURE" ? (
                <div className="flex-1 overflow-hidden bg-background/50">
                  <VoiceChannel
                    groupId={selectedCommunity.id}
                    channelId={selectedChannel.id}
                    socket={socket}
                    currentUser={user}
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
                  readReceiptsEnabled={selectedCommunity.readReceiptsEnabled}
                  readReceipts={readReceipts}
                  currentUser={user}
                />
              )}

              {/* Ephemeral floating panels */}
              {showIdentity && user && (
                <IdentityPanel
                  currentUser={{ anonymousName: user.anonymousName, avatarSeed: user.avatarSeed, recoveryPhrase: user.recoveryPhrase }}
                  onRotate={rotateIdentity}
                  onUpdateName={updateIdentityName}
                  onClose={() => setShowIdentity(false)}
                  onLogout={handleLogout}
                  isLoading={identityLoading}
                />
              )}

              {/* Composer */}
              {selectedChannel.kind !== "VOICE_FUTURE" && (
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
              )}
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
              adminUsers={adminUsers}
              onLoadAdminUsers={loadAdminUsers}
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
      <Dialog open={channelDialog.open} onOpenChange={(open: boolean) => setChannelDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md bg-card/90 border-border backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{channelDialog.mode === "CREATE" ? "Create New Channel" : "Rename Channel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitChannelDialog} className="flex flex-col gap-4 mt-4">
            <Input
              placeholder="e.g., general, memes, study"
              value={channelDialog.name}
              onChange={(e) => setChannelDialog(prev => ({ ...prev, name: e.target.value }))}
              className="bg-card border-border"
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
      <Dialog open={groupRenameDialog.open} onOpenChange={(open: boolean) => setGroupRenameDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md bg-card/90 border-border backdrop-blur-xl">
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
              className="bg-card border-border"
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
      
      {welcomePhrase && (
        <Dialog open={true} onOpenChange={() => setWelcomePhrase(null)}>
          <DialogContent className="sm:max-w-md bg-card/95 border-border backdrop-blur-xl text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                Welcome to NoTrace!
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                NoTrace is completely anonymous. We do not collect emails, phone numbers, or passwords.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 space-y-2 text-center">
                <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Your Private Recovery Phrase</p>
                <div className="flex items-center justify-center gap-2 bg-card border border-border rounded-lg py-3 px-4">
                  <code className="text-base font-mono text-white tracking-wider select-all">{welcomePhrase}</code>
                </div>
                <p className="text-[10px] text-violet-300">
                  Save this key! You need it to log back in if you clear your browser or logout.
                </p>
              </div>
              <div className="flex gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-xs text-yellow-300 items-start">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                <span>If you lose this phrase, your account and all group access are **permanently lost**. There is no "Forgot Password" option.</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-semibold shadow-[0_0_20px_-5px] shadow-primary/40"
                onClick={() => {
                  navigator.clipboard.writeText(welcomePhrase).catch(() => {});
                  setWelcomePhrase(null);
                  setNotice("Recovery phrase copied to clipboard!");
                }}
              >
                Copy & Enter Chat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Group Context Menu */}
      {contextMenu.open && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setContextMenu({ open: false, x: 0, y: 0 })}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu({ open: false, x: 0, y: 0 }); }}
          />
          <div 
            className="fixed z-50 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden py-1 backdrop-blur-xl"
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

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md bg-card/90 border-border backdrop-blur-xl text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              App Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Customize your personal NoTrace workspace options.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Theme Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Theme Mode</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "dark", label: "Dark" },
                  { id: "cyberpunk", label: "Cyberpunk" },
                  { id: "emerald", label: "Emerald" },
                  { id: "light", label: "Light" }
                ].map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant={theme === t.id ? "secondary" : "outline"}
                    className={cn(
                      "h-10 text-xs font-semibold uppercase tracking-wider",
                      theme === t.id && "border-primary/50 text-primary shadow-[0_0_12px_-3px] shadow-primary/40"
                    )}
                    onClick={() => {
                      setTheme(t.id);
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem("notrace_theme", t.id);
                      }
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-foreground">Message Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play alert sounds on incoming messages</p>
              </div>
              <Button
                type="button"
                variant={soundEnabled ? "secondary" : "outline"}
                className={cn(
                  "h-9 px-4 font-semibold text-xs uppercase tracking-wider",
                  soundEnabled && "border-primary/50 text-primary shadow-[0_0_12px_-3px] shadow-primary/40"
                )}
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  window.localStorage.setItem("notrace_sound", String(next));
                }}
              >
                {soundEnabled ? "On" : "Muted"}
              </Button>
            </div>

            {/* Reset Session Cache */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-destructive">Danger Zone</Label>
                <p className="text-xs text-muted-foreground">Reset session, keys, and log out</p>
              </div>
              <Button
                type="button"
                variant="destructive"
                className="h-9 px-4 font-semibold text-xs uppercase tracking-wider"
                onClick={() => {
                  if (window.confirm("WARNING: This will completely delete your local session credentials, encryption keys, and recovery phrase cache. You will not be able to log back in without your recovery phrase. Continue?")) {
                    handleLogout();
                  }
                }}
              >
                Reset Session
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
              onClick={() => setSettingsOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
