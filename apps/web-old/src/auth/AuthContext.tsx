import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, meApi, registerApi, type AuthUser } from "../api/auth.api";

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  // refreshMe: () => Promise<void>;
  refreshMe: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"));
  const [isLoading, setIsLoading] = useState(true);

  const persist = (nextUser: AuthUser | null, nextToken: string | null) => {
    if (nextToken) localStorage.setItem("accessToken", nextToken);
    else localStorage.removeItem("accessToken");

    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");

    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => persist(null, null);

const refreshMe = async (): Promise<AuthUser | null> => {
  const t = localStorage.getItem("accessToken");
  if (!t) {
    setIsLoading(false);
    return null;
  }

  try {
    const u = await meApi();
    console.log("ME RESPONSE:", u);
    persist(u, t);
    return u;
  } catch {
    logout();
    return null;
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginApi({ email, password });
    persist(data.user, data.accessToken);
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const data = await registerApi({ email, password, fullName });
    persist(data.user, data.accessToken);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, signup, logout, refreshMe }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}