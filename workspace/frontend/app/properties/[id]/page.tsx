"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bath, BedDouble, Calendar, Car, ChevronRight, MessageSquare, Ruler, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReviewCard } from "@/components/review/ReviewCard";
import { fetchPropertyDetail, fetchPropertyReviews, purchaseReview } from "@/features/properties/api";
import { fetchMyWallet } from "@/features/wallet/api";
import { extractError, USE_MOCK } from "@/lib/api";
import { CATEGORY_LABELS, formatArea, formatKRW, formatKRWShort } from "@/lib/format";
import type { PropertyDetail, ReviewItem } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet, setBalance } = useWalletStore();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [tab, setTab] = useState<"info" | "reviews" | "location">("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchPropertyDetail(id), fetchPropertyReviews(id)])
      .then(([p, r]) => {
        if (cancelled) return;
        setProperty(p);
        setReviews(r);
      })
      .catch((e) => !cancelled && setError(extractError(e).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const acquisitionTax = useMemo(
    () => (property ? Math.round(property.price * 0.035) : 0),
    [property],
  );
  const pricePerPyeong = useMemo(
    () => (property ? Math.round(property.price / property.area_pyeong) : 0),
    [property],
  );

  const handleUnlock = async (review: ReviewItem) => {
    if (!user) {
      alert("로그인 후 이용해주세요.");
      return;
    }
    if (USE_MOCK) {
      setReviews((curr) =>
        curr.map((r) =>
          r.id === review.id
            ? {
                ...r,
                is_unlocked: true,
                estimated_value: 12_480_000_000,
                outlook_reason: "Mock 데이터입니다. 실제 백엔드 연결 시 진짜 데이터가 나옵니다.",
                analysis_summary: "주변 GTX·정비사업 호재 + 한강 조망 프리미엄 반영.",
                evidence_urls: [],
                disclaimer_field_visit: true,
                confidence_level: "high",
                purchased_at: new Date().toISOString(),
              }
            : r,
        ),
      );
      return;
    }
    if ((wallet?.balance_tokens ?? 0) < review.price) {
      alert("코인 잔액이 부족합니다. 충전 페이지로 이동합니다.");
      window.location.href = "/wallet/charge";
      return;
    }
    const ok = window.confirm(
      `리뷰 1건을 ${review.price.toLocaleString("ko-KR")}코인으로 결제하시겠습니까?`,
    );
    if (!ok) return;
    try {
      setUnlocking(review.id);
      const result = await purchaseReview(review.id);
      setBalance(result.wallet_balance);
      // 잠금 해제된 리뷰 본문 다시 가져오기
      const refreshed = await fetchPropertyReviews(id);
      setReviews(refreshed);
      try {
        const w = await fetchMyWallet();
        setWallet(w);
      } catch {
        // ignore
      }
    } catch (e) {
      alert(extractError(e).message);
    } finally {
      setUnlocking(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-page px-6 py-10 text-text-muted">매물 정보를 불러오는 중…</div>
    );
  }
  if (error || !property) {
    return (
      <div className="mx-auto max-w-page px-6 py-10">
        <div className="card grid place-items-center p-12 text-center">
          <p className="font-semibold">매물을 찾을 수 없습니다.</p>
          <p className="mt-1 text-xs text-text-muted">{error}</p>
          <Link href="/" className="mt-4 text-sm underline">
            매물 리스트로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "info" as const, label: "상세 정보" },
    { key: "reviews" as const, label: `감정사 리뷰 (${reviews.length})` },
    { key: "location" as const, label: "위치 및 주변 시설" },
  ];

  return (
    <div className="mx-auto max-w-page px-6 py-8">
      <nav className="mb-6 flex items-center gap-1 text-xs text-text-muted">
        <Link href="/" className="hover:text-text">
          Marketplace
        </Link>
        <ChevronRight size={12} />
        <span>{CATEGORY_LABELS[property.category]}</span>
        <ChevronRight size={12} />
        <span className="text-text">{property.title}</span>
      </nav>

      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-2">
          {property.status === "active" && <Badge tone="success">판매 중</Badge>}
          {property.is_premium && <Badge tone="premium">프리미엄</Badge>}
        </div>
        <h1 className="text-3xl font-bold">
          {property.title}
          {property.title_en && <span className="ml-2 text-text-muted">({property.title_en})</span>}
        </h1>
        <p className="text-sm text-text-muted">
          📍 {property.address}
          {property.address_detail && ` (${property.address_detail})`}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section>
          <Gallery property={property} />

          <div className="mt-6 border-b border-border">
            <div className="flex gap-6">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`relative pb-3 text-sm transition ${
                    tab === t.key ? "font-semibold text-text" : "text-text-muted"
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {tab === "info" && <InfoTab property={property} />}
            {tab === "reviews" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="card p-8 text-center text-sm text-text-muted">
                    아직 등록된 감정사 리뷰가 없습니다.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className={unlocking === r.id ? "pointer-events-none opacity-60" : ""}>
                      <ReviewCard
                        review={r}
                        onUnlock={handleUnlock}
                        walletBalance={wallet?.balance_tokens ?? null}
                      />
                    </div>
                  ))
                )}
                <p className="rounded-md bg-bg px-3 py-2 text-[11px] text-text-muted">
                  ※ 모든 리뷰는 정식 감정평가서가 아닌 전문가 소견입니다. 실지조사 여부는 각 리뷰에 명시됩니다.
                </p>
              </div>
            )}
            {tab === "location" && (
              <div className="card grid h-72 place-items-center text-text-muted">
                지도 영역 (카카오 맵 연동 예정)
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-xs text-text-muted">매매 가격</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{formatKRWShort(property.price)}</p>
            <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">3.3m²당 가격</span>
                <span className="font-medium tabular-nums">{formatKRW(pricePerPyeong)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">취득세 예상액</span>
                <span className="font-medium text-accent-red tabular-nums">{formatKRW(acquisitionTax)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-lg border border-border p-3">
              {property.broker.avatar_url ? (
                <Image
                  src={property.broker.avatar_url}
                  alt={property.broker.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-10 w-10 place-items-center rounded-full bg-bg text-sm font-semibold">
                  {property.broker.name.slice(0, 1)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold">{property.broker.name} 수석 중개사</p>
                <p className="text-xs text-text-muted">{property.broker.office_name ?? ""}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-bg" aria-label="채팅">
                <MessageSquare size={16} />
              </button>
            </div>

            <Button className="mt-3 w-full" size="lg">
              중개인에게 연락하기
            </Button>
            <Link href={`/properties/${property.id}/intent`}>
              <Button variant="secondary" className="mt-2 w-full" size="lg">
                ＄ 매수 의향서 제출
              </Button>
            </Link>
            <p className="mt-3 text-[11px] text-text-muted">
              ※ 위 금액은 예상치이며, 실제 거래 시 취득세 및 수수료에 따라 변동될 수 있습니다.
            </p>
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={16} className="text-accent-blue" /> 에스크로 거래 보장
            </div>
            <p className="mt-2 text-xs text-text-muted">
              별땅의 모든 거래는 공식 에스크로 시스템을 통해 보호됩니다. 감정 리포트 미수령 시 100%
              환불됩니다.
            </p>
          </div>

          <div className="card p-4">
            <p className="mb-3 text-sm font-semibold">매물 체크리스트</p>
            <ul className="space-y-1.5 text-sm">
              {Object.entries({
                site_visit: "현장 답사 완료",
                registry_verified: "등기부등본 확인 완료",
                remodeling_package: "리모델링 패키지 연계 가능",
              }).map(([key, label]) => {
                const ok = property.checklist?.[key];
                return (
                  <li key={key} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${ok ? "bg-accent-green" : "bg-border"}`} />
                    <span className={ok ? "text-text" : "text-text-muted line-through"}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Gallery({ property }: { property: PropertyDetail }) {
  const [main, ...rest] = property.images;
  return (
    <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-bg">
        {main && (
          <Image src={main.url} alt={property.title} fill sizes="66vw" className="object-cover" />
        )}
      </div>
      <div className="grid grid-rows-2 gap-3">
        {[0, 1].map((i) => {
          const img = rest[i];
          return (
            <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-card bg-bg">
              {img ? (
                <Image src={img.url} alt="" fill sizes="33vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-text-muted">+</div>
              )}
              {i === 1 && property.images.length > 3 && (
                <div className="absolute inset-0 grid place-items-center bg-black/40 text-sm text-white">
                  +{property.images.length - 3}장 더보기
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoTab({ property }: { property: PropertyDetail }) {
  const items = [
    { icon: <Ruler size={16} />, label: "전용 면적", value: formatArea(property.area_m2) },
    {
      icon: <BedDouble size={16} />,
      label: "침실 / 욕실",
      value: `${property.rooms ?? "-"}개 / ${property.bathrooms ?? "-"}개`,
    },
    {
      icon: <Car size={16} />,
      label: "주차 대수",
      value: property.parking ? `${property.parking}대 (전용)` : "-",
    },
    {
      icon: <Calendar size={16} />,
      label: "준공 연도",
      value: property.build_year ? `${property.build_year}년` : "-",
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-base font-semibold">매물 주요 사양</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map((it) => (
            <div key={it.label} className="card p-3 text-center">
              <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-md bg-bg text-text-muted">
                {it.icon}
              </div>
              <p className="text-xs text-text-muted">{it.label}</p>
              <p className="mt-1 text-sm font-semibold">{it.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">설명</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-text">
          {property.description ?? "-"}
        </p>
      </div>
    </div>
  );
}
