"use client";

import { useEffect } from "react";
import { fetchMe } from "@/features/auth/api";
import { fetchMyWallet } from "@/features/wallet/api";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";
import { USE_MOCK } from "@/lib/api";

export function useAuthBootstrap() {
  const { accessToken, setUser, clear } = useAuthStore();
  const { setWallet } = useWalletStore();

  useEffect(() => {
    if (USE_MOCK) return;
    if (!accessToken) {
      setWallet(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [me, wallet] = await Promise.all([fetchMe(), fetchMyWallet()]);
        if (!cancelled) {
          setUser(me);
          setWallet(wallet);
        }
      } catch {
        if (!cancelled) clear();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, setUser, clear, setWallet]);
}
