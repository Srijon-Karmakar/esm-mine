import { http } from "./http";

export type AuthMembership = {
  id: string;
  primary: "PLAYER" | "ADMIN" | "MANAGER";
  subRoles: Array<
    "AGENT" | "PHYSIO" | "COACH" | "NUTRITIONIST" | "PITCH_MANAGER"
  >;
  club: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  memberships?: AuthMembership[];
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string; // min 6
  fullName?: string;
};

export async function loginApi(payload: LoginPayload) {
  const { data } = await http.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerApi(payload: RegisterPayload) {
  const { data } = await http.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function meApi() {
  const { data } = await http.get<{ user: AuthUser }>("/me");
  return data.user;
}