import { apiClient } from "@/lib/api";
import type { AuthResponse, AuthUser } from "@/lib/types";

export async function signup(input: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  roles?: AuthUser["roles"];
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", {
    ...input,
    roles: input.roles ?? ["buyer"],
  });
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/me");
  return data;
}
