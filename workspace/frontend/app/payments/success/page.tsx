import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatKRW } from "@/lib/format";

export default function PaymentSuccessPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <div className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-text" />
        <h1 className="mt-4 text-2xl font-bold">결제가 완료되었습니다!</h1>
        <p className="mt-2 text-sm text-text-muted">
          전문가 분석 리포트와 부동산 상세 정보에 대한 접근 권한이 활성화되었습니다.
        </p>
        <p className="mt-3 text-xs text-text-muted">거래 ID: #BYL-98234-RT</p>

        <div className="mt-6 rounded-card bg-bg p-4 text-left">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">총 결제 금액</span>
            <span className="font-semibold tabular-nums">{formatKRW(450_000)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-muted">결제 수단</span>
            <span>BYLPay (Visa **** 4242)</span>
          </div>
          <p className="mt-3 text-[11px] text-text-muted">플랫폼 수수료(5%) 포함</p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/">
            <Button variant="secondary" className="w-full">
              매물 보기
            </Button>
          </Link>
          <Link href="/me">
            <Button className="w-full">마이페이지</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
