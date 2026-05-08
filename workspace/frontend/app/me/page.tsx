"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ClipboardPen, Coins, Pencil, Wallet as WalletIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchMyWallet } from "@/features/wallet/api";
import { extractError } from "@/lib/api";
import { formatKRW, formatTokens, tokensToKRW } from "@/lib/format";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

export default function MyPage() {
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet } = useWalletStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyWallet()
      .then(setWallet)
      .catch((e) => setError(extractError(e).message));
  }, [user, setWallet]);

  if (!user) {
    return (
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="card grid place-items-center p-12 text-center">
          <p className="text-sm">로그인이 필요합니다.</p>
          <Link href="/auth/login">
            <Button className="mt-4">로그인</Button>
          </Link>
        </div>
      </div>
    );
  }

  const balance = wallet?.balance_tokens ?? 0;
  const isAdmin = user.roles.includes("admin");
  const isAppraiser = user.roles.includes("appraiser");
  const isBroker = user.roles.includes("broker");

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {user.name.slice(0, 1)}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-xs text-text-muted">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <Badge key={r} tone={r === "admin" ? "premium" : "default"}>
                  {r}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-text-muted">보유 코인</p>
            <p className="flex items-center gap-1 text-2xl font-bold tabular-nums">
              <Coins size={18} className="text-amber-600" aria-hidden />
              {formatTokens(balance)}
            </p>
            <p className="text-[11px] text-text-muted">≈ {formatKRW(tokensToKRW(balance))}</p>
          </div>
          <Link href="/wallet/charge">
            <Button>충전</Button>
          </Link>
        </div>
      </header>

      {error && <p className="text-xs text-accent-red">{error}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <DashCard
          icon={<WalletIcon size={20} />}
          title="코인 월렛"
          desc="잔액·충전·사용·적립 내역"
          href="/me/wallet"
        />
        <DashCard
          icon={<Pencil size={20} />}
          title="매수 의향서"
          desc="제출한 의향서 현황"
          href="/me/intents"
        />
        {isAppraiser && (
          <DashCard
            icon={<ClipboardPen size={20} />}
            title="감정사 작업"
            desc="발행한 리뷰 / 정산 내역"
            href="/appraiser"
          />
        )}
        {isBroker && (
          <DashCard
            icon={<Building2 size={20} />}
            title="중개사 작업"
            desc="매물 등록 / 의향서 수신"
            href="/broker"
          />
        )}
        {isAdmin && (
          <DashCard
            icon={<Building2 size={20} />}
            title="관리자"
            desc="감정사 승인 / 거래 검증"
            href="/admin"
          />
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryStat label="누적 충전" value={wallet?.total_charged ?? 0} />
        <SummaryStat label="누적 사용" value={wallet?.total_spent ?? 0} />
        <SummaryStat label="누적 적립" value={wallet?.total_earned ?? 0} />
      </section>
    </div>
  );
}

function DashCard({
  icon,
  title,
  desc,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} className="card group flex items-start gap-4 p-5 transition hover:bg-bg">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-bg text-text-muted group-hover:bg-surface">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-text-muted">{desc}</p>
      </div>
      <span className="text-text-muted">→</span>
    </Link>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{formatTokens(value)}</p>
      <p className="text-[11px] text-text-muted">≈ {formatKRW(tokensToKRW(value))}</p>
    </div>
  );
}
