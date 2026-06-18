import { useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { ChatMessage, JoinRequest, NoTraceUser } from "@/lib/types";
import { apiFetch } from "@/lib/api";

export function useNoTraceSocket({
  socket,
  connected,
  liveReady,
  selectedCommunityId,
  selectedChannelId,
  readReceiptsEnabled,
  userAnonymousName,
  setMessages,
  setReadReceipts,
  setTyping,
  setRequests,
  setNotice,
  playNotificationSound
}: {
  socket: Socket | null;
  connected: boolean;
  liveReady: boolean;
  selectedCommunityId: string;
  selectedChannelId: string;
  readReceiptsEnabled?: boolean;
  userAnonymousName?: string | undefined;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setReadReceipts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setTyping: React.Dispatch<React.SetStateAction<string | null>>;
  setRequests: React.Dispatch<React.SetStateAction<JoinRequest[]>>;
  setNotice: React.Dispatch<React.SetStateAction<string>>;
  playNotificationSound: () => void;
}) {
  useEffect(() => {
    if (!liveReady || !socket || !selectedCommunityId || !selectedChannelId) {
      return;
    }

    socket.emit("group:join", { groupId: selectedCommunityId });
    socket.emit("channel:join", { groupId: selectedCommunityId, channelId: selectedChannelId });

    const upsertMessage = ({ message }: { message: ChatMessage }) => {
      setMessages((current) => {
        const exists = current.some((item) => item.id === message.id);
        if (exists) {
          return current.map((item) => (item.id === message.id ? message : item));
        }

        if (userAnonymousName && message.author.anonymousName !== userAnonymousName) {
          playNotificationSound();
        }

        return [...current, message];
      });
    };

    const onMessageReceipt = (payload: { channelId: string; membershipId: string; anonymousName: string; readAt: string }) => {
      if (payload.channelId === selectedChannelId) {
        setReadReceipts((current) => ({
          ...current,
          [payload.anonymousName]: payload.readAt
        }));
      }
    };

    const onTyping = (payload: { channelId: string; anonymousName: string; isTyping: boolean }) => {
      if (payload.channelId === selectedChannelId) {
        setTyping(payload.isTyping ? payload.anonymousName : null);
      }
    };

    const onNewRequest = ({ request }: { request: JoinRequest }) => {
      if (request.groupId === selectedCommunityId) {
        setRequests((current) => {
          const exists = current.some((item) => item.id === request.id);
          if (exists) return current;
          return [request, ...current];
        });
        setNotice("New join request received!");
      }
    };

    const onUpdatedRequest = ({ requestId, status }: { requestId: string; status: JoinRequest["status"] }) => {
      setRequests((current) =>
        current.map((item) => (item.id === requestId ? { ...item, status } : item))
      );
    };

    socket.on("message:new", upsertMessage);
    socket.on("message:deleted", upsertMessage);
    socket.on("reaction:updated", upsertMessage);
    socket.on("typing:update", onTyping);
    socket.on("request:new", onNewRequest);
    socket.on("request:updated", onUpdatedRequest);
    socket.on("message:receipt", onMessageReceipt);

    return () => {
      socket.off("message:new", upsertMessage);
      socket.off("message:deleted", upsertMessage);
      socket.off("reaction:updated", upsertMessage);
      socket.off("typing:update", onTyping);
      socket.off("request:new", onNewRequest);
      socket.off("request:updated", onUpdatedRequest);
      socket.off("message:receipt", onMessageReceipt);
    };
  }, [
    liveReady,
    socket,
    connected,
    selectedCommunityId,
    selectedChannelId,
    userAnonymousName,
    playNotificationSound,
    setMessages,
    setReadReceipts,
    setTyping,
    setRequests,
    setNotice
  ]);

  const sendReadReceipt = useCallback(() => {
    if (socket && connected && readReceiptsEnabled && selectedChannelId) {
      socket.emit("message:read", { groupId: selectedCommunityId, channelId: selectedChannelId });
      apiFetch(`/api/groups/${selectedCommunityId}/membership/read`, { method: "POST" }).catch(() => {});
    }
  }, [socket, connected, readReceiptsEnabled, selectedCommunityId, selectedChannelId]);

  return { sendReadReceipt };
}
