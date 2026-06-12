"use client";

import { useState } from "react";
import {
  BarChart2,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PollCard } from "@/components/chat/poll-card";
import { cn } from "@/lib/utils";
import type { Poll } from "@/lib/types";

type CreatePollPayload = {
  question: string;
  options: string[];
  closesAt?: string;
};

export function PollsPanel({
  polls,
  currentUserId,
  onCreatePoll,
  onVote,
  onClose,
}: {
  polls: Poll[];
  currentUserId: string;
  onCreatePoll: (payload: CreatePollPayload) => void;
  onVote: (pollId: string, optionId: string) => void;
  onClose: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 6) setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const isValid =
    question.trim().length > 0 &&
    options.filter((o) => o.trim().length > 0).length >= 2;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await onCreatePoll({
        question: question.trim(),
        options: options.filter((o) => o.trim()).map((o) => o.trim()),
        ...(closesAt ? { closesAt: new Date(closesAt).toISOString() } : {}),
      });
      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setClosesAt("");
      setCreating(false);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelCreate = () => {
    setCreating(false);
    setQuestion("");
    setOptions(["", ""]);
    setClosesAt("");
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-white/10 bg-black/60 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BarChart2 className="h-4 w-4 text-primary" aria-hidden />
          Polls
        </div>
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          onClick={onClose}
          aria-label="Close polls panel"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">

        {/* Create Poll button or inline form */}
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:border-primary/70 hover:bg-primary/10 transition-all"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create a new poll
          </button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/40 glass-panel p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              New Poll
            </p>

            {/* Question */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Question
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask something…"
                rows={2}
                maxLength={250}
                className="resize-none border-white/10 bg-white/5 text-sm"
              />
            </div>

            {/* Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Options{" "}
                <span className="text-muted-foreground/60">
                  ({options.length}/6)
                </span>
              </label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={100}
                      className="flex-1 border-white/10 bg-white/5 text-sm h-9"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="iconSm"
                        onClick={() => removeOption(i)}
                        className="shrink-0 text-muted-foreground hover:text-red-400"
                        aria-label={`Remove option ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </button>
              )}
            </div>

            {/* Optional closing time */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden />
                Close at (optional)
              </label>
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="border-white/10 bg-white/5 text-sm h-9"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="flex-1 rounded-full shadow-[0_0_15px_-3px] shadow-primary/40"
              >
                {submitting ? "Creating…" : "Create Poll"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="iconSm"
                onClick={cancelCreate}
                aria-label="Cancel"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        )}

        {/* Polls list */}
        {polls.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <BarChart2 className="h-8 w-8 opacity-30" aria-hidden />
            <p>No polls yet.</p>
            <p className="text-xs opacity-60">Create the first one above!</p>
          </div>
        )}

        {polls.map((poll) => {
          const userVote = poll.votes.find((v) => v.userId === currentUserId);
          return (
            <PollCard
              key={poll.id}
              poll={poll}
              userVotedId={userVote?.optionId ?? null}
              onVote={(optionId) => onVote(poll.id, optionId)}
            />
          );
        })}
      </div>
    </aside>
  );
}
