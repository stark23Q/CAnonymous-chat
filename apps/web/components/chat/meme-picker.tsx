"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  { label: "🔥 Trending", query: "" },
  { label: "😂 Haha", query: "funny" },
  { label: "❤️ Love", query: "love" },
  { label: "😢 Sad", query: "sad" },
  { label: "👏 Reactions", query: "reaction" },
  { label: "🎉 Celebrate", query: "celebrate" },
  { label: "😱 OMG", query: "shocked" },
  { label: "👍 Yes", query: "thumbs up" },
  { label: "🙄 Facepalm", query: "facepalm" },
];

const PAGE_SIZE = 30;

/** Build a permanent Giphy media URL that won't expire. */
function giphyMediaUrl(id: string, variant: "giphy.gif" | "200w.gif" | "100.gif" = "giphy.gif") {
  return `https://i.giphy.com/media/${id}/${variant}`;
}

export function MemePicker({ onSelect }: { onSelect: (url: string) => void }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [memes, setMemes] = useState<{ id: string; url: string; preview: string; width: number; height: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeout = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMemes = useCallback(async (searchQuery: string, pageOffset: number, append: boolean) => {
    setLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
      if (!apiKey) {
        console.warn("No Giphy API key found. Please set NEXT_PUBLIC_GIPHY_API_KEY");
        setMemes([]);
        return;
      }

      const endpoint = searchQuery.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(searchQuery)}&limit=${PAGE_SIZE}&offset=${pageOffset}&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${PAGE_SIZE}&offset=${pageOffset}&rating=g`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        console.error("Giphy API error:", res.status);
        if (!append) setMemes([]);
        return;
      }
      const data = await res.json();

      if (data.data) {
        const newMemes = data.data.map((r: any) => {
          let url = r.images?.original?.url || giphyMediaUrl(r.id, "giphy.gif");
          let preview = r.images?.fixed_width?.url || giphyMediaUrl(r.id, "200w.gif");

          return {
            id: r.id,
            url,
            preview,
            width: parseInt(r.images?.fixed_width?.width || "200", 10),
            height: parseInt(r.images?.fixed_width?.height || "150", 10),
          };
        });

        setMemes((prev) => (append ? [...prev, ...newMemes] : newMemes));
        setHasMore(data.data.length >= PAGE_SIZE);
        setOffset(pageOffset + data.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch memes", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMemes("", 0, false);
  }, [fetchMemes]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          const currentQuery = query.trim() || CATEGORIES[activeCategory]?.query || "";
          fetchMemes(currentQuery, offset, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query, activeCategory, fetchMemes]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveCategory(-1);

    if (searchTimeout.current) window.clearTimeout(searchTimeout.current);
    searchTimeout.current = window.setTimeout(() => {
      setOffset(0);
      setHasMore(true);
      fetchMemes(val, 0, false);
    }, 400);
  };

  const handleCategoryClick = (index: number) => {
    setActiveCategory(index);
    setQuery("");
    setOffset(0);
    setHasMore(true);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    fetchMemes(CATEGORIES[index].query, 0, false);
  };

  return (
    <div className="flex flex-col h-[380px] w-[360px] bg-black/95 rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-xl">
      {/* Search */}
      <div className="p-2.5 border-b border-white/5 relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleSearch}
          placeholder="Search GIFs..."
          className="pl-9 h-9 bg-white/5 border-transparent focus-visible:ring-1 focus-visible:ring-primary/50 text-sm rounded-lg"
        />
      </div>

      {/* Category Chips */}
      <div className="flex gap-1.5 px-2.5 py-2 overflow-x-auto scrollbar-none border-b border-white/5 shrink-0">
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => handleCategoryClick(i)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
              activeCategory === i
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* GIF Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-1.5">
        {loading && memes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : memes.length > 0 ? (
          <div className="columns-3 gap-1.5" style={{ columnFill: "balance" }}>
            {memes.map((meme) => (
              <button
                key={meme.id}
                type="button"
                onClick={() => onSelect(meme.url)}
                className="w-full mb-1.5 relative rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-primary/60 hover:scale-[1.02] transition-all focus:outline-none break-inside-avoid group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meme.preview}
                  alt="GIF"
                  loading="lazy"
                  className="w-full object-cover"
                  style={{ aspectRatio: `${meme.width}/${meme.height}` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4 w-full" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No GIFs found.
          </div>
        )}
        {loading && memes.length > 0 && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Giphy attribution */}
      <div className="p-1.5 border-t border-white/5 text-center bg-black/80">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Powered by GIPHY</span>
      </div>
    </div>
  );
}
