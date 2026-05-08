"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Coins } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { chargeTokens, fetchMyWallet, fetchTokenPackages } from "@/features/wallet/api";
import { extractError } from "@/lib/api";
import { formatKRW, formatTokens } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TokenPackage } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

export default function ChargePage() {
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet } = useWalletStore();

  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ tokens: number; balance: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTokenPackages()
      .then((data) => {
        setPackages(data);
        if (data.length > 0) setSelected(data[Math.min(1, data.length - 1)].id);
      })
      .catch((e) => setError(extractError(e).message))
      .finally(() => setLoading(false));
  }, []);

  const handleCharge = async () => {
    if (!selected) return;
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await chargeTokens(selected);
      setWallet(res.wallet);
      setSuccess({ tokens: res.granted_tokens, balance: res.wallet.balance_tokens });
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-text" />
          <h1 className="mt-4 text-2xl font-bold">충전이 완료되었습니다</h1>
          <p className="mt-2 text-sm text-text-muted">
            <span className="font-semibold text-text">{formatTokens(success.tokens)}</span>이 잔액에 추가되었습니다.
          </p>
          <div className="mt-6 rounded-card bg-bg p-4 text-left text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">현재 잔액</span>
              <span className="font-semibold tabular-nums">{formatTokens(success.balance)}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/">
              <Button variant="secondary" className="w-full">
                매물 보러가기
              </Button>
            </Link>
            <Link href="/me/wallet">
              <Button className="w-full">월렛 내역 보기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">코인 충전</h1>
          <p className="mt-1 text-sm text-text-muted">
            서비스 내 결제 재화 <span className="font-semibold text-text">코인</span>(BYT)을 충전합니다. 1코인 = 100원.
          </p>
        </div>
        {user && (
          <div className="card flex items-center gap-2 px-4 py-2 text-sm">
            <Coins size={16} className="text-amber-600" aria-hidden />
            <span className="text-text-muted">현재 잔액</span>
            <span className="font-semibold tabular-nums">{formatTokens(wallet?.balance_tokens ?? 0)}</span>
          </div>
        )}
      </div>

      {!user && (
        <div className="card mb-4 flex items-center justify-between p-4 text-sm">
          <span>로그인 후 충전이 가능합니다.</span>
          <Link href="/auth/login">
            <Button size="sm">로그인</Button>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="text-text-muted">패키지 목록을 불러오는 중…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((p, i) => {
            const total = p.tokens + p.bonus_tokens;
            const isSelected = selected === p.id;
            const isPopular = i === 2;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "card flex flex-col gap-3 p-5 text-left transition",
                  isSelected ? "ring-2 ring-primary" : "hover:bg-bg",
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.name}</p>
                  {isPopular && <Badge tone="premium">인기</Badge>}
                </div>
                <div>
                  <p className="text-xs text-text-muted">지급</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {formatTokens(total)}
                  </p>
                  {p.bonus_tokens > 0 && (
                    <p className="text-[11px] text-accent-orange">
                      기본 {p.tokens}코인 + 보너스 {p.bonus_tokens}코인
                    </p>
                  )}
                </div>
                <div className="border-t border-border pt-3 text-sm">
                  <p className="font-semibold tabular-nums">{formatKRW(p.price_krw)}</p>
                  {p.description && (
                    <p className="mt-1 text-xs text-text-muted">{p.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-accent-red">{error}</p>}

      <div className="mt-6 rounded-md bg-bg px-4 py-3 text-xs text-text-muted">
        ※ 결제 PG는 추후 연동 예정입니다. 현재는 데모 모드로, 결제 버튼을 누르면 즉시 코인이 적립됩니다.
        실제 PG 연동 후에는 토스페이먼츠 등 카드/계좌이체 결제가 진행됩니다.
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Link href="/">
          <Button variant="secondary">취소</Button>
        </Link>
        <Button onClick={handleCharge} disabled={!selected || !user || submitting} size="lg">
          {submitting ? "처리 중…" : "결제하기 (데모)"}
        </Button>
      </div>

      <Image
        src="/token-coin.svg"
        alt=""
        width={1}
        height={1}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
