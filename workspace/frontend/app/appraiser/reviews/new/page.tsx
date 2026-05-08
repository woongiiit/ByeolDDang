"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchProperties } from "@/features/properties/api";
import { apiClient, extractError } from "@/lib/api";
import { formatTokens, tokensToKRW, formatKRW } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PropertyListItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

const OUTLOOK = [
  { key: "bullish" as const, label: "강세 (Bullish)" },
  { key: "neutral" as const, label: "중립 (Neutral)" },
  { key: "bearish" as const, label: "약세 (Bearish)" },
];

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPropertyId = searchParams.get("propertyId");
  const user = useAuthStore((s) => s.user);

  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [propertyId, setPropertyId] = useState<string | null>(initialPropertyId);
  const [estimatedValue, setEstimatedValue] = useState(12_500_000_000);
  const [outlook, setOutlook] = useState<(typeof OUTLOOK)[number]["key"]>("neutral");
  const [outlookReason, setOutlookReason] = useState("");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [priceTokens, setPriceTokens] = useState(450);
  const [fieldVisit, setFieldVisit] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties({}).then((res) => {
      setProperties(res.data);
      if (!propertyId && res.data.length > 0) setPropertyId(res.data[0].id);
    });
  }, [propertyId]);

  const platformFeeRate = 0.15;
  const expectedPayout = Math.round(priceTokens * (1 - platformFeeRate));

  if (!user) {
    return <RequireLogin />;
  }
  if (!user.roles.includes("appraiser")) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="card p-8 text-center">
          <p>감정평가사 권한이 필요합니다.</p>
          <Link href="/auth/signup?role=appraiser" className="mt-4 inline-block">
            <Button>감정사로 가입</Button>
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      setError("매물을 선택해주세요");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post("/reviews", {
        property_id: propertyId,
        estimated_value: estimatedValue,
        confidence_level: "high",
        market_outlook: outlook,
        outlook_reason: outlookReason,
        analysis_summary: analysisSummary,
        evidence_urls: [],
        price: priceTokens,
        disclaimer_field_visit: fieldVisit,
        publish: true,
      });
      router.push(`/properties/${propertyId}`);
      // 매물 상세에서 새 리뷰 확인 가능
      void data;
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">전문 감정서 작성</h1>
      <p className="mt-1 text-sm text-text-muted">
        매물의 가치를 정밀하게 분석하여 신뢰도 높은 리뷰를 발행하세요. 발행 후 수정은 불가합니다.
      </p>

      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <Section title="대상 매물">
          <select
            required
            value={propertyId ?? ""}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="" disabled>매물 선택…</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} - {p.address}
              </option>
            ))}
          </select>
        </Section>

        <Section title="가치 산정">
          <label className="block">
            <span className="mb-1 block text-xs text-text-muted">추정 감정가 (원)</span>
            <Input
              type="number"
              required
              min={1_000_000}
              value={estimatedValue}
              onChange={(e) => setEstimatedValue(Number(e.target.value))}
            />
          </label>
        </Section>

        <Section title="시장 전망">
          <div className="grid grid-cols-3 gap-2">
            {OUTLOOK.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setOutlook(o.key)}
                className={cn(
                  "rounded-card border p-3 text-sm transition",
                  outlook === o.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface hover:bg-bg",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-sm">전망 근거 (10자 이상)</span>
            <textarea
              required
              minLength={10}
              rows={3}
              value={outlookReason}
              onChange={(e) => setOutlookReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary focus:outline-none"
              placeholder="주변 개발 호재, 학군 수요, 인접 거래 사례 등을 종합한 근거를 작성하세요."
            />
          </label>
        </Section>

        <Section title="분석 요약">
          <textarea
            required
            minLength={10}
            rows={4}
            value={analysisSummary}
            onChange={(e) => setAnalysisSummary(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary focus:outline-none"
            placeholder="매물의 강점·약점·투자 포인트를 정리하세요."
          />
        </Section>

        <Section title="실지조사 여부">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fieldVisit}
              onChange={(e) => setFieldVisit(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            현장 답사 후 작성 (Disclaimer에 명시됩니다)
          </label>
        </Section>

        <Section title="판매 가격 설정">
          <label className="block">
            <span className="mb-1 block text-sm">리뷰 판매 가격 (코인)</span>
            <Input
              type="number"
              min={100}
              max={10000}
              step={10}
              value={priceTokens}
              onChange={(e) => setPriceTokens(Number(e.target.value))}
            />
          </label>
          <div className="rounded-md bg-accent-blue/10 p-3 text-xs text-accent-blue">
            <p>판매가: <strong>{formatTokens(priceTokens)}</strong> ({formatKRW(tokensToKRW(priceTokens))})</p>
            <p className="mt-1">
              플랫폼 수수료 15% 차감 후 판매 즉시 적립: <strong>{formatTokens(expectedPayout)}</strong>
            </p>
          </div>
        </Section>

        {error && <p className="text-sm text-accent-red">{error}</p>}

        <p className="rounded-md bg-bg px-3 py-2 text-xs text-accent-orange">
          ⚠️ 발행된 리뷰는 수정/삭제가 불가합니다. 허위 정보 입력 시 자격이 정지될 수 있습니다.
        </p>

        <div className="flex justify-end gap-2">
          <Link href="/appraiser">
            <Button type="button" variant="secondary">취소</Button>
          </Link>
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "발행 중…" : "감정서 발행하기"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function RequireLogin() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="card grid place-items-center p-12 text-center">
        <p>로그인이 필요합니다.</p>
        <Link href="/auth/login" className="mt-4"><Button>로그인</Button></Link>
      </div>
    </div>
  );
}
