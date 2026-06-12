"use client";

import { useState } from "react";
import { Ghost, Send, ShieldOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ConfessionComposer({
  onConfess,
  onClose,
}: {
  onConfess: (content: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfess = async () => {
    const content = value.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      await onConfess(content);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shrink-0 px-4 pb-6 pt-2 md:px-6 md:pb-8">
      <div className="mx-auto max-w-4xl">
        {/* Confession mode banner */}
        <div className="mb-2 flex items-center gap-2 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
          <ShieldOff className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden />
          <span className="flex-1 font-medium">
            Your identity will{" "}
            <span className="font-bold text-violet-200">NOT</span> appear.
            Completely anonymous.
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit confession mode"
            className="text-violet-400/60 hover:text-violet-200 transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Composer box — violet tinted */}
        <div
          className={cn(
            "rounded-2xl border border-violet-500/25 bg-violet-950/40 p-2 shadow-lg transition-all",
            "focus-within:border-violet-400/50 focus-within:shadow-[0_0_20px_-5px] focus-within:shadow-violet-500/30"
          )}
        >
          {/* Ghost icon watermark */}
          <div className="relative">
            <Ghost
              className="pointer-events-none absolute right-3 top-2.5 h-5 w-5 text-violet-500/30"
              aria-hidden
            />
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleConfess();
                }
              }}
              rows={3}
              maxLength={1000}
              placeholder="Share your confession… no one will know it's you."
              className={cn(
                "min-h-[72px] resize-none border-0 bg-transparent px-2 py-2 pr-10 text-sm text-foreground placeholder:text-violet-400/40",
                "focus:ring-0 focus-visible:ring-0"
              )}
            />
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            {/* Character count */}
            <span
              className={cn(
                "text-xs tabular-nums",
                value.length > 900
                  ? "text-red-400"
                  : "text-muted-foreground/50"
              )}
            >
              {value.length}/1000
            </span>

            <div className="flex items-center gap-2">
              {/* Cancel button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 mr-1" aria-hidden />
                Cancel
              </Button>

              {/* Submit button */}
              <Button
                type="button"
                size="sm"
                disabled={!value.trim() || submitting}
                onClick={handleConfess}
                className={cn(
                  "rounded-full font-semibold transition-all",
                  "bg-violet-600 text-white hover:bg-violet-500",
                  "shadow-[0_0_15px_-3px] shadow-violet-500/50 hover:shadow-violet-400/60",
                  "disabled:opacity-50"
                )}
              >
                <Ghost className="h-3.5 w-3.5" aria-hidden />
                {submitting ? "Posting…" : "Confess Anonymously"}
              </Button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          Confessions are permanently anonymous. No metadata is stored.
        </p>
      </div>
    </div>
  );
}
