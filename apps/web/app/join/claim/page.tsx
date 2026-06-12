"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);
  const claimed = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No claim token provided.");
      return;
    }

    if (claimed.current) return;
    claimed.current = true;

    let active = true;

    async function claimToken() {
      try {
        const response = await apiFetch<{ accessToken: string }>("/api/auth/join/claim", {
          method: "POST",
          body: JSON.stringify({ token })
        });

        if (!active) return;

        window.localStorage.setItem("notrace_access", response.accessToken);
        setStatus("success");
        setTimeout(() => {
          if (active) {
            router.push("/");
          }
        }, 1500);
      } catch (err) {
        if (!active) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to claim profile.");
      }
    }

    void claimToken();

    return () => {
      active = false;
    };
  }, [token, router]);

  return (
    <div className="grid h-dvh place-items-center bg-background text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-primary/30 bg-primary/15 text-primary">
          <Shield className="h-8 w-8" />
        </div>
        
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold">Generating Identity...</h1>
            <p className="text-muted-foreground">
              We are generating your unique anonymous profile. Please wait...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold">Identity Claimed!</h1>
            <p className="text-muted-foreground">
              Your anonymous profile has been successfully generated. Redirecting you to the chat...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-destructive">Claim Failed</h1>
            <p className="text-muted-foreground">
              {error}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              The invite might have expired or has already been used.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="grid h-dvh place-items-center bg-background text-foreground">
        <div className="grid h-16 w-16 place-items-center rounded-full border border-primary/30 bg-primary/15 text-primary">
          <Shield className="h-8 w-8 animate-pulse" />
        </div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}
