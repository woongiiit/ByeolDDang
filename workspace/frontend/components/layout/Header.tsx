"use client";

import Link from "next/link";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import { useAuthStore } from "@/stores/auth";
import { TokenBalance } from "@/components/wallet/TokenBalance";

export function Header() {
  useAuthBootstrap();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const isAdmin = user?.roles.includes("admin");
  const isAppraiser = user?.roles.includes("appraiser");
  const isBroker = user?.roles.includes("broker");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-3 px-6">
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-text-muted hover:text-text">
            Marketplace
          </Link>
          {(isAppraiser || !user) && (
            <Link href="/appraiser" className="text-text-muted hover:text-text">
              Appraise
            </Link>
          )}
          {isBroker && (
            <Link href="/broker" className="text-text-muted hover:text-text">
              Broker
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-text-muted hover:text-text">
              Admin
            </Link>
          )}
        </nav>

        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-text hover:opacity-90"
        >
          별 땅
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <TokenBalance />
              <button
                className="grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-bg"
                aria-label="알림"
              >
                <Bell size={18} />
              </button>
              <Link
                href="/me"
                className="grid h-9 w-9 place-items-center rounded-full bg-bg text-xs font-semibold text-text"
                title={user.name}
              >
                {user.name.slice(0, 1)}
              </Link>
              <button
                onClick={clear}
                className="grid h-9 w-9 place-items-center rounded-full text-text-muted hover:bg-bg"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-text-muted hover:text-text">
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-pill bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                회원가입
              </Link>
              <Link
                href="/auth/login"
                className="grid h-9 w-9 place-items-center rounded-full bg-bg text-text-muted hover:opacity-90 md:hidden"
                aria-label="프로필"
              >
                <UserIcon size={18} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
