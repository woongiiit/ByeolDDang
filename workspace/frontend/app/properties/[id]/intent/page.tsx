"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitIntent } from "@/features/properties/api";
import { extractError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

export default function IntentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [offeredPrice, setOfferedPrice] = useState<number>(0);
  const [closeDate, setCloseDate] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitIntent(id, {
        offered_price: offeredPrice,
        desired_close_date: closeDate || undefined,
        message: message || undefined,
      });
      router.push("/me/intents");
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">매수 의향서 제출</h1>
      <p className="mt-1 text-sm text-text-muted">
        제출 즉시 등록 중개사에게 알림이 발송됩니다. 내용은 추후 다시 갱신할 수 있습니다.
      </p>

      <form className="mt-8 space-y-5" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">의향가 (원)</span>
          <Input
            type="number"
            required
            min={0}
            step={1_000_000}
            value={offeredPrice || ""}
            onChange={(e) => setOfferedPrice(Number(e.target.value))}
            placeholder="예: 12000000000"
          />
          <p className="mt-1 text-xs text-text-muted">정수, 원 단위. 큰 금액은 그대로 입력하세요.</p>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">희망 클로징 일자</span>
          <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">메시지 (선택)</span>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="잔금 일정, 협의 가능 조건 등을 자유롭게 작성해주세요."
            className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-accent-red">{error}</p>}

        <div className="flex justify-end gap-2">
          <Link href={`/properties/${id}`}>
            <Button type="button" variant="secondary">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !offeredPrice}>
            {loading ? "제출 중…" : "의향서 제출"}
          </Button>
        </div>
      </form>
    </div>
  );
}
