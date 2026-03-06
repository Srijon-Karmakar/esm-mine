import { http } from "../lib/http";

export type PrimaryRole = "PLAYER" | "MANAGER" | "ADMIN";

export type RegisterPayload = {
  email: string;
  password: string;
  phone?: string;
  primaryRole: PrimaryRole;

  // If your backend requires fullName, uncomment and add field in UI
  // fullName?: string;
};

export type RegisterResponse = {
  token?: string;       // if backend returns token
  accessToken?: string; // if backend returns accessToken
  user?: any;
};

export async function register(payload: RegisterPayload) {
  return http<RegisterResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
}
