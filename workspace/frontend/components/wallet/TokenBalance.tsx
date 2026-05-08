"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { formatTokens } from "@/lib/format";
import { useWalletStore } from "@/stores/wallet";

export function TokenBalance() {
  const wallet = useWalletStore((s) => s.wallet);
  const balance = wallet?.balance_tokens ?? 0;

  return (
    <Link
      href="/wallet/charge"
      className="flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-sm transition hover:bg-bg"
      title="코인 충전"
    >
      <Coins size={14} className="text-amber-600" aria-hidden />
      <span className="tabular-nums font-medium">{formatTokens(balance)}</span>
    </Link>
  );
}
