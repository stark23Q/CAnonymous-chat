const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

let csrfToken: string | null = null;

export async function getCsrfToken(forceRefresh = false) {
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  const response = await fetch(`${API_URL}/api/auth/csrf`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Could not create CSRF token.");
  }

  const data = (await response.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  // Prevent 304 Not Modified responses breaking JSON parsing
  headers.set("cache-control", "no-cache");
  headers.set("pragma", "no-cache");

  if (init.method && init.method !== "GET") {
    headers.set("x-csrf-token", await getCsrfToken(isRetry));
  }

  const token = typeof window !== "undefined" ? window.localStorage.getItem("notrace_access") : null;
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    
    // Auto-retry once if CSRF token is invalid
    if (response.status === 403 && data?.error === "CSRF token is missing or invalid." && !isRetry) {
      return apiFetch(path, init, true);
    }

    // Auto-refresh token if 401
    if (response.status === 401 && data?.error === "Authentication required." && !isRetry) {
      try {
        const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": await getCsrfToken()
          },
          credentials: "include"
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json() as { accessToken: string };
          if (typeof window !== "undefined") {
            window.localStorage.setItem("notrace_access", refreshData.accessToken);
          }
          return apiFetch(path, init, true);
        } else {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("notrace_access");
            window.location.reload();
          }
        }
      } catch {
        // Fall through to error throw
      }
    }
    
    throw new Error(data?.error ?? "API request failed.");
  }

  return response.json() as Promise<T>;
}
