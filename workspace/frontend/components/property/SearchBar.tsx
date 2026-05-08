"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface PropertyFilters {
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  roomsMin: number | null;
  bathroomsMin: number | null;
  premiumOnly: boolean;
}

const DEFAULT_FILTERS: PropertyFilters = {
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  roomsMin: null,
  bathroomsMin: null,
  premiumOnly: false,
};

export function SearchBar({
  value,
  onChange,
  onSubmit,
  filters,
  onApplyFilters,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  filters: PropertyFilters;
  onApplyFilters: (next: PropertyFilters) => void;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draft, setDraft] = useState<PropertyFilters>(filters);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.priceMin,
        filters.priceMax,
        filters.areaMin,
        filters.areaMax,
        filters.roomsMin,
        filters.bathroomsMin,
        filters.premiumOnly ? 1 : null,
      ].filter((v) => v !== null).length,
    [filters],
  );

  const openFilter = () => {
    setDraft(filters);
    setIsFilterOpen(true);
  };

  const updateNumberField = (key: keyof PropertyFilters, raw: string) => {
    const valueNum = raw.trim() === "" ? null : Number(raw);
    setDraft((prev) => ({ ...prev, [key]: Number.isFinite(valueNum) ? valueNum : null }));
  };

  const resetFilters = () => {
    setDraft(DEFAULT_FILTERS);
    onApplyFilters(DEFAULT_FILTERS);
    setIsFilterOpen(false);
  };

  const applyFilters = () => {
    onApplyFilters({
      ...draft,
      priceMin: draft.priceMin ?? null,
      priceMax: draft.priceMax ?? null,
      areaMin: draft.areaMin ?? null,
      areaMax: draft.areaMax ?? null,
      roomsMin: draft.roomsMin ?? null,
      bathroomsMin: draft.bathroomsMin ?? null,
      premiumOnly: !!draft.premiumOnly,
    });
    setIsFilterOpen(false);
  };

  return (
    <>
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
        <Button type="button" variant="secondary" size="sm" onClick={openFilter}>
          <SlidersHorizontal size={14} /> 필터링
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button type="submit" size="sm">
          검색하기
        </Button>
      </form>

      {isFilterOpen && (
        <div className="card mt-3 p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-semibold">검색 조건</h3>
            <button
              type="button"
              className="text-sm text-text-muted hover:text-text"
              onClick={() => setIsFilterOpen(false)}
            >
              접기
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최소 가격 (원)</span>
              <input
                type="number"
                min={0}
                value={draft.priceMin ?? ""}
                onChange={(e) => updateNumberField("priceMin", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최대 가격 (원)</span>
              <input
                type="number"
                min={0}
                value={draft.priceMax ?? ""}
                onChange={(e) => updateNumberField("priceMax", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최소 면적 (m²)</span>
              <input
                type="number"
                min={0}
                value={draft.areaMin ?? ""}
                onChange={(e) => updateNumberField("areaMin", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최대 면적 (m²)</span>
              <input
                type="number"
                min={0}
                value={draft.areaMax ?? ""}
                onChange={(e) => updateNumberField("areaMax", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최소 방 개수</span>
              <input
                type="number"
                min={0}
                value={draft.roomsMin ?? ""}
                onChange={(e) => updateNumberField("roomsMin", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-muted">최소 욕실 개수</span>
              <input
                type="number"
                min={0}
                value={draft.bathroomsMin ?? ""}
                onChange={(e) => updateNumberField("bathroomsMin", e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-bg px-3"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.premiumOnly}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, premiumOnly: e.target.checked }))
              }
            />
            프리미엄 감정 매물만 보기
          </label>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetFilters}>
              초기화
            </Button>
            <Button type="button" onClick={applyFilters}>
              적용하기
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
