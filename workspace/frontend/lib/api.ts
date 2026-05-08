import axios, { AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("byeol_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function extractError(e: unknown): ApiError {
  if (e instanceof AxiosError && e.response?.data) {
    const detail = (e.response.data as { detail?: ApiError | string }).detail;
    if (typeof detail === "object" && detail) return detail as ApiError;
    if (typeof detail === "string") return { code: "ERROR", message: detail };
  }
  return { code: "ERROR", message: e instanceof Error ? e.message : "Unknown error" };
}
