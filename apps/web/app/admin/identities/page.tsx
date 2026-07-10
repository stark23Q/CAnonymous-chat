"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { apiFetch } from "@/lib/api";

type IdentityLog = {
  id: string;
  userId: string;
  groupId: string | null;
  oldName: string | null;
  newName: string;
  action: string;
  createdAt: string;
  user: {
    id: string;
    anonymousName: string;
    role: string;
  };
  group: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export default function IdentitiesAdminPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<IdentityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ logs: IdentityLog[] }>("/api/platform-admin/identities");
      setLogs(data.logs);
    } catch (err: any) {
      if (err.message?.includes("Forbidden") || err.message?.includes("Platform Admin access required") || err.message?.includes("Unauthorized")) {
        setError("Unauthorized. Platform Admin access required.");
      } else {
        setError(err.message || "Failed to fetch logs");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.id.toLowerCase().includes(search.toLowerCase()) || 
    log.newName.toLowerCase().includes(search.toLowerCase()) ||
    (log.oldName && log.oldName.toLowerCase().includes(search.toLowerCase())) ||
    (log.group && log.group.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight truncate">Global Identity Tracker</h1>
            </div>
          </div>
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm" className="self-end sm:self-auto shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center px-3 py-2 bg-muted/50 rounded-lg border border-border max-w-full sm:max-w-sm">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user ID, names, or groups..."
            className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Time</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">User ID (Real)</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Group</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Action</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium">Identity Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Loading ledger...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No identity logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-muted-foreground text-xs sm:text-sm">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          }).format(new Date(log.createdAt))}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-primary/80 max-w-[120px] truncate">
                          {log.user.id}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {log.group ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs font-medium truncate max-w-[100px]">
                              {log.group.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Global</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            {log.oldName ? (
                              <>
                                <span className="line-through text-muted-foreground truncate max-w-[60px] sm:max-w-none">{log.oldName}</span>
                                <span className="text-muted-foreground shrink-0">→</span>
                                <span className="font-semibold text-foreground truncate max-w-[60px] sm:max-w-none">{log.newName}</span>
                              </>
                            ) : (
                              <span className="font-semibold text-foreground">{log.newName}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
