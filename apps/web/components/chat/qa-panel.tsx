"use client";

import { useState } from "react";
import { CheckCircle, Clock, Send, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type Question = {
  id: string;
  groupId: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};

type QAPanelProps = {
  questions: Question[];
  onAskQuestion: (question: string) => void | Promise<void>;
  onAnswerQuestion?: (questionId: string, answer: string) => void | Promise<void>;
  isAdmin: boolean;
  isSubmitting?: boolean;
  onClose?: () => void;
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function QuestionItem({
  question,
  isAdmin,
  onAnswer
}: {
  question: Question;
  isAdmin: boolean;
  onAnswer?: ((questionId: string, answer: string) => void | Promise<void>) | undefined;
}) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !onAnswer) return;
    setIsAnswering(true);
    try {
      await onAnswer(question.id, answerText.trim());
      setAnswerText("");
      setShowAnswerForm(false);
    } finally {
      setIsAnswering(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      {/* Question text */}
      <p className="text-sm font-medium text-foreground leading-relaxed">{question.question}</p>

      {/* Timestamp */}
      <p className="mt-1.5 text-xs text-muted-foreground">{formatRelativeTime(question.createdAt)}</p>

      {/* Answer block */}
      {question.answer ? (
        <div className="mt-3 flex gap-2 rounded-md border border-primary/20 bg-primary/10 p-3">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary mb-1">Admin Answer</p>
            <p className="text-sm text-foreground leading-relaxed">{question.answer}</p>
            {question.answeredAt && (
              <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(question.answeredAt)}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          <span>Awaiting answer...</span>
        </div>
      )}

      {/* Admin answer form */}
      {isAdmin && !question.answer && (
        <div className="mt-3">
          {!showAnswerForm ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-primary hover:text-primary"
              onClick={() => setShowAnswerForm(true)}
            >
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
              Answer this question
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Write your answer..."
                className="min-h-[72px] text-sm"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => { setShowAnswerForm(false); setAnswerText(""); }}
                  disabled={isAnswering}
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 gap-1 text-xs"
                  onClick={() => void handleSubmitAnswer()}
                  disabled={isAnswering || !answerText.trim()}
                >
                  <Send className="h-3.5 w-3.5" aria-hidden />
                  {isAnswering ? "Sending..." : "Post Answer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function QAPanel({ questions, onAskQuestion, onAnswerQuestion, isAdmin, isSubmitting = false, onClose }: QAPanelProps) {
  const [newQuestion, setNewQuestion] = useState("");

  const handleAsk = async () => {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    await onAskQuestion(trimmed);
    setNewQuestion("");
  };

  const charCount = newQuestion.length;
  const maxChars = 1000;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-2 shrink-0">
        <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold text-foreground">Ask Admin</h2>
        <span className="ml-auto text-xs text-muted-foreground">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
        {onClose && (
          <Button type="button" variant="ghost" size="iconSm" onClick={onClose} aria-label="Close">
            <ChevronUp className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>

      {/* Question input */}
      <div className="shrink-0 rounded-xl border border-white/10 bg-black/30 p-3">
        <Textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value.slice(0, maxChars))}
          placeholder="Ask the admin something anonymously..."
          className="min-h-[80px] border-0 bg-transparent px-0 py-0 text-sm focus:ring-0 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.preventDefault();
              void handleAsk();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={cn("text-xs", charCount > maxChars * 0.9 ? "text-amber-400" : "text-muted-foreground")}>
            {charCount}/{maxChars}
          </span>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => void handleAsk()}
            disabled={isSubmitting || !newQuestion.trim()}
          >
            <Send className="h-3.5 w-3.5" aria-hidden />
            {isSubmitting ? "Sending..." : "Ask"}
          </Button>
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-2 overflow-y-auto scrollbar-thin">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" aria-hidden />
            <p className="text-sm">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              isAdmin={isAdmin}
              onAnswer={onAnswerQuestion}
            />
          ))
        )}
      </div>
    </div>
  );
}
