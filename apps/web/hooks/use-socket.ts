"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export function useSocket(accessToken: string | null) {
  const [connected, setConnected] = useState(false);

  const socket = useMemo<Socket | null>(() => {
    if (!accessToken) {
      return null;
    }

    return io(SOCKET_URL, {
      auth: { token: accessToken },
      withCredentials: true,
      autoConnect: false
    });
  }, [accessToken]);

  useEffect(() => {
    if (!socket) {
      setConnected(false);
      return undefined;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return { socket, connected };
}
