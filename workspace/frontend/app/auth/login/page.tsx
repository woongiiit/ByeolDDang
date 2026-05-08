"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login } from "@/features/auth/api";
import { fetchMyWallet } from "@/features/wallet/api";
import { extractError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setWallet = useWalletStore((s) => s.setWallet);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      setAuth({
        user: res.user,
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
      });
      try {
        const w = await fetchMyWallet();
        setWallet(w);
      } catch {
        // 월렛은 lazy 생성될 수 있음
      }
      router.push("/me");
    } catch (e) {
      setError(extractError(e).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6">
      <div className="card w-full p-8">
        <h1 className="mb-1 text-2xl font-bold">별땅 로그인</h1>
        <p className="mb-6 text-sm text-text-muted">검증된 매물과 전문가 리뷰에 접속하세요.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm">이메일</span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">비밀번호</span>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="text-sm text-accent-red">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "로그인 중…" : "로그인"}
          </Button>
        </form>

        <div className="mt-6 rounded-md bg-bg px-3 py-3 text-xs text-text-muted">
          <p className="font-semibold text-text">데모 계정</p>
          <ul className="mt-1.5 space-y-0.5 tabular-nums">
            <li>buyer@byeolddang.com / buyer1234! (매수자, 1,500코인 보유)</li>
            <li>kim.appraiser@byeolddang.com / appraiser1234! (감정사)</li>
            <li>park.broker@byeolddang.com / broker1234! (중개사)</li>
            <li>admin@byeolddang.com / admin1234! (관리자)</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-sm text-text-muted">
          아직 계정이 없으신가요?{" "}
          <Link href="/auth/signup" className="font-medium text-text underline-offset-4 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
