"use client";

import Image from "next/image";
import { Lock, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OUTLOOK_LABELS, formatTokenWithKRW, formatTokens, formatKRWShort } from "@/lib/format";
import type { ReviewItem } from "@/lib/types";

export function ReviewCard({
  review,
  onUnlock,
  walletBalance,
}: {
  review: ReviewItem;
  onUnlock: (review: ReviewItem) => void;
  walletBalance: number | null;
}) {
  const outlook = OUTLOOK_LABELS[review.market_outlook];
  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        {review.appraiser.avatar_url ? (
          <Image
            src={review.appraiser.avatar_url}
            alt={review.appraiser.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-full bg-bg text-sm font-semibold">
            {review.appraiser.name.slice(0, 1)}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">{review.appraiser.name}</p>
          <p className="text-xs text-text-muted">
            {review.appraiser.specialty ?? ""}
            {review.appraiser.years_of_experience
              ? ` · 경력 ${review.appraiser.years_of_experience}년`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{review.rating_avg.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone="info">
          5년 전망 · <span className={outlook.tone}>{outlook.label}</span>
        </Badge>
        {review.disclaimer_field_visit !== false && <Badge tone="success">현장 답사 완료</Badge>}
      </div>

      {review.is_unlocked ? (
        <UnlockedReviewBody review={review} />
      ) : (
        <LockedReviewBody review={review} onUnlock={onUnlock} walletBalance={walletBalance} />
      )}
    </div>
  );
}

function LockedReviewBody({
  review,
  onUnlock,
  walletBalance,
}: {
  review: ReviewItem;
  onUnlock: (r: ReviewItem) => void;
  walletBalance: number | null;
}) {
  const insufficient = walletBalance !== null && walletBalance < review.price;
  return (
    <div className="rounded-lg border border-dashed border-border bg-bg p-4 text-center">
      <Lock size={18} className="mx-auto text-text-muted" />
      <p className="mt-2 text-sm text-text-muted">이 리뷰는 잠겨 있습니다.</p>
      <p className="mt-3 text-xs text-text-muted">예상 추정가: {review.estimated_value_masked}</p>
      <div className="mt-4 flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
        <span className="text-text-muted">열람 비용</span>
        <span className="text-right">
          <span className="font-semibold tabular-nums">{formatTokens(review.price)}</span>
          <span className="ml-1 text-[11px] text-text-muted">≈ {formatKRWShort(review.price * 100)}</span>
        </span>
      </div>
      <Button
        onClick={() => onUnlock(review)}
        className="mt-3 w-full"
        size="sm"
        disabled={insufficient}
        title={insufficient ? "잔액 부족 — 충전 후 다시 시도" : "리뷰 열람"}
      >
        {insufficient ? "잔액 부족 · 충전 필요" : "해제하기"}
      </Button>
      {insufficient && (
        <p className="mt-2 text-[11px] text-accent-orange">
          {formatTokens(review.price - (walletBalance ?? 0))} 부족
        </p>
      )}
    </div>
  );
}

function UnlockedReviewBody({ review }: { review: ReviewItem }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between rounded-md bg-bg px-3 py-2">
        <span className="text-text-muted">전문가 추정가</span>
        <span className="text-base font-semibold tabular-nums">
          {formatKRWShort(review.estimated_value ?? 0)}
        </span>
      </div>
      {review.analysis_summary && (
        <div>
          <p className="mb-1 text-xs font-semibold text-text-muted">분석 요약</p>
          <p className="text-text">{review.analysis_summary}</p>
        </div>
      )}
      {review.outlook_reason && (
        <div>
          <p className="mb-1 text-xs font-semibold text-text-muted">전망 근거</p>
          <p className="text-text">{review.outlook_reason}</p>
        </div>
      )}
      <p className="rounded-md bg-bg px-3 py-2 text-[11px] text-text-muted">
        ※ 본 의견은 정식 감정평가서가 아닌 전문가 소견입니다. 결제 시점 차감 비용:
        <span className="ml-1 font-medium text-text">{formatTokenWithKRW(review.price)}</span>
      </p>
    </div>
  );
}
