"use client";

import { useEffect, useRef, useState } from "react";
import { Ghost, X, Send, AlertTriangle } from "lucide-react";
import { AnonymousAvatar } from "@/components/anonymous-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EphemeralMessage = {
  id: string;
  content: string;
  from: "you" | "them";
  timestamp: Date;
};

type TargetUser = {
  anonymousName: string;
  avatarSeed: string;
};

type EphemeralChatProps = {
  targetUser: TargetUser;
  onClose: () => void;
};

export function EphemeralChat({ targetUser, onClose }: EphemeralChatProps) {
  const [messages, setMessages] = useState<EphemeralMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;

    const newMessage: EphemeralMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      from: "you",
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex w-80 flex-col rounded-xl overflow-hidden",
        "border border-purple-500/30 bg-black/85 shadow-2xl backdrop-blur-xl",
        "ring-1 ring-purple-500/10"
      )}
      style={{ height: "420px" }}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-white/10 bg-purple-500/10 px-3 py-2.5">
        <Ghost className="h-4 w-4 text-purple-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Private Chat with{" "}
            <span className="text-purple-300">{targetUser.anonymousName}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close private chat"
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Ephemeral warning */}
      <div className="flex shrink-0 items-center gap-2 border-b border-white/5 bg-amber-500/5 px-3 py-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
        <p className="text-[11px] leading-snug text-amber-300/80">
          Ephemeral — messages deleted when you close this window.
        </p>
      </div>

      {/* Messages */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <Ghost className="h-8 w-8 opacity-20 text-purple-400" aria-hidden />
            <p className="text-xs">Start a private conversation.</p>
            <p className="text-[11px] opacity-70">Only visible to you locally.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isYou = message.from === "you";
            return (
              <div
                key={message.id}
                className={cn("flex gap-2", isYou ? "flex-row-reverse" : "flex-row")}
              >
                {!isYou && (
                  <AnonymousAvatar
                    seed={targetUser.avatarSeed}
                    name={targetUser.anonymousName}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />
                )}
                <div
                  className={cn(
                    "max-w-[72%] flex flex-col gap-0.5",
                    isYou ? "items-end" : "items-start"
                  )}
                >
                  <span className="text-[10px] text-muted-foreground px-1">
                    {isYou ? "You" : targetUser.anonymousName}
                  </span>
                  <div
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm leading-relaxed",
                      isYou
                        ? "bg-purple-600/70 text-white rounded-tr-sm"
                        : "bg-white/10 text-foreground rounded-tl-sm"
                    )}
                  >
                    {message.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-white/10 p-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message..."
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "outline-none transition focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30",
              "max-h-24 overflow-y-auto scrollbar-thin"
            )}
            style={{ minHeight: "38px" }}
          />
          <Button
            type="button"
            size="iconSm"
            className="shrink-0 bg-purple-600 hover:bg-purple-500 text-white"
            onClick={sendMessage}
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}
