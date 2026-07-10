"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Gift, Ghost, ImageIcon, Laugh, Send, Timer, X } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { MemePicker } from "@/components/chat/meme-picker";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

const EXPIRY_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: "No self-destruct", seconds: null },
  { label: "1 hour", seconds: 3_600 },
  { label: "4 hours", seconds: 14_400 },
  { label: "24 hours", seconds: 86_400 },
  { label: "7 days", seconds: 604_800 }
];

export function Composer({
  channelName,
  replyTo,
  onCancelReply,
  onSend,
  onConfess,
  onTyping,
  forceConfessionMode,
  groupId
}: {
  channelName: string;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (content: string, kind?: "TEXT" | "MEME" | "FILE", expiresInSeconds?: number | null, fileMeta?: { size: number; mime: string; name: string }) => void;
  onConfess?: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  forceConfessionMode?: boolean;
  groupId: string;
}) {
  const [value, setValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isConfessionState, setIsConfessionState] = useState(false);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [memeOpen, setMemeOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeout = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const isConfession = forceConfessionMode || isConfessionState;

  const send = useCallback(
    (kind: "TEXT" | "MEME" | "FILE" = "TEXT", contentOverride?: string) => {
      const content = contentOverride ?? value.trim();
      if (!content && kind === "TEXT") {
        return;
      }

      if (isConfession && onConfess) {
        onConfess(content);
        setValue("");
        if (!forceConfessionMode) setIsConfessionState(false);
        onTyping(false);
        return;
      }

      onSend(content || (kind === "MEME" ? "Shared a meme" : "Shared a file"), kind, expiresInSeconds);
      setValue("");
      onTyping(false);
    },
    [onSend, onConfess, isConfession, onTyping, value, expiresInSeconds]
  );

  const handleMemeSelect = (url: string) => {
    send("MEME", url);
    setMemeOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("File is too large! Maximum size is 25MB.");
      return;
    }

    setIsUploading(true);
    
    try {
      // 1. Try to get a presigned URL from our API (requires S3/Supabase configured)
      const { upload } = await apiFetch<{ upload: { objectKey: string; uploadUrl: string; publicUrl: string | null; expiresInSeconds: number } }>("/api/messages/media/presign", {
        method: "POST",
        body: JSON.stringify({
          groupId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size
        })
      });
        
      // 2. Upload directly to Supabase Storage / S3
      const uploadRes = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file
      });

      if (uploadRes.ok && upload.publicUrl) {
        // 3. Send message with the public URL
        onSend(upload.publicUrl, "FILE", expiresInSeconds, {
          size: file.size,
          mime: file.type || "application/octet-stream",
          name: file.name
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    } catch (err) {
      console.warn("Direct upload failed or not configured, falling back to Base64.");
    } finally {
      setIsUploading(false);
    }

    // FALLBACK: Read as Base64 if cloud storage fails or isn't set up
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onSend(base64, "FILE", expiresInSeconds, {
        size: file.size,
        mime: file.type || "application/octet-stream",
        name: file.name
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (next: string) => {
    setValue(next);
    
    if (isConfession) {
      onTyping(false);
      return;
    }
    
    onTyping(true);

    if (typingTimeout.current) {
      window.clearTimeout(typingTimeout.current);
    }

    typingTimeout.current = window.setTimeout(() => onTyping(false), 900);
  };

  const activeExpiry = EXPIRY_OPTIONS.find((opt) => opt.seconds === expiresInSeconds);

  return (
    <div
      className={cn(
        "shrink-0 px-4 pb-6 pt-2 md:px-6 md:pb-8",
        dragging && "opacity-50"
      )}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        send("FILE");
      }}
    >
      <div className="mx-auto max-w-4xl">
        {replyTo ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            <span className="min-w-0 flex-1 truncate">
              Replying to <span className="font-semibold text-foreground">{replyTo.author.anonymousName}</span>:{" "}
              {replyTo.content}
            </span>
            <Button type="button" variant="ghost" size="iconSm" onClick={onCancelReply}>
              <X className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : null}

        {/* Self-destruct active badge */}
        {expiresInSeconds ? (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="flex-1">
              Self-destruct: <span className="font-semibold">{activeExpiry?.label}</span>
            </span>
            <button
              type="button"
              onClick={() => setExpiresInSeconds(null)}
              className="text-amber-400/70 hover:text-amber-200 transition-colors"
              aria-label="Remove self-destruct timer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className={cn(
          "rounded-2xl border bg-black/40 p-2 shadow-lg glass-panel transition-all",
          isConfession ? "border-violet-500/50 focus-within:shadow-[0_0_20px_-5px] focus-within:shadow-violet-500/30" : "border-white/10 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_-5px] focus-within:shadow-primary/30",
          dragging && "border-primary/50 bg-primary/10",
          isConfession && "bg-violet-950/20"
        )}>
          {isConfession && (
             <Ghost className="pointer-events-none absolute right-6 top-6 h-5 w-5 text-violet-500/30" aria-hidden />
          )}
          <Textarea
            value={value}
            onChange={(event) => handleTyping(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={isConfession ? "Share your confession... it's completely anonymous." : `Message #${channelName}`}
            className="min-h-[58px] border-0 bg-transparent px-2 py-2 focus:ring-0"
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="iconSm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                    <FileUp className={cn("h-4 w-4", isUploading && "animate-pulse text-primary")} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isUploading ? "Uploading..." : "Upload file or image"}</TooltipContent>
              </Tooltip>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/mp4,application/pdf,text/plain"
              />
              
              <Popover open={memeOpen} onOpenChange={setMemeOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="iconSm">
                        <ImageIcon className="h-4 w-4" aria-hidden />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Search Memes / GIFs</TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="start"
                  side="top"
                  sideOffset={8}
                  className="w-auto p-0 border-0 bg-transparent shadow-none"
                >
                  <MemePicker onSelect={handleMemeSelect} />
                </PopoverContent>
              </Popover>

              <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="iconSm">
                        <Laugh className="h-4 w-4" aria-hidden />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Emoji</TooltipContent>
                </Tooltip>
                <PopoverContent
                  align="start"
                  side="top"
                  sideOffset={8}
                  className="w-auto p-0 border-0 bg-transparent shadow-none"
                >
                  <EmojiPicker
                    onSelect={(emoji) => {
                      handleTyping(`${value}${emoji}`);
                      setEmojiOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="iconSm" 
                    onClick={() => { 
                      if (!forceConfessionMode) setIsConfessionState(!isConfessionState); 
                      onTyping(false); 
                    }}
                    className={cn(isConfession && "text-violet-400 bg-violet-500/20 hover:bg-violet-500/30 hover:text-violet-300", forceConfessionMode && "opacity-50 cursor-default")}
                  >
                    <Ghost className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Confession Mode</TooltipContent>
              </Tooltip>

              {/* Self-destruct timer */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        className={cn(expiresInSeconds && "text-amber-400 hover:text-amber-300")}
                        aria-label="Set self-destruct timer"
                      >
                        <Timer className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Self-destruct timer</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Message expires in…</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {EXPIRY_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.label}
                      onClick={() => setExpiresInSeconds(option.seconds)}
                      className={cn(
                        "text-sm cursor-pointer",
                        expiresInSeconds === option.seconds && "text-amber-400 font-semibold"
                      )}
                    >
                      {option.seconds ? <Timer className="mr-2 h-3.5 w-3.5 text-amber-400/70" aria-hidden /> : <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button 
              type="button" 
              size="sm" 
              onClick={() => send()} 
              disabled={!value.trim() || isUploading} 
              className={cn(
                "rounded-full transition-all",
                isConfession ? "bg-violet-600 hover:bg-violet-500 shadow-[0_0_15px_-3px] shadow-violet-500/50" : "shadow-[0_0_15px_-3px] shadow-primary/40 hover:shadow-primary/60"
              )}
            >
              {isConfession ? <Ghost className="h-4 w-4 mr-1" aria-hidden /> : <Send className="h-4 w-4 mr-1" aria-hidden />}
              {isConfession ? "Confess" : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
