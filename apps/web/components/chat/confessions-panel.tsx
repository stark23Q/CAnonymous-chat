import { useEffect, useState } from "react";
import { Ghost, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Confession } from "@/lib/types";

export function ConfessionsPanel({
  groupId,
  socket,
  onClose
}: {
  groupId: string;
  socket: Socket | null;
  onClose: () => void;
}) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await apiFetch<{ confessions: Confession[] }>(`/api/groups/${groupId}/confessions`);
        if (active) {
          setConfessions(data.confessions);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load confessions.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [groupId]);

  useEffect(() => {
    if (!socket) return;
    
    const onNewConfession = ({ confession }: { confession: Confession }) => {
      setConfessions((prev) => [confession, ...prev]);
    };

    socket.on("confession:new", onNewConfession);
    return () => {
      socket.off("confession:new", onNewConfession);
    };
  }, [socket]);

  useEffect(() => {
    const handleLocalPost = (e: Event) => {
      const customEvent = e as CustomEvent<Confession>;
      setConfessions((prev) => {
        // Prevent duplicates if socket arrived first
        if (prev.some((c) => c.id === customEvent.detail.id)) return prev;
        return [customEvent.detail, ...prev];
      });
    };
    
    window.addEventListener("confession:posted", handleLocalPost);
    return () => window.removeEventListener("confession:posted", handleLocalPost);
  }, []);

  return (
    <div className="flex h-full w-full flex-col border-l border-white/5 bg-background/50 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/5 p-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-400">
            <Ghost className="h-4 w-4" />
          </div>
          <h2 className="font-semibold text-foreground">Anonymous Confessions</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="iconSm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {loading && <p className="text-sm text-muted-foreground text-center mt-8">Loading secrets...</p>}
        {!loading && error && <p className="text-sm text-destructive text-center mt-8">{error}</p>}
        
        {!loading && !error && confessions.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center mt-12 gap-2 text-muted-foreground">
            <Ghost className="h-12 w-12 opacity-20" />
            <p>No confessions yet.</p>
            <p className="text-xs mb-4">Be the first to share a secret anonymously using the ghost icon in the composer.</p>
          </div>
        )}

        {!loading && confessions.map((confession) => (
          <div key={confession.id} className="relative rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-sm">
            <p className="text-sm text-indigo-100/90 whitespace-pre-wrap leading-relaxed">{confession.content}</p>
            <div className="mt-3 flex justify-end">
              <span className="text-[10px] uppercase tracking-wider text-indigo-400/60 font-medium">
                {new Date(confession.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
