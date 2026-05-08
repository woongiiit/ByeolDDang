import { apiClient } from "@/lib/api";
import type {
  ChargeResponse,
  TokenPackage,
  TokenTransaction,
  Wallet,
} from "@/lib/types";

export async function fetchTokenPackages(): Promise<TokenPackage[]> {
  const { data } = await apiClient.get<TokenPackage[]>("/tokens/packages");
  return data;
}

export async function fetchMyWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<Wallet>("/me/wallet");
  return data;
}

export async function fetchMyTransactions(
  page = 1,
  size = 30,
): Promise<{ data: TokenTransaction[]; meta: { page: number; size: number; total: number } }> {
  const { data } = await apiClient.get("/me/wallet/transactions", { params: { page, size } });
  return data;
}

export async function chargeTokens(packageId: string): Promise<ChargeResponse> {
  const { data } = await apiClient.post<ChargeResponse>("/tokens/charge", {
    package_id: packageId,
  });
  return data;
}
