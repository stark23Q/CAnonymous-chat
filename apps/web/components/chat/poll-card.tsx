"use client";

import { BarChart2, CheckCircle2, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Poll } from "@/lib/types";

function formatClosesAt(value: string): string {
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 24) return `Closes in ${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `Closes in ${hours}h ${mins}m`;
  return `Closes in ${mins}m`;
}

export function PollCard({
  poll,
  userVotedId,
  onVote,
}: {
  poll: Poll;
  userVotedId?: string | null;
  onVote: (optionId: string) => void;
}) {
  const isClosed =
    poll.closesAt != null && new Date(poll.closesAt).getTime() <= Date.now();
  const hasVoted = !!userVotedId;

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (opt._count?.votes ?? 0),
    0
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 glass-panel p-4 shadow-lg w-full max-w-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="text-sm font-semibold text-foreground leading-snug">
            {poll.question}
          </p>
        </div>
        {isClosed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            <Lock className="h-2.5 w-2.5" aria-hidden />
            Closed
          </span>
        ) : poll.closesAt ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <Clock className="h-2.5 w-2.5" aria-hidden />
            {formatClosesAt(poll.closesAt)}
          </span>
        ) : null}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {poll.options.map((option) => {
          const votes = option._count?.votes ?? 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = userVotedId === option.id;
          const showResults = hasVoted || isClosed;

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasVoted || isClosed}
              onClick={() => onVote(option.id)}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all",
                isSelected
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : hasVoted || isClosed
                  ? "border-white/8 bg-white/[0.03] text-muted-foreground cursor-default"
                  : "border-white/10 bg-white/5 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              )}
              aria-pressed={isSelected}
            >
              {/* Progress bar fill (behind content) */}
              {showResults && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 origin-left transition-all duration-500",
                    isSelected ? "bg-primary/20" : "bg-white/[0.04]"
                  )}
                  style={{ transform: `scaleX(${pct / 100})` }}
                />
              )}

              {/* Option label + result */}
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  )}
                  <span className="truncate">{option.label}</span>
                </span>
                {showResults && (
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold tabular-nums",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {pct}%
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-3 text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {!hasVoted && !isClosed && (
          <span className="ml-1 text-muted-foreground/60">· tap an option to vote</span>
        )}
      </p>
    </div>
  );
}
