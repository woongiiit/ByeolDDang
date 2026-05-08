"use client";

import { create } from "zustand";
import type { Wallet } from "@/lib/types";

interface WalletState {
  wallet: Wallet | null;
  setWallet: (w: Wallet | null) => void;
  setBalance: (balance: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
  setBalance: (balance) =>
    set((s) => (s.wallet ? { wallet: { ...s.wallet, balance_tokens: balance } } : {})),
}));
