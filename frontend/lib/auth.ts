/**
 * Auth helpers — JWT is in httpOnly cookies; use these for client-side auth state / redirects.
 * Do not store tokens in localStorage.
 */

export function isAuthenticated(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("access") ?? false;
}

export function clearAuthState(): void {
  if (typeof document === "undefined") return;
  document.cookie = "access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
