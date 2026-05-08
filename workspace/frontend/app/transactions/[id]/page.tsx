"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatKRW } from "@/lib/format";

const KPI = [
  { label: "총 거래 금액", value: 925_500_000, color: "bg-primary text-primary-foreground", note: "총 구매자 결제액" },
  { label: "플랫폼 수수료", value: 42_500_000, color: "bg-accent-orange/10 text-accent-orange", note: "플랫폼 운영비 (5%)" },
  { label: "중개인 수수료", value: 25_500_000, color: "bg-accent-green/10 text-accent-green", note: "전담 중개 위탁료" },
  { label: "감정인 정산액", value: 5_000_000, color: "bg-accent-blue/10 text-accent-blue", note: "총 2건의 유료 리포트" },
];

const LEDGER = [
  { id: "TX-90210", label: "서초구 펜트하우스 잔금 결제", role: "부동산 대금", to: "김판매 (매도인)", amount: 850_000_000 },
  { id: "TX-90211", label: "별땅 거래 중개 플랫폼 수수료", role: "플랫폼 수수료", to: "별땅", amount: 42_500_000 },
  { id: "TX-90212", label: "부동산 중개 전문 수수료", role: "중개료", to: "이중개 (에이전트)", amount: 25_500_000 },
  { id: "TX-90213", label: "시장 가치 정밀 감정서 (VIP)", role: "감정비용", to: "박감정 (감정평가사)", amount: 2_500_000 },
  { id: "TX-90214", label: "향후 투자 전망 분석 보고서", role: "감정비용", to: "최전망 (감정평가사)", amount: 2_500_000 },
];

export default function TransactionPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="mx-auto max-w-page px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge tone="success">정산 완료</Badge>
          <span className="ml-2 text-xs text-text-muted">ID: #{id || "TRX-8829-1004"}</span>
          <h1 className="mt-2 text-3xl font-bold">거래 요약 및 정산 내역</h1>
          <p className="mt-1 text-sm text-text-muted">
            부동산 매매 대금 및 각 이해관계자(플랫폼, 중개인, 감정평가사)에게 분배되는 모든 수수료와 정산 항목을 확인하실 수 있습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Printer size={14} /> 인쇄하기
          </Button>
          <Button variant="secondary" size="sm">
            <Download size={14} /> PDF 장부 다운로드
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-start justify-between">
              <p className="text-xs text-text-muted">{k.label}</p>
              <span className={`grid h-7 w-7 place-items-center rounded-full ${k.color}`}>●</span>
            </div>
            <p className="mt-3 text-xl font-bold tabular-nums">{formatKRW(k.value)}</p>
            <p className="mt-1 text-[11px] text-text-muted">{k.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-6">
          <h2 className="text-base font-semibold">지분 분배 시각화</h2>
          <p className="text-xs text-text-muted">전체 거래 대금 중 각 주체별 배분 비중</p>
          <div className="mt-6 grid place-items-center">
            <DonutChart
              data={[
                { label: "매매 대금 (순수)", value: 850_000_000, color: "#0A0A0A" },
                { label: "플랫폼 수수료 (5%)", value: 42_500_000, color: "#F97316" },
                { label: "중개 수수료", value: 25_500_000, color: "#16A34A" },
                { label: "감정 평가 비용", value: 5_000_000, color: "#2563EB" },
              ]}
            />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold">상세 정산 요약</h2>
              <p className="text-xs text-text-muted">주요 계약 조건에 따른 최종 수수료 계산 결과</p>
            </div>
            <button className="text-xs text-text-muted underline">상세 조건 보기</button>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {[
              { label: "부동산 매매 가액 (순수)", sub: "매도인 수령 예정액", amount: 850_000_000 },
              { label: "플랫폼 서비스 이용료 (5.0%)", sub: "보증 및 거래 보호 서비스 포함", amount: 42_500_000 },
              { label: "에이전트 중개 수수료", sub: "전속 중개 계약에 따른 변동 수수료", amount: 25_500_000 },
              { label: "감정 평가 리포트 구매료", sub: "개별 감정인 계좌로 직송금", amount: 5_000_000 },
            ].map((it) => (
              <li key={it.label} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{it.label}</p>
                  <p className="text-xs text-text-muted">{it.sub}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{formatKRW(it.amount)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 card overflow-hidden">
        <div className="flex items-end justify-between p-6 pb-3">
          <h2 className="text-base font-semibold">거래 항목 상세 리스트 (Ledger)</h2>
          <p className="text-xs text-text-muted">총 {LEDGER.length}개 정산 항목</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-bg text-xs text-text-muted">
            <tr>
              <th className="px-6 py-2 text-left font-medium">ID</th>
              <th className="px-6 py-2 text-left font-medium">항목명</th>
              <th className="px-6 py-2 text-left font-medium">수취인 / 역할</th>
              <th className="px-6 py-2 text-right font-medium">정산 금액</th>
              <th className="px-6 py-2 text-right font-medium">정산 구분</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {LEDGER.map((l) => (
              <tr key={l.id}>
                <td className="px-6 py-3 text-xs text-text-muted">{l.id}</td>
                <td className="px-6 py-3">{l.label}</td>
                <td className="px-6 py-3 text-text-muted">{l.to}</td>
                <td className="px-6 py-3 text-right font-medium tabular-nums">{formatKRW(l.amount)}</td>
                <td className="px-6 py-3 text-right">
                  <Badge tone="default">{l.role}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="mt-4 rounded-md bg-bg px-4 py-3 text-xs text-text-muted">
        ※ 모든 정산 내역은 에스크로 시스템을 통해 안전하게 보호되며, 부동산 거래의 특성상 최종 잔금 지급일로부터 영업일 기준 3일 이내에 각 주체별 계좌로 송금이 완료됩니다.
      </p>
    </div>
  );
}

function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  const radius = 80;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <g transform="translate(110,110) rotate(-90)">
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const offset = -((cumulative / total) * circumference);
            cumulative += d.value;
            return (
              <circle
                key={i}
                r={radius}
                cx={0}
                cy={0}
                fill="transparent"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </g>
      </svg>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="text-text-muted">{d.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
