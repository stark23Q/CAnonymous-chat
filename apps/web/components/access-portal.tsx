"use client";

import { useState } from "react";
import { Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { NoTraceUser } from "@/lib/types";

export function AccessPortal({
  onAuthenticated
}: {
  onAuthenticated: (token: string, user: NoTraceUser) => void;
}) {
  const [inviteToken, setInviteToken] = useState("");
  const [customName, setCustomName] = useState("");
  const [password, setPassword] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken) return;
    setUserLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ accessToken: string; user: NoTraceUser }>("/api/auth/join/claim", {
        method: "POST",
        body: JSON.stringify({ 
          token: inviteToken,
          ...(customName.trim() ? { customName: customName.trim() } : {})
        })
      });
      onAuthenticated(res.accessToken, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setAdminLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ accessToken: string; user: NoTraceUser }>("/api/auth/dev-session", {
        method: "POST",
        body: JSON.stringify({ password })
      });
      onAuthenticated(res.accessToken, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to authenticate admin.");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-4xl grid gap-8 md:grid-cols-2">
        {/* User Card */}
        <div className="glass-panel p-8 shadow-soft flex flex-col gap-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex flex-col gap-2 relative">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Key className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Join Room</h2>
            <p className="text-sm text-muted-foreground">
              Have an invite token? Paste it here to join the room anonymously.
            </p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-4 mt-auto relative">
            <Input
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Paste your invite token..."
              className="bg-background/50"
            />
            <Input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Choose your name (optional)..."
              className="bg-background/50"
              maxLength={20}
            />
            <Button type="submit" disabled={userLoading || !inviteToken} className="w-full">
              {userLoading ? "Joining..." : "Enter Room"}
            </Button>
          </form>
        </div>

        {/* Admin Card */}
        <div className="glass-panel p-8 shadow-soft flex flex-col gap-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-bl from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex flex-col gap-2 relative">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Admin Access</h2>
            <p className="text-sm text-muted-foreground">
              Log in to manage the group, answer Q&A, and review reports.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="flex flex-col gap-4 mt-auto relative">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password..."
              className="bg-background/50 focus-visible:ring-destructive"
            />
            <Button type="submit" variant="secondary" disabled={adminLoading || !password} className="w-full">
              {adminLoading ? "Unlocking..." : "Unlock Dashboard"}
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel border-destructive/50 bg-destructive/10 text-destructive px-6 py-3 shadow-lg rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-4">
          {error}
        </div>
      )}
    </div>
  );
}
