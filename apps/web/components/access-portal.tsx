"use client";

import { useState } from "react";
import { Key, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
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

  const handleRecoveryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryPhrase) return;
    setRecoveryLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ accessToken: string; user: NoTraceUser }>("/api/auth/recovery-login", {
        method: "POST",
        body: JSON.stringify({ recoveryPhrase })
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notrace_recovery", recoveryPhrase);
      }
      onAuthenticated(res.accessToken, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to recover session.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#050505] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] text-foreground p-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="w-full max-w-md relative">
        {/* Glow Effects */}
        <div className="absolute -inset-[1px] bg-gradient-to-b from-primary/30 to-transparent rounded-3xl blur-md opacity-50" />
        <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-3xl" />
        
        <div className="relative glass-panel bg-black/60 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-2 shadow-[0_0_20px_-5px] shadow-primary/30">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">NoTrace</h1>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              Secure, ephemeral, and truly anonymous communication.
            </p>
          </div>

          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 p-1 rounded-xl mb-6">
              <TabsTrigger value="join" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">
                Join
              </TabsTrigger>
              <TabsTrigger value="recovery" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 transition-all">
                Recovery
              </TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive transition-all">
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="join" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={handleJoin} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Invite Token</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        placeholder="Paste your token..."
                        className="bg-black/40 border-white/10 pl-9 h-11 rounded-xl focus-visible:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Alias (Optional)</label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Choose an anonymous alias..."
                      className="bg-black/40 border-white/10 h-11 rounded-xl focus-visible:ring-primary/50 transition-all"
                      maxLength={20}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={userLoading || !inviteToken} className="w-full h-11 rounded-xl mt-2 font-semibold shadow-[0_0_20px_-5px] shadow-primary/40 hover:shadow-primary/60 transition-all">
                  {userLoading ? "Joining Anonymously..." : "Enter Room"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recovery" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={handleRecoveryLogin} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Recovery Phrase</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={recoveryPhrase}
                        onChange={(e) => setRecoveryPhrase(e.target.value)}
                        placeholder="Paste your recovery phrase..."
                        className="bg-black/40 border-white/10 pl-9 h-11 rounded-xl focus-visible:ring-blue-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={recoveryLoading || !recoveryPhrase} className="w-full h-11 rounded-xl mt-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-5px] shadow-blue-500/40 hover:shadow-blue-500/60 transition-all">
                  {recoveryLoading ? "Recovering..." : "Recover Session"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <form onSubmit={handleAdminLogin} className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Admin Password</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="bg-black/40 border-white/10 pl-9 h-11 rounded-xl focus-visible:ring-destructive/50 transition-all"
                    />
                  </div>
                </div>
                <Button type="submit" variant="destructive" disabled={adminLoading || !password} className="w-full h-11 rounded-xl mt-2 font-semibold shadow-[0_0_20px_-5px] shadow-destructive/40 hover:shadow-destructive/60 transition-all">
                  {adminLoading ? "Unlocking..." : "Unlock Dashboard"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-panel border-destructive/50 bg-destructive/10 text-destructive px-6 py-3 shadow-lg rounded-full text-sm font-medium animate-in fade-in slide-in-from-bottom-4 z-50">
          {error}
        </div>
      )}
    </div>
  );
}
