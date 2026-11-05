import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

// Polyfill window & localStorage for Node test runner environment
class MockLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockLocalStorage();
const eventListeners: Record<string, ((...args: any[]) => void)[]> = {};

if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    addEventListener: (type: string, fn: (...args: any[]) => void) => {
      (eventListeners[type] ||= []).push(fn);
    },
    removeEventListener: (type: string, fn: (...args: any[]) => void) => {
      eventListeners[type] = (eventListeners[type] || []).filter((f) => f !== fn);
    },
    dispatchEvent: (event: any) => {
      const type = event.type || "custom";
      for (const fn of eventListeners[type] || []) {
        fn(event);
      }
      return true;
    },
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    location: { pathname: "/" },
  } as any;
} else {
  if (typeof (globalThis.window as any).setTimeout !== "function") {
    (globalThis.window as any).setTimeout = globalThis.setTimeout.bind(globalThis);
  }
}

if (typeof globalThis.localStorage === "undefined") {
  globalThis.localStorage = mockStorage as any;
} else {
  globalThis.localStorage.clear();
}

if (typeof globalThis.CustomEvent === "undefined") {
  globalThis.CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, init?: any) {
      this.type = type;
      this.detail = init?.detail;
    }
  } as any;
}

import {
  AUTH_KEY,
  TOKEN_KEY,
  USER_KEY,
  getAccessToken,
  getCurrentUser,
  getCurrentUserId,
  getSessionEpoch,
  isLoggedIn,
  isTokenExpired,
  logout,
  saveAuthSession,
} from "../auth";
import {
  migrateShopStorageState,
  useShopStore,
} from "../store";
import type { ApiProduct, ApiUser } from "../api";

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.mockSignature`;
}

const mockUserA: ApiUser = {
  id: 1,
  name: "User Alpha",
  email: "alpha@example.com",
  role: "customer",
  is_active: true,
  created_at: "2026-10-31T00:00:00Z",
};

const mockUserB: ApiUser = {
  id: 2,
  name: "User Beta",
  email: "beta@example.com",
  role: "customer",
  is_active: true,
  created_at: "2026-10-31T00:00:00Z",
};

const sampleProductA: ApiProduct = {
  id: 101,
  category_id: 1,
  name: "User A Private Product",
  price: "99.00",
  stock: 10,
  is_active: true,
  rating: "5.00",
  created_at: "2026-10-31T00:00:00Z",
  updated_at: "2026-10-31T00:00:00Z",
};

const sampleProductB: ApiProduct = {
  id: 102,
  category_id: 1,
  name: "User B Private Product",
  price: "49.00",
  stock: 5,
  is_active: true,
  rating: "4.50",
  created_at: "2026-10-31T00:00:00Z",
  updated_at: "2026-10-31T00:00:00Z",
};

describe("Next.js Session Isolation & Logout Cache Security (S14)", () => {
  beforeEach(() => {
    logout();
    globalThis.localStorage.clear();
    useShopStore.getState().resetUserSession();
  });

  it("1. Logout clears private user state from memory", () => {
    // Setup User A session
    const validToken = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(validToken, mockUserA);

    // Populate private store state
    useShopStore.setState({
      items: [{ key: "101:default", product: sampleProductA, quantity: 2 }],
      appliedCoupon: { code: "SECRET50", discountAmount: 50, message: "Applied" },
      wishlist: [sampleProductA],
      sessionOwnerId: 1,
      isCartOpen: true,
    });

    assert.equal(useShopStore.getState().items.length, 1);
    assert.equal(useShopStore.getState().wishlist.length, 1);
    assert.notEqual(useShopStore.getState().appliedCoupon, null);
    assert.equal(useShopStore.getState().sessionOwnerId, 1);

    // Act: logout
    logout("user_requested");

    // Assert: store private state is wiped
    const state = useShopStore.getState();
    assert.deepEqual(state.items, [], "Cart items must be cleared on logout");
    assert.deepEqual(state.wishlist, [], "Wishlist must be cleared on logout");
    assert.equal(state.appliedCoupon, null, "Applied coupon must be cleared on logout");
    assert.equal(state.sessionOwnerId, null, "Session owner must be reset to null");
    assert.equal(state.isCartOpen, false, "Cart drawer must be closed");
  });

  it("2. Logout clears or invalidates private persistent caches", () => {
    const validToken = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(validToken, mockUserA);

    // Simulate persistent private caches
    globalThis.localStorage.setItem("notif_read", JSON.stringify(["notif-1", "notif-2"]));
    globalThis.localStorage.setItem("notif_cleared_at", "1790482000");
    globalThis.localStorage.setItem("notif_deleted_ids", JSON.stringify(["notif-99"]));
    globalThis.localStorage.setItem("blue-panda-shop-storage", JSON.stringify({ items: [{ id: 101 }] }));
    globalThis.localStorage.setItem("pos_parked_carts", JSON.stringify([{ id: "cart-1" }]));

    // Non-sensitive preference (theme/language)
    globalThis.localStorage.setItem("theme_preference", "dark");

    // Act: logout
    logout();

    // Assert: credentials and private caches are purged
    assert.equal(globalThis.localStorage.getItem(AUTH_KEY), null);
    assert.equal(globalThis.localStorage.getItem(TOKEN_KEY), null);
    assert.equal(globalThis.localStorage.getItem(USER_KEY), null);
    assert.equal(globalThis.localStorage.getItem("notif_read"), null);
    assert.equal(globalThis.localStorage.getItem("notif_cleared_at"), null);
    assert.equal(globalThis.localStorage.getItem("notif_deleted_ids"), null);
    assert.equal(globalThis.localStorage.getItem("blue-panda-shop-storage"), null);

    // Management / merchant caches must NOT be wiped by storefront logout
    assert.notEqual(globalThis.localStorage.getItem("pos_parked_carts"), null);

    // Public / neutral preferences must be preserved
    assert.equal(globalThis.localStorage.getItem("theme_preference"), "dark");
  });

  it("3. User A -> logout -> User B does not leak data", () => {
    // User A logs in and has items in cart
    const tokenA = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(tokenA, mockUserA);
    useShopStore.setState({
      items: [{ key: "101:default", product: sampleProductA, quantity: 3 }],
      wishlist: [sampleProductA],
      sessionOwnerId: 1,
    });

    // User A logs out
    logout();

    // User B logs in
    const tokenB = makeJwt({ sub: "2", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(tokenB, mockUserB);

    // Assert: User B sees clean state, NOT User A's data
    const state = useShopStore.getState();
    assert.deepEqual(state.items, [], "User B must not see User A's cart items");
    assert.deepEqual(state.wishlist, [], "User B must not see User A's wishlist");
    assert.equal(getCurrentUserId(), 2, "Current user must be User B");
    assert.notEqual(getCurrentUser()?.email, "alpha@example.com");
  });

  it("4. Session rehydration / storage migration discards another user's private data", () => {
    // Active user is User B (ID 2)
    const activeUserId = 2;

    // Simulate stale persisted state left behind from User A (owner ID: 1)
    const stalePersistedState = {
      items: [{ key: "101:default", product: sampleProductA, quantity: 1 }],
      wishlist: [sampleProductA],
      recentlyViewed: [sampleProductA],
      sessionOwnerId: 1, // Owned by User A!
    };

    // Test migration logic
    const migratedState = migrateShopStorageState(stalePersistedState, activeUserId);

    // Assert: Private cart & wishlist owned by User A are dropped!
    assert.deepEqual(migratedState.items, [], "Stale items from User A must be dropped");
    assert.deepEqual(migratedState.wishlist, [], "Stale wishlist from User A must be dropped");
    // Public recently viewed catalog item is preserved
    assert.equal(migratedState.recentlyViewed.length, 1);
    assert.equal(migratedState.sessionOwnerId, 2, "Rehydrated owner must match active user");
  });

  it("5. Delayed User A network responses cannot update User B state", async () => {
    // Start session as User A
    const tokenA = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(tokenA, mockUserA);
    const initialEpoch = getSessionEpoch();

    // Simulate an async operation dispatched by User A
    const capturedEpoch = getSessionEpoch();
    const capturedUserId = getCurrentUserId();

    // While request is in-flight, User A logs out and User B logs in
    logout();
    const tokenB = makeJwt({ sub: "2", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(tokenB, mockUserB);

    // Assert session epoch has advanced
    assert.notEqual(getSessionEpoch(), initialEpoch, "Session epoch must advance on session changes");

    // The slow User A response arrives now:
    let responseApplied = false;
    if (capturedEpoch === getSessionEpoch() && capturedUserId === getCurrentUserId()) {
      useShopStore.setState({
        items: [{ key: "101:default", product: sampleProductA, quantity: 1 }],
      });
      responseApplied = true;
    }

    assert.equal(responseApplied, false, "Slow User A response must be dropped");
    assert.deepEqual(useShopStore.getState().items, [], "User B cart must remain empty");
  });

  it("6. Guest shopping remains functional", async () => {
    // Guest browsing (not logged in)
    assert.equal(isLoggedIn(), false);
    assert.equal(getCurrentUser(), null);

    // Guest adds item
    await useShopStore.getState().addToCart(sampleProductA, 2, "default", false);

    const state = useShopStore.getState();
    assert.equal(state.items.length, 1);
    assert.equal(state.items[0].product.name, sampleProductA.name);
    assert.equal(state.items[0].quantity, 2);

    // Guest updates quantity
    await useShopStore.getState().updateQuantity("101:default", 3);
    assert.equal(useShopStore.getState().items[0].quantity, 3);

    // Guest removes item
    await useShopStore.getState().removeFromCart("101:default");
    assert.equal(useShopStore.getState().items.length, 0);
  });

  it("7. Public catalog preferences and recentlyViewed survive logout", () => {
    // User logs in and browses public catalog
    const token = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) + 3600 });
    saveAuthSession(token, mockUserA);

    useShopStore.getState().recordRecentlyViewed(sampleProductA);
    useShopStore.getState().recordRecentlyViewed(sampleProductB);
    assert.equal(useShopStore.getState().recentlyViewed.length, 2);

    // Private item in cart
    useShopStore.setState({
      items: [{ key: "101:default", product: sampleProductA, quantity: 1 }],
      sessionOwnerId: 1,
    });

    // Act: logout
    logout();

    // Assert: Private cart is cleared, but public recentlyViewed is preserved
    assert.deepEqual(useShopStore.getState().items, []);
    assert.equal(useShopStore.getState().recentlyViewed.length, 2);
    assert.equal(useShopStore.getState().recentlyViewed[0].id, sampleProductB.id);
  });

  it("8. Session expiration invalidates private state", () => {
    // Set an already-expired token in localStorage
    const expiredToken = makeJwt({ sub: "1", exp: Math.floor(Date.now() / 1000) - 100 });
    globalThis.localStorage.setItem(AUTH_KEY, "true");
    globalThis.localStorage.setItem(TOKEN_KEY, expiredToken);
    globalThis.localStorage.setItem(USER_KEY, JSON.stringify(mockUserA));

    // Seed private cart in memory
    useShopStore.setState({
      items: [{ key: "101:default", product: sampleProductA, quantity: 1 }],
      wishlist: [sampleProductA],
      sessionOwnerId: 1,
    });

    // Check expiration helper
    assert.equal(isTokenExpired(expiredToken), true);

    // Act: calling isLoggedIn() or getAccessToken() on expired session triggers automatic logout
    const loggedIn = isLoggedIn();
    assert.equal(loggedIn, false, "Expired session must report isLoggedIn=false");

    // Assert: credentials and private store state were wiped
    assert.equal(globalThis.localStorage.getItem(TOKEN_KEY), null);
    assert.equal(globalThis.localStorage.getItem(AUTH_KEY), null);
    assert.equal(getAccessToken(), null);
    assert.deepEqual(useShopStore.getState().items, [], "Private cart must be wiped upon expiration");
    assert.deepEqual(useShopStore.getState().wishlist, [], "Private wishlist must be wiped upon expiration");
  });
});
