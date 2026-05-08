"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  approveAppraiser,
  approveBroker,
  fetchAppraiserApplications,
  fetchBrokerApplications,
  rejectAppraiser,
} from "@/features/admin/api";
import { extractError } from "@/lib/api";
import type { AppraiserApplication, BrokerApplication } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

type Tab = "appraisers" | "brokers";

export default function AppraiserAdmin() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>("appraisers");
  const [appraisers, setAppraisers] = useState<AppraiserApplication[]>([]);
  const [brokers, setBrokers] = useState<BrokerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    Promise.all([fetchAppraiserApplications(""), fetchBrokerApplications("")])
      .then(([a, b]) => {
        setAppraisers(a);
        setBrokers(b);
      })
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

  const handleApproveA = async (id: string) => {
    try {
      await approveAppraiser(id);
      reload();
    } catch (e) {
      alert(extractError(e).message);
    }
  };
  const handleRejectA = async (id: string) => {
    const reason = prompt("거절 사유를 입력해주세요");
    if (!reason) return;
    try {
      await rejectAppraiser(id, reason);
      reload();
    } catch (e) {
      alert(extractError(e).message);
    }
  };
  const handleApproveB = async (id: string) => {
    try {
      await approveBroker(id);
      reload();
    } catch (e) {
      alert(extractError(e).message);
    }
  };

  return (
    <div className="mx-auto max-w-page px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold">자격 승인 관리</h1>
          <p className="mt-1 text-sm text-text-muted">감정사·중개사 가입 신청을 검토하고 승인합니다.</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">대시보드</Button>
        </Link>
      </header>

      <div className="border-b border-border">
        <div className="flex gap-6">
          <TabBtn active={tab === "appraisers"} onClick={() => setTab("appraisers")}>
            감정사 ({appraisers.filter((a) => a.status === "pending").length} 대기)
          </TabBtn>
          <TabBtn active={tab === "brokers"} onClick={() => setTab("brokers")}>
            중개사 ({brokers.filter((b) => b.status === "pending").length} 대기)
          </TabBtn>
        </div>
      </div>

      {error && <p className="text-sm text-accent-red">{error}</p>}

      {tab === "appraisers" ? (
        <AppraiserTable
          rows={appraisers}
          onApprove={handleApproveA}
          onReject={handleRejectA}
          loading={loading}
        />
      ) : (
        <BrokerTable rows={brokers} onApprove={handleApproveB} loading={loading} />
      )}
    </div>
  );
}

function AppraiserTable({
  rows,
  onApprove,
  onReject,
  loading,
}: {
  rows: AppraiserApplication[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-text-muted">불러오는 중…</p>;
  if (rows.length === 0)
    return <div className="card p-12 text-center text-sm text-text-muted">신청 내역이 없습니다.</div>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <article key={r.user_id} className="card flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{r.name}</p>
              <Badge
                tone={
                  r.status === "approved" ? "success" : r.status === "rejected" ? "warning" : "info"
                }
              >
                {r.status}
              </Badge>
            </div>
            <p className="text-xs text-text-muted">{r.email}</p>
            <p className="mt-1 text-xs">
              자격번호 <span className="font-medium">{r.license_no}</span>
              {r.years_of_experience ? ` · 경력 ${r.years_of_experience}년` : ""}
              {r.specialty ? ` · ${r.specialty}` : ""}
            </p>
            {r.bio && <p className="mt-1 text-xs text-text-muted">{r.bio}</p>}
            {r.rejection_reason && (
              <p className="mt-2 rounded-md bg-bg px-3 py-2 text-xs text-accent-red">
                거절 사유: {r.rejection_reason}
              </p>
            )}
          </div>
          {r.license_image_url && (
            <a href={r.license_image_url} target="_blank" rel="noreferrer">
              <Image
                src={r.license_image_url}
                alt="자격증"
                width={120}
                height={80}
                unoptimized
                className="h-20 w-30 rounded-md border border-border object-cover"
              />
            </a>
          )}
          <div className="flex gap-2">
            {r.status === "pending" ? (
              <>
                <Button size="sm" onClick={() => onApprove(r.user_id)}>승인</Button>
                <Button size="sm" variant="secondary" onClick={() => onReject(r.user_id)}>
                  거절
                </Button>
              </>
            ) : r.status === "rejected" ? (
              <Button size="sm" onClick={() => onApprove(r.user_id)}>재승인</Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function BrokerTable({
  rows,
  onApprove,
  loading,
}: {
  rows: BrokerApplication[];
  onApprove: (id: string) => void;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-text-muted">불러오는 중…</p>;
  if (rows.length === 0)
    return <div className="card p-12 text-center text-sm text-text-muted">신청 내역이 없습니다.</div>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <article key={r.user_id} className="card flex flex-col gap-3 p-5 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{r.name}</p>
              <Badge tone={r.status === "approved" ? "success" : "info"}>{r.status}</Badge>
            </div>
            <p className="text-xs text-text-muted">{r.email}</p>
            <p className="mt-1 text-xs">
              사무소 <span className="font-medium">{r.office_name}</span> · 자격번호 {r.license_no}
            </p>
            {r.office_address && (
              <p className="mt-1 text-xs text-text-muted">📍 {r.office_address}</p>
            )}
          </div>
          <div className="flex gap-2">
            {r.status === "pending" && (
              <Button size="sm" onClick={() => onApprove(r.user_id)}>
                승인
              </Button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative pb-3 text-sm transition ${
        active ? "font-semibold text-text" : "text-text-muted"
      }`}
    >
      {children}
      {active && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />}
    </button>
  );
}
