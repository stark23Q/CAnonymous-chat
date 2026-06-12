"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle, X, ShieldCheck } from "lucide-react";
import { AnonymousAvatar } from "@/components/anonymous-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CurrentUser = {
  anonymousName: string;
  avatarSeed: string;
};

type IdentityPanelProps = {
  currentUser: CurrentUser;
  onRotate: () => void | Promise<void>;
  onUpdateName: (newName: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
};

export function IdentityPanel({ currentUser, onRotate, onUpdateName, onClose, isLoading = false }: IdentityPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(currentUser.anonymousName);

  const handleConfirm = async () => {
    await onRotate();
    setConfirming(false);
  };

  const handleSaveName = async () => {
    if (newName.trim() && newName.trim() !== currentUser.anonymousName) {
      await onUpdateName(newName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div
      className={cn(
        "fixed bottom-20 right-4 z-50 w-72 rounded-xl border border-white/10 bg-black/80 shadow-2xl backdrop-blur-xl",
        "ring-1 ring-white/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          Your Identity
        </div>
        <Button type="button" variant="ghost" size="iconSm" onClick={onClose} aria-label="Close identity panel">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {/* Identity display */}
      <div className="flex flex-col items-center gap-3 px-4 py-5">
        <AnonymousAvatar seed={currentUser.avatarSeed} name={currentUser.anonymousName} size="lg" />
        
        {isEditingName ? (
          <div className="flex w-full items-center gap-2 mt-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded border border-white/20 bg-black/50 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <Button size="iconSm" variant="secondary" onClick={handleSaveName} disabled={isLoading}>
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center group relative cursor-pointer" onClick={() => setIsEditingName(true)}>
            <p className="text-base font-bold text-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
              {currentUser.anonymousName}
              <span className="text-[10px] uppercase opacity-50 group-hover:opacity-100 bg-white/10 px-1.5 py-0.5 rounded-sm">Edit</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Your current anonymous alias</p>
          </div>
        )}
      </div>

      {/* Action area */}
      <div className="border-t border-white/10 px-4 pb-4 pt-3">
        {!confirming ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2"
            onClick={() => setConfirming(true)}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Rotate Identity
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Warning */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              <span>
                Your alias and avatar will change. Past messages won&apos;t be linked to your new identity.
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirming(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => void handleConfirm()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
