"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (input: { user: AuthUser; accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser | null) => void;
  clear: () => void;
  hasRole: (role: AuthUser["roles"][number]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: ({ user, accessToken, refreshToken }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("byeol_access_token", accessToken);
          localStorage.setItem("byeol_refresh_token", refreshToken);
        }
        set({ user, accessToken, refreshToken });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("byeol_access_token");
          localStorage.removeItem("byeol_refresh_token");
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
      hasRole: (role) => Boolean(get().user?.roles.includes(role)),
    }),
    {
      name: "byeol-auth",
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);
