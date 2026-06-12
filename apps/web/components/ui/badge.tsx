import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "good" | "warn" | "hot" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded px-2 text-xs font-semibold",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "good" && "bg-primary/15 text-primary",
        tone === "warn" && "bg-amber-400/15 text-amber-200",
        tone === "hot" && "bg-accent/15 text-accent",
        className
      )}
      {...props}
    />
  );
}
