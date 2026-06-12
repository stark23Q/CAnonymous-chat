import { cn } from "@/lib/utils";

const palettes = [
  ["#2dd4bf", "#0f766e", "#f97316"],
  ["#a78bfa", "#6d28d9", "#22c55e"],
  ["#fb7185", "#be123c", "#facc15"],
  ["#38bdf8", "#0369a1", "#f43f5e"],
  ["#fbbf24", "#92400e", "#14b8a6"]
];

function hash(seed: string) {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value << 5) - value + seed.charCodeAt(index);
    value |= 0;
  }
  return Math.abs(value);
}

export function AnonymousAvatar({
  seed,
  name,
  size = "md",
  className,
  onClick
}: {
  seed: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}) {
  const hashed = hash(seed);
  const palette = palettes[hashed % palettes.length] ?? palettes[0];
  const initials = name
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-md border border-white/10 font-bold text-white shadow-sm",
        size === "sm" && "h-7 w-7 text-[10px]",
        size === "md" && "h-9 w-9 text-xs",
        size === "lg" && "h-12 w-12 text-sm",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]} 56%, ${palette[2]})`
      }}
      aria-label={name}
      title={name}
      onClick={onClick}
    >
      <span className="relative z-10">{initials || "NT"}</span>
      <span
        className="absolute h-10 w-10 rotate-45 border border-white/25"
        style={{
          top: `${(hashed % 18) - 10}px`,
          left: `${(hashed % 22) - 8}px`
        }}
      />
      <span
        className="absolute h-5 w-12 -rotate-12 bg-black/20"
        style={{
          right: `${(hashed % 14) - 6}px`,
          bottom: `${(hashed % 16) - 6}px`
        }}
      />
    </div>
  );
}
