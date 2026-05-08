"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signup } from "@/features/auth/api";
import { fetchMyWallet } from "@/features/wallet/api";
import { extractError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

const ROLES = [
  { key: "buyer" as const, label: "매수자", desc: "검증된 매물과 리뷰 열람" },
  { key: "appraiser" as const, label: "감정평가사", desc: "전문 리뷰 발행으로 부수입" },
  { key: "broker" as const, label: "공인중개사", desc: "매물 등록·거래 중개" },
];

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupFallback() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center justify-center px-6 text-sm text-text-muted">
      불러오는 중…
    </div>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") ?? "buyer") as (typeof ROLES)[number]["key"];

  const setAuth = useAuthStore((s) => s.setAuth);
  const setWallet = useWalletStore((s) => s.setWallet);

  const [role, setRole] = useState<(typeof ROLES)[number]["key"]>(
    ROLES.some((r) => r.key === initialRole) ? initialRole : "buyer",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signup({ email, password, name, roles: [role] });
      setAuth({
        user: res.user,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      try {
        const w = await fetchMyWallet();
        setWallet(w);
      } catch {
        // ignore
      }
      router.push(role === "appraiser" || role === "broker" ? "/me" : "/wallet/charge");
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-6">
      <div className="card w-full p-8">
        <h1 className="mb-1 text-2xl font-bold">별땅 회원가입</h1>
        <p className="mb-6 text-sm text-text-muted">먼저 이용 역할을 선택해주세요.</p>

        <div className="mb-6 grid gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={cn(
                "rounded-card border p-3 text-left transition",
                role === r.key
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface hover:bg-bg",
              )}
            >
              <p className="text-sm font-semibold">{r.label}</p>
              <p className="mt-1 text-xs text-text-muted">{r.desc}</p>
            </button>
          ))}
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm">이름</span>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">이메일</span>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">비밀번호 (8자 이상)</span>
            <Input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? "가입 중…" : "가입하기"}
          </Button>
        </form>

        {role !== "buyer" && (
          <p className="mt-4 rounded-md bg-bg px-3 py-2 text-xs text-text-muted">
            ⓘ 가입 후 마이페이지에서 자격 인증 정보를 등록하면 관리자 승인 후 활동 가능합니다.
          </p>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className="font-medium text-text underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
