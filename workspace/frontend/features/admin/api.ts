import { apiClient } from "@/lib/api";
import type { AppraiserApplication, BrokerApplication } from "@/lib/types";

export async function fetchAppraiserApplications(
  status: "pending" | "approved" | "rejected" | "revoked" | "" = "pending",
): Promise<AppraiserApplication[]> {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<AppraiserApplication[]>("/admin/appraisers", { params });
  return data;
}

export async function approveAppraiser(userId: string): Promise<void> {
  await apiClient.post(`/admin/appraisers/${userId}/approve`);
}

export async function rejectAppraiser(userId: string, reason: string): Promise<void> {
  await apiClient.post(`/admin/appraisers/${userId}/reject`, { reason });
}

export async function fetchBrokerApplications(
  status: "pending" | "approved" | "rejected" | "" = "pending",
): Promise<BrokerApplication[]> {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<BrokerApplication[]>("/admin/brokers", { params });
  return data;
}

export async function approveBroker(userId: string): Promise<void> {
  await apiClient.post(`/admin/brokers/${userId}/approve`);
}

export async function fetchPendingTransactions() {
  const { data } = await apiClient.get("/admin/transactions");
  return data;
}

export async function verifyTransaction(txId: string) {
  const { data } = await apiClient.post(`/admin/transactions/${txId}/verify`);
  return data;
}
