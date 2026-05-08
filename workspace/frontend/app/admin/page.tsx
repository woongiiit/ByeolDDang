"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ScrollText, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchAppraiserApplications,
  fetchBrokerApplications,
  fetchPendingTransactions,
} from "@/features/admin/api";
import { useAuthStore } from "@/stores/auth";

export default function AdminHome() {
  const user = useAuthStore((s) => s.user);
  const [counts, setCounts] = useState({ appraisers: 0, brokers: 0, transactions: 0 });

  useEffect(() => {
    if (!user || !user.roles.includes("admin")) return;
    Promise.all([
      fetchAppraiserApplications("pending").catch(() => []),
      fetchBrokerApplications("pending").catch(() => []),
      fetchPendingTransactions().catch(() => []),
    ]).then(([a, b, t]) => {
      setCounts({ appraisers: a.length, brokers: b.length, transactions: t.length });
    });
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

  if (!user.roles.includes("admin")) {
    return (
      <div className="mx-auto max-w-md px-6 py-12">
        <div className="card p-12 text-center text-sm text-text-muted">
          관리자 권한이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">관리자 콘솔</h1>
        <p className="mt-1 text-sm text-text-muted">감정사·중개사 자격 승인, 거래 검증, 코인 조정.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <AdminLink
          icon={<Users size={20} />}
          title="감정사 승인 대기"
          count={counts.appraisers}
          href="/admin/appraisers"
        />
        <AdminLink
          icon={<Building2 size={20} />}
          title="중개사 승인 대기"
          count={counts.brokers}
          href="/admin/appraisers?tab=brokers"
        />
        <AdminLink
          icon={<ScrollText size={20} />}
          title="거래 검증 대기"
          count={counts.transactions}
          href="/admin/transactions"
        />
      </section>
    </div>
  );
}

function AdminLink({
  icon,
  title,
  count,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link href={href} className="card flex items-start justify-between p-5 transition hover:bg-bg">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-bg text-text-muted">{icon}</div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{count}</p>
        </div>
      </div>
      <Badge tone={count > 0 ? "warning" : "default"}>{count > 0 ? "처리 필요" : "정상"}</Badge>
    </Link>
  );
}
