"use client";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "전체 매물" },
  { key: "apartment", label: "아파트" },
  { key: "villa", label: "빌라" },
  { key: "detached", label: "단독주택" },
  { key: "officetel", label: "오피스텔" },
  { key: "commercial", label: "상가·사무실" },
] as const;

export function CategoryTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={cn(
              "rounded-pill border px-4 py-1.5 text-sm transition whitespace-nowrap",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-text-muted hover:bg-bg",
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
