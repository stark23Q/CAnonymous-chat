"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams?.get("invite") || "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pollingInfo, setPollingInfo] = useState<{ requestId: string; claimToken: string } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<{ requestId: string; claimToken: string }>("/api/auth/join/request", {
        method: "POST",
        body: JSON.stringify({
          inviteCode,
          reason
        })
      });
      setPollingInfo({ requestId: data.requestId, claimToken: data.claimToken });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pollingInfo) return;

    let active = true;
    let pollInterval: ReturnType<typeof setInterval>;

    const pollStatus = async () => {
      try {
        const { status } = await apiFetch<{ status: string }>(`/api/auth/join/status?requestId=${pollingInfo.requestId}`);
        
        if (status === "REJECTED") {
          if (active) setClaimError("Your request to join was rejected.");
          clearInterval(pollInterval);
          return;
        }

        if (status === "APPROVED") {
          clearInterval(pollInterval);
          // Claim the token immediately
          const claimRes = await apiFetch<{ accessToken: string }>("/api/auth/join/claim", {
            method: "POST",
            body: JSON.stringify({ token: pollingInfo.claimToken })
          });
          if (active) {
            window.localStorage.setItem("notrace_access", claimRes.accessToken);
            router.push("/");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    pollInterval = setInterval(pollStatus, 3000);
    void pollStatus();

    return () => {
      active = false;
      clearInterval(pollInterval);
    };
  }, [pollingInfo, router]);

  if (success) {
    return (
      <div className="relative grid h-dvh place-items-center bg-transparent text-foreground">
        <div className="glass-card z-10 flex w-full max-w-sm flex-col items-center gap-6 p-8 text-center animate-fade-up">
          <div className="grid h-20 w-20 animate-pulse place-items-center rounded-full border border-primary/40 bg-primary/20 text-primary shadow-[0_0_30px_-5px] shadow-primary/30">
            <Shield className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Authenticating</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your request is secure. Please wait while an administrator approves your entry. You will be connected automatically.
            </p>
          </div>
          {claimError && <p className="mt-2 text-sm font-semibold text-destructive">{claimError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid h-dvh place-items-center bg-transparent text-foreground">
      <div className="glass-card z-10 flex w-full max-w-md flex-col gap-8 p-10 animate-fade-up">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="mb-2 grid h-16 w-16 place-items-center rounded-2xl border border-primary/40 bg-primary/20 text-primary shadow-[0_0_30px_-5px] shadow-primary/30">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">NoTrace</h1>
          <p className="text-muted-foreground">Secure, invite-only anonymous network.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="inviteCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Access Code</label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. NOTRACE-DEMO"
              required
              className="h-12 bg-black/40 border-white/10 focus-visible:ring-primary/50 text-lg transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alias / Reason (Optional)</label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Who are you?"
              className="h-12 bg-black/40 border-white/10 focus-visible:ring-primary/50 transition-all"
            />
          </div>

          {error && <p className="text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">{error}</p>}

          <Button type="submit" size="default" disabled={loading || !inviteCode} className="mt-2 h-12 text-base font-bold shadow-[0_0_20px_-5px] shadow-primary/40 hover:shadow-primary/60 transition-all hover:scale-[1.02]">
            {loading ? "Establishing Connection..." : "Request Entry"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="grid h-dvh place-items-center text-muted-foreground">Loading...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}
