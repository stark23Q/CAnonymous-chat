import { useState, useCallback, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Community, ChatMessage, JoinRequest, Member, AdminUser, NoTraceUser } from "@/lib/types";
import type { AdminReport } from "@/components/dashboard/admin-panel";
import { communities as seedCommunities, initialMessages, joinRequests as seedRequests, members as seedMembers } from "@/lib/sample-data";

export type ApiGroup = Community & {
  slug?: string;
  _count?: {
    memberships?: number;
    joinRequests?: number;
  };
};

export type ApiJoinRequest = {
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

export type ApiMember = Member & {
  user?: {
    id: string;
    role: string;
  };
};

export function toCommunity(group: ApiGroup): Community {
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

export function toJoinRequest(request: ApiJoinRequest): JoinRequest {
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

export function toMember(member: ApiMember): Member {
  return {
    id: member.id,
    anonymousName: member.anonymousName,
    avatarSeed: member.avatarSeed,
    status: member.status,
    joinedAt: member.joinedAt
  };
}

export function useNoTraceData({
  accessToken,
  user,
  setLoading,
  setNotice,
  fallbackNotice
}: {
  accessToken: string | null;
  user: NoTraceUser | null;
  setLoading: (l: boolean) => void;
  setNotice: (n: string) => void;
  fallbackNotice: string;
}) {
  const [communities, setCommunities] = useState<Community[]>(seedCommunities);
  const [selectedCommunityId, setSelectedCommunityId] = useState(seedCommunities[0]?.id ?? "");
  const [selectedChannelId, setSelectedChannelId] = useState(seedCommunities[0]?.channels[0]?.id ?? "");

  const selectedCommunity = communities.find((community) => community.id === selectedCommunityId) ?? communities[0];
  const selectedChannel =
    selectedCommunity?.channels.find((channel) => channel.id === selectedChannelId) ?? selectedCommunity?.channels[0];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [requests, setRequests] = useState<JoinRequest[]>(seedRequests);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[] | null>(null);
  const [liveReady, setLiveReady] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!accessToken) return [];
    const data = await apiFetch<{ groups: ApiGroup[] }>("/api/groups", { headers: { Authorization: `Bearer ${accessToken}` } });
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
  }, [setNotice, accessToken]);

  const loadRequests = useCallback(async (groupId: string) => {
    const data = await apiFetch<{ requests: ApiJoinRequest[] }>(
      `/api/admin/join-requests?groupId=${encodeURIComponent(groupId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    setRequests(data.requests.map(toJoinRequest));
  }, [accessToken]);

  const loadMembers = useCallback(async (groupId: string) => {
    const data = await apiFetch<{ members: ApiMember[] }>(`/api/admin/groups/${groupId}/members`, { headers: { Authorization: `Bearer ${accessToken}` } });
    setMembers(data.members.map(toMember));
  }, [accessToken]);

  const loadAdminUsers = useCallback(async () => {
    if (user?.role !== "ADMIN") return;
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setAdminUsers(data.users);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, [user, accessToken]);

  const loadReports = useCallback(async (groupId: string) => {
    try {
      const data = await apiFetch<{ reports: AdminReport[] }>(`/api/admin/reports?groupId=${groupId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      setReports(data.reports);
    } catch {
      // non-critical
    }
  }, [accessToken]);

  const loadMessages = useCallback(async (groupId: string, channelId: string) => {
    const data = await apiFetch<{ messages: ChatMessage[] }>(
      `/api/groups/${groupId}/channels/${channelId}/messages?limit=80`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    setMessages(data.messages);
  }, [accessToken]);

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
  }, [accessToken, loadGroups, setLoading, setNotice, fallbackNotice]);

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
  }, [accessToken, liveReady, loadMessages, selectedChannel?.id, selectedChannelId, selectedCommunity?.id, selectedCommunityId, setNotice]);

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
  }, [accessToken, liveReady, loadMembers, loadReports, loadRequests, selectedCommunity?.id, selectedCommunityId, user?.role, setNotice]);

  return {
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
    loadGroups,
    loadRequests,
    loadMembers,
    loadReports,
    loadMessages,
    loadAdminUsers
  };
}
