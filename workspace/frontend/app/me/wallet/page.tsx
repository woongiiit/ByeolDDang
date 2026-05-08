"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchMyTransactions, fetchMyWallet } from "@/features/wallet/api";
import { extractError } from "@/lib/api";
import { formatKRW, formatTokens, tokensToKRW } from "@/lib/format";
import type { TokenTransaction } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

const TYPE_LABEL: Record<string, string> = {
  charge: "충전",
  spend_review: "리뷰 결제",
  earn_review_sale: "리뷰 판매",
  refund: "환불",
  admin_adjust: "운영자 조정",
};

export default function WalletPage() {
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet } = useWalletStore();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([fetchMyWallet(), fetchMyTransactions(1, 50)])
      .then(([w, txRes]) => {
        setWallet(w);
        setTransactions(txRes.data);
      })
      .catch((e) => setError(extractError(e).message))
      .finally(() => setLoading(false));
  }, [user, setWallet]);

  if (!user) {
    return (
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="card grid place-items-center p-12 text-center">
          <p>로그인이 필요합니다.</p>
          <Link href="/auth/login" className="mt-4">
            <Button>로그인</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">코인 월렛</h1>
          <p className="mt-1 text-sm text-text-muted">코인(BYT) 잔액과 모든 거래 내역을 확인합니다.</p>
        </div>
        <Link href="/wallet/charge">
          <Button>충전하기</Button>
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <KpiCard label="현재 잔액" value={wallet?.balance_tokens ?? 0} highlight />
        <KpiCard label="누적 충전" value={wallet?.total_charged ?? 0} />
        <KpiCard label="누적 사용" value={wallet?.total_spent ?? 0} />
        <KpiCard label="누적 적립" value={wallet?.total_earned ?? 0} />
      </section>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      <section className="card overflow-hidden">
        <div className="flex items-end justify-between p-5 pb-3">
          <h2 className="text-base font-semibold">거래 내역</h2>
          <p className="text-xs text-text-muted">
            {loading ? "불러오는 중…" : `최근 ${transactions.length}건`}
          </p>
        </div>
        {transactions.length === 0 && !loading ? (
          <div className="p-12 text-center text-sm text-text-muted">아직 거래 내역이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg text-xs text-text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-medium">일시</th>
                <th className="px-5 py-2 text-left font-medium">구분</th>
                <th className="px-5 py-2 text-left font-medium">메모</th>
                <th className="px-5 py-2 text-right font-medium">변화</th>
                <th className="px-5 py-2 text-right font-medium">잔액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3 text-xs text-text-muted">
                    {new Date(t.created_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={t.direction === "in" ? "success" : "default"}>
                      {TYPE_LABEL[t.type] ?? t.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{t.memo ?? "-"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span className={t.direction === "in" ? "text-accent-green" : "text-accent-red"}>
                      {t.direction === "in" ? "+" : "-"}
                      {formatTokens(t.tokens)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {formatTokens(t.balance_after)}
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

function KpiCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card p-5 ${highlight ? "bg-primary text-primary-foreground" : ""}`}>
      <p className={`text-xs ${highlight ? "text-primary-foreground/70" : "text-text-muted"}`}>{label}</p>
      <p className="mt-2 flex items-center gap-1 text-2xl font-bold tabular-nums">
        {highlight ? <Coins size={18} className="text-amber-600" aria-hidden /> : null}
        {formatTokens(value)}
      </p>
      <p className={`text-[11px] ${highlight ? "text-primary-foreground/60" : "text-text-muted"}`}>
        ≈ {formatKRW(tokensToKRW(value))}
      </p>
    </div>
  );
}
