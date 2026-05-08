"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchPendingTransactions, verifyTransaction } from "@/features/admin/api";
import { extractError } from "@/lib/api";
import { formatKRW } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";

interface Tx {
  id: string;
  property_id: string;
  sale_price: number;
  platform_fee: number;
  broker_fee: number;
  appraiser_bonus_total: number;
  total_fee: number;
  status: string;
}

export default function TransactionAdmin() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    fetchPendingTransactions()
      .then((data) => setItems(data))
      .catch((e) => setError(extractError(e).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || !user.roles.includes("admin")) return;
    reload();
  }, [user]);

  if (!user || !user.roles.includes("admin")) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card p-12 text-center text-sm text-text-muted">관리자 전용 페이지입니다.</div>
      </div>
    );
  }

  const handleVerify = async (id: string) => {
    if (!confirm("이 거래를 검증 완료 처리하고 정산을 트리거하시겠습니까?")) return;
    try {
      await verifyTransaction(id);
      reload();
    } catch (e) {
      alert(extractError(e).message);
    }
  };

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">거래 검증 관리</h1>
          <p className="mt-1 text-sm text-text-muted">중개사가 신고한 거래의 진위를 확인하고 정산을 진행합니다.</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">대시보드</Button>
        </Link>
      </header>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      {loading ? (
        <p className="text-sm text-text-muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center text-text-muted">
          검증 대기중인 거래가 없습니다.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg text-xs text-text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-medium">매물</th>
                <th className="px-5 py-2 text-right font-medium">거래가</th>
                <th className="px-5 py-2 text-right font-medium">중개 수수료</th>
                <th className="px-5 py-2 text-right font-medium">플랫폼 수수료</th>
                <th className="px-5 py-2 text-right font-medium">감정사 보너스</th>
                <th className="px-5 py-2 text-left font-medium">상태</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3">
                    <Link href={`/properties/${t.property_id}`} className="text-xs underline">
                      #{t.property_id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKRW(t.sale_price)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKRW(t.broker_fee)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKRW(t.platform_fee)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKRW(t.appraiser_bonus_total)}</td>
                  <td className="px-5 py-3"><Badge tone="info">{t.status}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" onClick={() => handleVerify(t.id)}>검증 완료</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
