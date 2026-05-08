"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api";
import { OUTLOOK_LABELS, formatKRWShort, formatTokens } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

interface MyReview {
  id: string;
  property_id: string;
  estimated_value: number;
  market_outlook: "bullish" | "neutral" | "bearish";
  price: number;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  rating_avg: number;
  rating_count: number;
}

export default function AppraiserHome() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.roles.includes("appraiser")) {
      setLoading(false);
      return;
    }
    apiClient
      .get<MyReview[]>("/appraiser/reviews")
      .then((res) => setItems(res.data))
      .catch((e) => setError(e?.response?.data?.detail?.message ?? e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card grid place-items-center p-12 text-center">
          <p>로그인이 필요합니다.</p>
          <Link href="/auth/login" className="mt-4"><Button>로그인</Button></Link>
        </div>
      </div>
    );
  }
  if (!user.roles.includes("appraiser")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="card p-8 text-center">
          <h2 className="text-lg font-semibold">감정평가사로 활동하시겠어요?</h2>
          <p className="mt-2 text-sm text-text-muted">
            감정사 권한이 없습니다. 회원가입에서 감정사 역할을 선택하거나, 관리자에게 문의해주세요.
          </p>
          <Link href="/auth/signup?role=appraiser" className="mt-4 inline-block">
            <Button>감정사로 가입</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">감정사 작업실</h1>
          <p className="mt-1 text-sm text-text-muted">발행한 리뷰와 누적 적립을 관리하세요.</p>
        </div>
        <Link href="/appraiser/reviews/new">
          <Button>+ 리뷰 작성</Button>
        </Link>
      </header>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      <section className="card overflow-hidden">
        <div className="flex items-end justify-between p-5 pb-3">
          <h2 className="text-base font-semibold">발행한 리뷰</h2>
          <p className="text-xs text-text-muted">{loading ? "불러오는 중…" : `${items.length}건`}</p>
        </div>
        {items.length === 0 && !loading ? (
          <div className="grid place-items-center p-12 text-center text-sm text-text-muted">
            발행한 리뷰가 없습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg text-xs text-text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-medium">매물</th>
                <th className="px-5 py-2 text-left font-medium">상태</th>
                <th className="px-5 py-2 text-right font-medium">추정가</th>
                <th className="px-5 py-2 text-right font-medium">전망</th>
                <th className="px-5 py-2 text-right font-medium">판매가</th>
                <th className="px-5 py-2 text-right font-medium">평점</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => {
                const outlook = OUTLOOK_LABELS[r.market_outlook];
                return (
                  <tr key={r.id}>
                    <td className="px-5 py-3">
                      <Link href={`/properties/${r.property_id}`} className="text-xs underline-offset-4 hover:underline">
                        #{r.property_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={r.status === "published" ? "success" : "default"}>
                        {r.status === "published" ? "공개" : r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatKRWShort(r.estimated_value)}</td>
                    <td className={`px-5 py-3 text-right ${outlook.tone}`}>{outlook.label}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatTokens(r.price)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {r.rating_avg.toFixed(1)} ({r.rating_count})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
