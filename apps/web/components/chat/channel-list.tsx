"use client";

import { Hash, Mic2, Shield, TimerReset } from "lucide-react";
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
  onSelect
}: {
  community: Community;
  activeChannelId: string;
  onSelect: (channel: Channel) => void;
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
        <div className="mb-2 px-2 text-[11px] font-bold uppercase text-muted-foreground">Channels</div>
        <div className="space-y-1">
          {community.channels.map((channel) => {
            const active = channel.id === activeChannelId;
            const Icon = channel.kind === "VOICE_FUTURE" ? Mic2 : Hash;

            return (
              <Button
                key={channel.id}
                type="button"
                variant="ghost"
                className={cn(
                  "h-9 w-full justify-start rounded-md px-2 text-sm transition-all",
                  active ? "bg-primary/20 text-primary shadow-[0_0_15px_-3px] shadow-primary/20" : "hover:bg-white/5 hover:text-foreground hover:scale-[1.02]"
                )}
                onClick={() => onSelect(channel)}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left">{channel.name}</span>
                {channel.unread ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded bg-accent px-1 text-[11px] font-bold text-accent-foreground">
                    {channel.unread}
                  </span>
                ) : null}
              </Button>
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
