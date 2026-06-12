"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Users, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnonymousAvatar } from "@/components/anonymous-avatar";
import { cn } from "@/lib/utils";
import type { Socket } from "socket.io-client";

type Peer = {
  socketId: string;
  userId: string;
  anonymousName: string;
  avatarSeed: string;
  stream?: MediaStream;
  isTalking?: boolean;
};

export function VoiceChannel({
  groupId,
  channelId,
  socket,
  currentUser
}: {
  groupId: string;
  channelId: string;
  socket: Socket | null;
  currentUser: { anonymousName: string; avatarSeed: string } | null;
}) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const socketRef = useRef<Socket | null>(socket);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analysersRef = useRef<Map<string, AnalyserNode>>(new Map());

  // Keep socket ref up to date
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Clean up WebRTC on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [channelId]);

  const joinRoom = async () => {
    if (!socketRef.current) {
      setErrorMessage("Realtime socket not connected.");
      return;
    }

    try {
      // 1. Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getAudioTracks()[0].enabled = !muted;

      // 2. Set up local AudioContext for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      setupVisualizer(stream, "local", audioCtx);

      // 3. Emit join event
      socketRef.current.emit("voice:join", { groupId, channelId }, (res: any) => {
        if (!res.ok) {
          setErrorMessage(res.error || "Failed to join voice channel.");
          stopLocalStream();
          return;
        }

        setJoined(true);
        setErrorMessage(null);

        // 4. Set up connections with existing peers
        const existingPeers = res.data.peers as Omit<Peer, "stream">[];
        existingPeers.forEach((peer) => {
          createPeerConnection(peer.socketId, peer.userId, peer.anonymousName, peer.avatarSeed, stream, true);
        });
      });

      // 5. Register socket signal listeners
      socketRef.current.on("voice:user-joined", handleUserJoined);
      socketRef.current.on("voice:user-left", handleUserLeft);
      socketRef.current.on("voice:signal", handleVoiceSignal);

    } catch (err) {
      setErrorMessage("Could not access microphone. Please check permissions.");
      console.error("Microphone access error:", err);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current && joined) {
      socketRef.current.emit("voice:leave", { groupId, channelId });
      socketRef.current.off("voice:user-joined", handleUserJoined);
      socketRef.current.off("voice:user-left", handleUserLeft);
      socketRef.current.off("voice:signal", handleVoiceSignal);
    }

    // Close WebRTC connections
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();

    // Stop microphone
    stopLocalStream();

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analysersRef.current.clear();

    setPeers([]);
    setJoined(false);
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const createPeerConnection = (
    peerSocketId: string,
    peerUserId: string,
    anonymousName: string,
    avatarSeed: string,
    localStream: MediaStream,
    createOffer: boolean
  ) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pcsRef.current.set(peerSocketId, pc);

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("voice:signal", {
          targetSocketId: peerSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    // Handle remote track/stream
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setPeers((prev) =>
        prev.map((peer) =>
          peer.socketId === peerSocketId ? { ...peer, stream: remoteStream } : peer
        )
      );

      // Play audio automatically
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.play().catch((err) => console.error("Audio playback error:", err));

      if (audioContextRef.current) {
        setupVisualizer(remoteStream, peerSocketId, audioContextRef.current);
      }
    };

    // Add to peers state list
    setPeers((prev) => {
      const exists = prev.some((p) => p.socketId === peerSocketId);
      if (exists) return prev;
      return [...prev, { socketId: peerSocketId, userId: peerUserId, anonymousName, avatarSeed }];
    });

    if (createOffer) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit("voice:signal", {
              targetSocketId: peerSocketId,
              signal: { sdp: pc.localDescription }
            });
          }
        })
        .catch((err) => console.error("Create offer error:", err));
    }

    return pc;
  };

  const handleUserJoined = (data: { socketId: string; userId: string; anonymousName: string; avatarSeed: string }) => {
    if (localStreamRef.current) {
      createPeerConnection(data.socketId, data.userId, data.anonymousName, data.avatarSeed, localStreamRef.current, false);
    }
  };

  const handleUserLeft = (data: { socketId: string; userId: string }) => {
    const pc = pcsRef.current.get(data.socketId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(data.socketId);
    }
    analysersRef.current.delete(data.socketId);

    setPeers((prev) => prev.filter((peer) => peer.socketId !== data.socketId));
  };

  const handleVoiceSignal = (data: { senderSocketId: string; signal: any }) => {
    const pc = pcsRef.current.get(data.senderSocketId);
    if (!pc) return;

    if (data.signal.sdp) {
      pc.setRemoteDescription(new RTCSessionDescription(data.signal.sdp))
        .then(() => {
          if (pc.remoteDescription?.type === "offer") {
            pc.createAnswer()
              .then((answer) => pc.setLocalDescription(answer))
              .then(() => {
                if (socketRef.current) {
                  socketRef.current.emit("voice:signal", {
                    targetSocketId: data.senderSocketId,
                    signal: { sdp: pc.localDescription }
                  });
                }
              });
          }
        })
        .catch((err) => console.error("Signal SDP handling error:", err));
    } else if (data.signal.candidate) {
      pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate)).catch((err) =>
        console.error("Signal candidate handling error:", err)
      );
    }
  };

  const setupVisualizer = (stream: MediaStream, peerId: string, audioCtx: AudioContext) => {
    try {
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analysersRef.current.set(peerId, analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analysersRef.current.has(peerId) || audioCtx.state === "closed") return;
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume level
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const average = sum / bufferLength;
        const isTalking = average > 15; // Noise threshold

        if (peerId === "local") {
          setPeers((prev) =>
            prev.map((p) => (p.socketId === "local" ? { ...p, isTalking: isTalking && !muted } : p))
          );
        } else {
          setPeers((prev) =>
            prev.map((p) => (p.socketId === peerId ? { ...p, isTalking } : p))
          );
        }

        setTimeout(checkVolume, 100);
      };

      checkVolume();
    } catch (err) {
      console.warn("AudioContext visualizer setup failed:", err);
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !nextMuted;
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 bg-transparent text-foreground">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-2xl text-center shadow-2xl flex flex-col gap-8">
        
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl pointer-events-none" />

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_-3px] shadow-primary/30 animate-pulse">
            <Volume2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">Voice Call Room</h2>
          <p className="text-xs text-muted-foreground">End-to-end peer encrypted audio connection.</p>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        {/* User Grid */}
        <div className="flex-1 min-h-[200px] flex items-center justify-center">
          {!joined ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <p className="text-sm text-muted-foreground">Ready to join voice room?</p>
              <Button
                onClick={joinRoom}
                className="px-6 h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/80 shadow-[0_0_20px_-5px] shadow-primary/40 rounded-full"
              >
                Join Voice Channel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
              {/* Local User */}
              {currentUser && (
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-black/40">
                  <div className="relative">
                    <AnonymousAvatar seed={currentUser.avatarSeed} name={currentUser.anonymousName} size="md" />
                    {/* Talking glow ring */}
                    <div
                      className={cn(
                        "absolute -inset-1 rounded-full border border-violet-500/80 opacity-0 scale-95 transition-all duration-300 pointer-events-none",
                        !muted && localStreamRef.current && "opacity-100 scale-100 shadow-[0_0_12px_rgba(139,92,246,0.5)] border-2"
                      )}
                    />
                  </div>
                  <div className="text-sm font-semibold truncate max-w-[120px]">{currentUser.anonymousName}</div>
                  <div className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">You</div>
                </div>
              )}

              {/* Peers */}
              {peers.map((peer) => (
                <div key={peer.socketId} className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-black/40">
                  <div className="relative">
                    <AnonymousAvatar seed={peer.avatarSeed} name={peer.anonymousName} size="md" />
                    <div
                      className={cn(
                        "absolute -inset-1 rounded-full border border-primary/80 opacity-0 scale-95 transition-all duration-300 pointer-events-none",
                        peer.isTalking && "opacity-100 scale-100 shadow-[0_0_12px_rgba(120,119,198,0.5)] border-2"
                      )}
                    />
                  </div>
                  <div className="text-sm font-semibold truncate max-w-[120px]">{peer.anonymousName}</div>
                  <div className="text-[10px] uppercase font-bold text-primary tracking-wider">Connected</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        {joined && (
          <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-6 mt-4">
            <Button
              variant={muted ? "destructive" : "secondary"}
              size="icon"
              onClick={toggleMute}
              className={cn(
                "h-12 w-12 rounded-full",
                muted ? "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30" : "bg-white/5 border-white/10 text-foreground hover:bg-white/10"
              )}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={leaveRoom}
              className="h-12 w-12 rounded-full shadow-[0_0_20px_-5px] shadow-red-500/40 bg-red-600 hover:bg-red-500 text-white"
              aria-label="Leave voice call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Member Count */}
        {joined && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{peers.length + 1} active in voice call</span>
          </div>
        )}
      </div>
    </div>
  );
}
