"use client";

import { Edit3, Hash, Mic2, Shield, TimerReset } from "lucide-react";
import type { Channel, Community } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const retentionLabels = {
  HOURS_24: "24 hours",
  DAYS_7: "7 days",
  DAYS_30: "30 days",
  NEVER: "never"
} as const;

export function ChannelList({
  community,
  activeChannelId,
  onSelect,
  onAddChannel,
  onEditChannel
}: {
  community: Community;
  activeChannelId: string;
  onSelect: (channel: Channel) => void;
  onAddChannel?: () => void;
  onEditChannel?: (channel: Channel) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-foreground">{community.name}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">{community.description}</p>
          </div>
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="good">{retentionLabels[community.retentionPolicy]}</Badge>
          {community.e2eeMode ? <Badge tone="warn">E2EE</Badge> : null}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
        <div className="mb-2 px-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">Channels</span>
          {onAddChannel && (
            <Button type="button" variant="ghost" size="iconSm" onClick={onAddChannel} className="h-5 w-5 text-muted-foreground hover:text-foreground">
              <span className="text-sm">+</span>
            </Button>
          )}
        </div>
        <div className="space-y-1">
          {community.channels.map((channel) => {
            const active = channel.id === activeChannelId;
            const Icon = channel.kind === "VOICE_FUTURE" ? Mic2 : Hash;

            return (
              <div key={channel.id} className="group flex items-center">
                <Button
                  type="button"
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "flex-1 justify-start gap-2",
                    active ? "font-semibold" : "font-medium text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onSelect(channel)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  <span className="truncate">{channel.name}</span>
                  {channel.unread ? (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {channel.unread}
                    </span>
                  ) : null}
                </Button>
                {onEditChannel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 ml-1 shrink-0"
                    onClick={() => onEditChannel(channel)}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TimerReset className="h-4 w-4 text-accent" aria-hidden />
          <span>Expires by community policy</span>
        </div>
      </div>
    </div>
  );
}
