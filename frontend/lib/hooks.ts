import { useState, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "student" | "instructor" | "admin";
}

const USER_KEY = "qcai_user";
const ACCESS_KEY = "qcai_access";
const REFRESH_KEY = "qcai_refresh";

// ── User helpers ──────────────────────────────────────────────────────────────

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const str = localStorage.getItem(USER_KEY);
    return str ? (JSON.parse(str) as User) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export function storeTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

// ── React hook ────────────────────────────────────────────────────────────────

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  return { user, loading, setUser };
}
