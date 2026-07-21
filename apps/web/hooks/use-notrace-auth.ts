import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import type { NoTraceUser } from "@/lib/types";

export function useNoTraceAuth({ fallbackNotice }: { fallbackNotice: string }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<NoTraceUser | null>(null);
  const [welcomePhrase, setWelcomePhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("Connecting to NoTrace API...");

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        let token = typeof window === "undefined" ? null : window.localStorage.getItem("notrace_access");
        if (token) {
          try {
            const data = await apiFetch<{ user: NoTraceUser }>("/api/auth/me");
            if (!active) {
              return;
            }
            // Restore recovery phrase from local storage if cached
            const cachedRecovery = typeof window !== "undefined" ? window.localStorage.getItem("notrace_recovery") : null;
            const showWelcome = typeof window !== "undefined" ? window.localStorage.getItem("notrace_show_welcome") : null;

            const userData: NoTraceUser = { ...data.user };
            if (cachedRecovery) {
              userData.recoveryPhrase = cachedRecovery;
            }
            setUser(userData);
            setAccessToken(token);

            if (showWelcome === "true" && cachedRecovery) {
              setWelcomePhrase(cachedRecovery);
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("notrace_show_welcome");
              }
            }
          } catch {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("notrace_access");
              window.localStorage.removeItem("notrace_recovery");
            }
            token = null;
          }
        }

        if (active) {
          setTimeout(() => {
            if (active) setLoading(false);
          }, 0);
        }
      } catch {
        if (active) {
          setNotice(fallbackNotice);
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [fallbackNotice]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("notrace_access");
      window.localStorage.removeItem("notrace_recovery");
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return {
    accessToken,
    setAccessToken,
    user,
    setUser,
    welcomePhrase,
    setWelcomePhrase,
    loading,
    setLoading,
    notice,
    setNotice,
    logout
  };
}
