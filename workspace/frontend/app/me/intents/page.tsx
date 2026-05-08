"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchMyIntents } from "@/features/properties/api";
import { extractError } from "@/lib/api";
import { formatKRW } from "@/lib/format";
import type { PurchaseIntent } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

const STATUS_LABEL: Record<string, { label: string; tone: "default" | "info" | "success" | "warning" }> = {
  submitted: { label: "제출됨", tone: "info" },
  viewed: { label: "확인됨", tone: "default" },
  accepted: { label: "수락됨", tone: "success" },
  rejected: { label: "거절됨", tone: "warning" },
  withdrawn: { label: "철회", tone: "default" },
};

export default function MyIntentsPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<PurchaseIntent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchMyIntents()
      .then(setItems)
      .catch((e) => setError(extractError(e).message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="card grid place-items-center p-12 text-center">
          <p>로그인이 필요합니다.</p>
          <Link href="/auth/login" className="mt-4"><Button>로그인</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">매수 의향서</h1>
        <p className="mt-1 text-sm text-text-muted">제출한 의향서의 진행 상태를 확인하세요.</p>
      </header>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      {items.length === 0 && !loading ? (
        <div className="card grid place-items-center p-12 text-center text-text-muted">
          제출한 의향서가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const s = STATUS_LABEL[it.status] ?? STATUS_LABEL.submitted;
            return (
              <li key={it.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/properties/${it.property_id}`} className="text-sm font-semibold hover:underline">
                      매물 #{it.property_id.slice(0, 8)}…
                    </Link>
                    <p className="mt-1 text-xs text-text-muted">
                      제출일: {new Date(it.created_at).toLocaleString("ko-KR")}
                    </p>
                    {it.message && (
                      <p className="mt-2 rounded-md bg-bg px-3 py-2 text-xs">{it.message}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    <p className="mt-2 text-xs text-text-muted">의향가</p>
                    <p className="font-semibold tabular-nums">{formatKRW(it.offered_price)}</p>
                    {it.desired_close_date && (
                      <p className="mt-1 text-[11px] text-text-muted">
                        희망 클로징: {it.desired_close_date}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
