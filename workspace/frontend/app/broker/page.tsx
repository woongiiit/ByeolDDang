"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchMyListings } from "@/features/properties/api";
import { extractError } from "@/lib/api";
import { CATEGORY_LABELS, formatKRWShort } from "@/lib/format";
import type { PropertyListItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

export default function BrokerHome() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyListings()
      .then(setItems)
      .catch((e) => setError(extractError(e).message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <RequireLogin />;
  }
  if (!user.roles.includes("broker")) {
    return (
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="card p-12 text-center text-sm text-text-muted">
          중개사 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">중개사 작업실</h1>
          <p className="mt-1 text-sm text-text-muted">매물 등록 / 수신 의향서 / 거래 정산을 한 곳에서.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/broker/intents">
            <Button variant="secondary">수신 의향서</Button>
          </Link>
          <Link href="/broker/properties/new">
            <Button>
              <Plus size={14} /> 매물 등록
            </Button>
          </Link>
        </div>
      </header>

      <section className="card overflow-hidden">
        <div className="flex items-end justify-between p-5 pb-3">
          <h2 className="text-base font-semibold">등록한 매물</h2>
          <p className="text-xs text-text-muted">{loading ? "불러오는 중…" : `${items.length}건`}</p>
        </div>
        {error && <p className="px-5 pb-3 text-sm text-accent-red">{error}</p>}
        {items.length === 0 && !loading ? (
          <div className="grid place-items-center p-12 text-center text-sm text-text-muted">
            등록한 매물이 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg text-xs text-text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-medium">매물명</th>
                <th className="px-5 py-2 text-left font-medium">카테고리</th>
                <th className="px-5 py-2 text-right font-medium">호가</th>
                <th className="px-5 py-2 text-right font-medium">리뷰 수</th>
                <th className="px-5 py-2 text-right font-medium">평점</th>
                <th className="px-5 py-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium">{p.title}</td>
                  <td className="px-5 py-3">
                    <Badge>{CATEGORY_LABELS[p.category] ?? p.category}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKRWShort(p.price)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.review_count}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{p.rating_avg.toFixed(1)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/properties/${p.id}`} className="text-xs underline">
                      보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function RequireLogin() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="card grid place-items-center p-12 text-center">
        <p>로그인이 필요합니다.</p>
        <Link href="/auth/login" className="mt-4">
          <Button>로그인</Button>
        </Link>
      </div>
    </div>
  );
}
