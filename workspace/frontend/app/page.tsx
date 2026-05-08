"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CategoryTabs } from "@/components/property/CategoryTabs";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SearchBar } from "@/components/property/SearchBar";
import { Button } from "@/components/ui/Button";
import { fetchProperties } from "@/features/properties/api";
import { extractError } from "@/lib/api";
import type { PropertyListItem } from "@/lib/types";

export default function HomePage() {
  const [pendingQuery, setPendingQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProperties({
      q: query || undefined,
      category: category !== "all" ? category : undefined,
    })
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((e) => {
        if (!cancelled) setError(extractError(e).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, category]);

  return (
    <div className="mx-auto max-w-page px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          검증된 가치를 찾는 부동산 마켓플레이스
        </h1>
        <p className="text-sm text-text-muted">
          전문 감정평가사의 유료 리뷰를 통해 정확한 미래 가치와 객관적인 시세를 확인하세요.
          모든 결제는 서비스 내 재화인{" "}
          <span className="font-semibold text-text">코인</span>으로 안전하게 진행됩니다.
        </p>
      </section>

      <section className="mt-6 space-y-4">
        <SearchBar
          value={pendingQuery}
          onChange={setPendingQuery}
          onSubmit={() => setQuery(pendingQuery)}
        />
        <CategoryTabs value={category} onChange={setCategory} />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold">인기 매물</h2>
            <p className="text-xs text-text-muted">
              {loading ? "불러오는 중…" : `${items.length}개의 매물 검색됨`}
            </p>
          </div>
        </div>

        {error ? (
          <div className="card grid place-items-center p-12 text-center text-text-muted">
            <p className="text-sm">데이터를 불러오지 못했습니다.</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        ) : items.length === 0 && !loading ? (
          <div className="card grid place-items-center p-16 text-text-muted">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(loading && items.length === 0
              ? Array.from({ length: 6 }).map((_, i) => i)
              : items
            ).map((p, i) =>
              typeof p === "number" ? (
                <div key={i} className="card aspect-[4/3] animate-pulse bg-bg" />
              ) : (
                <PropertyCard key={p.id} p={p} />
              ),
            )}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-8 grid place-items-center">
            <Button variant="secondary">매물 더 보기</Button>
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="card grid items-center gap-6 p-8 md:grid-cols-[1fr_auto]">
          <div>
            <p className="badge bg-bg text-text-muted">감정사 전용</p>
            <h3 className="mt-2 text-2xl font-semibold">전문 지식을 수익화하세요</h3>
            <p className="mt-3 max-w-xl text-sm text-text-muted">
              별땅의 공인 감정사가 되어 매물에 대한 전문적인 분석을 제공하고 리뷰 수익을 창출하세요.
              판매한 리뷰의 85%가 즉시 코인 잔액으로 적립됩니다.
            </p>
            <div className="mt-5 flex gap-2">
              <Link href="/auth/signup?role=appraiser">
                <Button>지금 감정 시작하기</Button>
              </Link>
              <Link href="/appraiser">
                <Button variant="secondary">감정사 가이드</Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-card bg-bg md:w-80">
            <Image
              src="https://placehold.co/960x720/png?text=%EA%B0%90%EC%A0%95%EC%82%AC"
              alt="감정사"
              fill
              sizes="320px"
              className="object-cover"
            />
            <div className="absolute bottom-3 left-3 rounded-md bg-surface/90 px-3 py-1.5 text-xs">
              김대표 감정사 · 누적 리뷰 240+
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
