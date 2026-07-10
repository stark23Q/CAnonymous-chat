"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MemePicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const [memes, setMemes] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<number | null>(null);

  const fetchMemes = async (searchQuery: string) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_TENOR_API_KEY;
      if (!apiKey) {
        // Fallback for development if no key is provided
        console.warn("No Tenor API key found. Please set NEXT_PUBLIC_TENOR_API_KEY");
      }
      
      const endpoint = searchQuery.trim() 
        ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchQuery)}&key=${apiKey || "LIVDSRZULELA"}&client_key=notrace&limit=20`
        : `https://tenor.googleapis.com/v2/featured?key=${apiKey || "LIVDSRZULELA"}&client_key=notrace&limit=20`;

      const res = await fetch(endpoint);
      const data = await res.json();
      
      if (data.results) {
        setMemes(
          data.results.map((r: any) => ({
            id: r.id,
            url: r.media_formats.gif.url,
            preview: r.media_formats.tinygif.url,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch memes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemes("");
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      fetchMemes(val);
    }, 500);
  };

  return (
    <div className="flex flex-col h-[300px] w-[320px] bg-black/90 rounded-lg overflow-hidden border border-white/10">
      <div className="p-2 border-b border-white/10 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          value={query}
          onChange={handleSearch}
          placeholder="Search Tenor GIFs..." 
          className="pl-9 h-9 bg-white/5 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 text-sm"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && memes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : memes.length > 0 ? (
          <div className="columns-2 gap-2 space-y-2">
            {memes.map((meme) => (
              <button
                key={meme.id}
                type="button"
                onClick={() => onSelect(meme.url)}
                className="w-full relative rounded-md overflow-hidden bg-white/5 hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meme.preview} alt="GIF" loading="lazy" className="w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No GIFs found.
          </div>
        )}
      </div>
      <div className="p-1.5 border-t border-white/5 text-center bg-black">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Powered by Tenor</span>
      </div>
    </div>
  );
}
