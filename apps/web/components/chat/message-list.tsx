"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Flag, ImageIcon, Reply, Timer, Trash2, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { AnonymousAvatar } from "@/components/anonymous-avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatBytes(value?: number | null) {
  if (!value) {
    return "";
  }

  if (value > 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} MB`;
  }

  return `${Math.ceil(value / 1_000)} KB`;
}

/** Returns a human-readable countdown string e.g. "expires in 2h 5m" */
function formatExpiry(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return "expired";
  const totalSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSecs / 86_400);
  const hours = Math.floor((totalSecs % 86_400) / 3_600);
  const mins = Math.floor((totalSecs % 3_600) / 60);

  if (days > 0) return `expires in ${days}d ${hours}h`;
  if (hours > 0) return `expires in ${hours}h ${mins}m`;
  return `expires in ${mins}m`;
}

export function MessageList({
  messages,
  onReact,
  onDelete,
  onReport,
  onReply,
  onAvatarClick,
  readReceiptsEnabled,
  readReceipts,
  currentUser
}: {
  messages: ChatMessage[];
  onReact: (messageId: string, emoji: string) => void;
  onDelete: (messageId: string) => void;
  onReport: (messageId: string, reason: string) => void;
  onReply: (message: ChatMessage) => void;
  onAvatarClick?: (author: { id: string; anonymousName: string; avatarSeed: string }) => void;
  readReceiptsEnabled?: boolean;
  readReceipts?: Record<string, string>;
  currentUser?: { anonymousName: string } | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [, tick] = useState(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Refresh expiry countdowns every 30s
  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const submitReport = () => {
    if (!reportTarget || !reportReason.trim()) return;
    onReport(reportTarget, reportReason.trim());
    setReportTarget(null);
    setReportReason("");
  };

  return (
    <>
      <div ref={scrollRef} className="scrollbar-thin flex-1 min-h-0 overflow-y-auto px-4 py-5 md:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          {messages.map((message) => {
            const isSelfDestruct = !!message.expiresAt;
            const isExpiringSoon =
              isSelfDestruct &&
              new Date(message.expiresAt!).getTime() - Date.now() < 3_600_000; // < 1 hour

            return (
              <article key={message.id} className="group flex gap-3 rounded-md px-2 py-2 transition hover:bg-white/[0.03]">
                <AnonymousAvatar
                  seed={message.author.avatarSeed}
                  name={message.author.anonymousName}
                  className={onAvatarClick ? "cursor-pointer hover:ring-2 hover:ring-primary/60 transition-all" : ""}
                  onClick={() => onAvatarClick?.(message.author)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{message.author.anonymousName}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>

                    {/* Read Receipts Checkmarks */}
                    {readReceiptsEnabled && currentUser && currentUser.anonymousName === message.author.anonymousName && (
                      <span className="inline-flex items-center gap-0.5 ml-1">
                        {Object.entries(readReceipts || {}).some(([name, readAt]) => {
                          return name !== currentUser.anonymousName && new Date(readAt).getTime() >= new Date(message.createdAt).getTime();
                        }) ? (
                          <span className="text-emerald-400 font-bold text-xs select-none" title="Seen by others">✓✓</span>
                        ) : (
                          <span className="text-muted-foreground text-xs select-none" title="Sent">✓</span>
                        )}
                      </span>
                    )}

                    {/* Self-destruct badge */}
                    {isSelfDestruct && !message.deletedAt ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                          isExpiringSoon
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        )}
                      >
                        <Timer className="h-2.5 w-2.5" aria-hidden />
                        {formatExpiry(message.expiresAt!)}
                      </span>
                    ) : null}
                  </div>

                  {message.replyTo ? (
                    <div className="mt-2 rounded-md border-l-2 border-primary/60 bg-muted/55 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{message.replyTo.author.anonymousName}</span>{" "}
                      {message.replyTo.content}
                    </div>
                  ) : null}

                  {message.deletedAt ? (
                    <p className="mt-2 text-sm italic text-muted-foreground">Message removed</p>
                  ) : (
                    <>
                      {message.content && message.messageType !== "FILE" ? <div className="mt-2 inline-block rounded-2xl rounded-tl-sm bg-gradient-to-br from-primary/20 to-secondary/20 px-4 py-2 shadow-sm border border-white/5"><p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</p></div> : null}
                      {message.messageType === "MEME" || message.messageType === "IMAGE" || message.messageType === "GIF" ? (
                        <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
                          {message.mediaUrl ? (
                            <img
                              alt={message.content ?? "Shared media"}
                              src={message.mediaUrl}
                              className="aspect-video w-full max-w-lg object-cover"
                            />
                          ) : (
                            <div className="grid aspect-video max-w-lg place-items-center bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                            </div>
                          )}
                        </div>
                      ) : null}
                      {message.messageType === "FILE" ? (
                        <a href={message.content ?? "#"} download="shared-document" className="mt-3 flex max-w-md items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3 shadow-sm transition-colors hover:bg-black/60 hover:border-primary/50 cursor-pointer">
                          <div className="grid h-10 w-10 place-items-center rounded bg-primary/20 text-primary shadow-[0_0_10px_-2px] shadow-primary/30">
                            <FileText className="h-5 w-5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground">Shared document</div>
                            <div className="text-xs text-muted-foreground">
                              {message.mediaMime ?? "File"} {formatBytes(message.mediaSize)}
                            </div>
                          </div>
                        </a>
                      ) : null}
                    </>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {Object.entries(message.reactions).map(([emoji, count]) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReact(message.id, emoji)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 text-xs font-semibold text-foreground transition-all hover:border-primary/50 hover:bg-primary/20 hover:scale-105"
                      >
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    ))}
                    {["😂", "🔥", "✅"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onReact(message.id, emoji)}
                        className="grid h-7 w-8 place-items-center rounded border border-transparent text-sm text-muted-foreground opacity-0 transition hover:border-border hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons — visible on hover */}
                <div className="flex shrink-0 items-start gap-1 opacity-0 transition group-hover:opacity-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="iconSm" onClick={() => onReply(message)}>
                        <Reply className="h-4 w-4" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reply</TooltipContent>
                  </Tooltip>
                  {!message.deletedAt && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="iconSm"
                          onClick={() => {
                            setReportTarget(message.id);
                            setReportReason("");
                          }}
                          className="hover:text-red-400"
                        >
                          <Flag className="h-4 w-4" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Report message</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="iconSm" onClick={() => onDelete(message.id)}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Report dialog */}
      <Dialog open={!!reportTarget} onOpenChange={(open: boolean) => { if (!open) setReportTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-400" aria-hidden />
              Report Message
            </DialogTitle>
            <DialogDescription>
              This report will be sent anonymously to the room admins for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="report-reason" className="text-sm font-medium">
              Why are you reporting this message?
            </Label>
            <Textarea
              id="report-reason"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Harassment, spam, explicit content…"
              rows={3}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{reportReason.length}/1000</p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReportTarget(null)}
            >
              <X className="h-4 w-4 mr-1" aria-hidden />
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!reportReason.trim()}
              onClick={submitReport}
            >
              <Flag className="h-4 w-4 mr-1" aria-hidden />
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
