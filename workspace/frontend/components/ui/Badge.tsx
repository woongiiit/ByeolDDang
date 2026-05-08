import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "premium" | "success" | "info" | "warning";

const tones: Record<Tone, string> = {
  default: "bg-bg text-text-muted",
  premium: "bg-primary text-primary-foreground",
  success: "bg-accent-green/10 text-accent-green",
  info: "bg-accent-blue/10 text-accent-blue",
  warning: "bg-accent-orange/10 text-accent-orange",
};

export function Badge({
  tone = "default",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
