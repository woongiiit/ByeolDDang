"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="card flex items-center gap-2 p-2"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search size={16} className="text-text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="지역, 건물명 또는 키워드 검색"
          className="h-10 w-full bg-transparent text-sm placeholder:text-text-muted focus:outline-none"
        />
      </div>
      <Button type="button" variant="secondary" size="sm" className="hidden md:inline-flex">
        <SlidersHorizontal size={14} /> 필터링
      </Button>
      <Button type="submit" size="sm">
        검색하기
      </Button>
    </form>
  );
}
