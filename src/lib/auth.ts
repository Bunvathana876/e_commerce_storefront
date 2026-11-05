import type { ApiUser } from "./api";

export const AUTH_KEY = "storefront_isLoggedIn";
export const TOKEN_KEY = "storefront_accessToken";
export const USER_KEY = "storefront_currentUser";

const ALLOWED_CROSS_APP_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

export function isAllowlistedOrigin(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_CROSS_APP_ORIGINS.includes(parsed.origin);
  } catch {
    return false;
  }
}

/**
 * Tracks the current storefront session generation.
 * Incremented whenever authentication state changes (login, logout, account switch).
 * In-flight async responses compare their captured epoch against getSessionEpoch()
 * and discard their results if the epoch has advanced.
 */
let currentSessionEpoch = 0;

export function getSessionEpoch(): number {
  return currentSessionEpoch;
}

export function incrementSessionEpoch(): number {
  currentSessionEpoch += 1;
  return currentSessionEpoch;
}

/**
 * Registry of logout callbacks (e.g. stores, memory caches) to execute synchronously
 * when a user logs out.
 */
const logoutHandlers: Array<() => void> = [];

export function onLogout(handler: () => void): () => void {
  logoutHandlers.push(handler);
  return () => {
    const idx = logoutHandlers.indexOf(handler);
    if (idx !== -1) {
      logoutHandlers.splice(idx, 1);
    }
  };
}

/**
 * Checks whether a given JWT token string is structurally valid and not expired.
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    // Buffer by 10 seconds to avoid race condition near expiration
    return Date.now() >= decoded.exp * 1000 - 10000;
  } catch {
    return true;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || localStorage.getItem(AUTH_KEY) !== "true") return false;
  if (isTokenExpired(token)) {
    logout("token_expired");
    return false;
  }
  return true;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  if (isTokenExpired(token)) {
    logout("token_expired");
    return null;
  }
  return token;
}

export function getCurrentUser(): ApiUser | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getCurrentUserId(): number | null {
  const user = getCurrentUser();
  return user?.id ?? null;
}

/**
 * Removes customer user credentials and private feature caches from localStorage,
 * preserving public/neutral preferences (theme, public catalog settings), and NEVER
 * touching management portal sessions (mgmt_*) or cashier data (pos_parked_carts).
 */
export function clearPrivateSessionData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Private customer notification caches
  localStorage.removeItem("notif_read");
  localStorage.removeItem("notif_cleared_at");
  localStorage.removeItem("notif_deleted_ids");

  // Zustand persistent shop storage
  localStorage.removeItem("blue-panda-shop-storage");

  // Clean legacy un-namespaced keys safely without touching management keys
  localStorage.removeItem("accessToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isLoggedIn");
}

export function saveAuthSession(token: string, user: ApiUser): void {
  if (typeof window === "undefined") return;
  const previousUser = getCurrentUser();
  // If switching between different authenticated accounts, ensure prior session is torn down first
  if (previousUser && previousUser.id !== user.id) {
    clearPrivateSessionData();
  }
  incrementSessionEpoch();

  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  window.dispatchEvent(
    new CustomEvent("auth-changed", { detail: { action: "login", user } })
  );
}

export function logout(reason?: string): void {
  if (typeof window === "undefined") return;
  // 1. Advance session generation to invalidate any in-flight requests from this session
  incrementSessionEpoch();

  // 2. Clear private session keys and caches
  clearPrivateSessionData();

  // 3. Execute registered store/cache cleanup handlers synchronously
  for (const handler of logoutHandlers) {
    try {
      handler();
    } catch (err) {
      console.error("Error in logout handler:", err);
    }
  }

  // 4. Dispatch auth-changed event to inform UI components
  window.dispatchEvent(
    new CustomEvent("auth-changed", { detail: { action: "logout", reason } })
  );
}

/**
 * Safely resolves post-auth destination in the Customer Storefront based on user role
 * and optional redirect parameter.
 * Prevents open redirect attacks (//, /\, protocol schemes) and cross-role privilege escalation
 * (e.g. attempting to navigate into /admin or /seller on the customer storefront).
 */
export function getSafeRoleDestination(
  role: string | undefined | null,
  redirectParam?: string | null
): string {
  // In customer storefront, standard home is always /
  const roleHome = "/";

  if (!redirectParam) {
    return roleHome;
  }

  const trimmed = redirectParam.trim();

  // Reject open redirects & protocol exploits
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\\\") ||
    trimmed.toLowerCase().startsWith("javascript:") ||
    trimmed.toLowerCase().startsWith("data:") ||
    trimmed.toLowerCase().startsWith("vbscript:")
  ) {
    return roleHome;
  }

  // Handle absolute URLs (e.g. cross-origin redirects)
  if (trimmed.includes("://")) {
    try {
      const parsed = new URL(trimmed);
      if (ALLOWED_CROSS_APP_ORIGINS.includes(parsed.origin)) {
        if (
          parsed.pathname.startsWith("/admin") ||
          parsed.pathname.startsWith("/seller")
        ) {
          // If staff logs in with management redirect, allow it only if origin is allowlisted
          return trimmed;
        }
        return parsed.pathname;
      }
    } catch {
      return roleHome;
    }
    return roleHome;
  }

  // Storefront internal routes must not route to non-existent admin or seller pages
  if (trimmed.startsWith("/admin") || trimmed.startsWith("/seller")) {
    return roleHome;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return roleHome;
}
