"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  cartApi,
  couponsApi,
  favoritesApi,
  type ApiOrder,
  type ApiProduct,
} from "./api";
import {
  getCurrentUserId,
  getSessionEpoch,
  isLoggedIn,
  onLogout,
} from "./auth";
import { validateCouponServerOnly } from "./checkout-security";
import { getEffectivePrice } from "./store-catalog";

export const FREE_SHIPPING_THRESHOLD = 100;
export const STANDARD_SHIPPING_FEE = 2;

export interface StoreCartItem {
  key: string; // `${product.id}:${variant || "default"}`
  backendItemId?: number;
  product: ApiProduct;
  quantity: number;
  variant?: string;
}

export interface AppliedCouponState {
  code: string;
  discountAmount: number;
  message: string;
}

export interface StoreToast {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "info" | "error";
}

interface ShopStoreState {
  // Session ownership
  sessionOwnerId: number | null;

  // Cart
  items: StoreCartItem[];
  appliedCoupon: AppliedCouponState | null;
  isCartOpen: boolean;

  // Wishlist
  wishlist: ApiProduct[];

  // Recently Viewed (public / non-sensitive)
  recentlyViewed: ApiProduct[];

  // Local Guest / Offline Orders History (never confirmed orders)
  localOrders: ApiOrder[];

  // Dialogs & Toasts
  quickViewProduct: ApiProduct | null;
  isSearchOpen: boolean;
  toasts: StoreToast[];

  // Actions
  openCart: () => void;
  closeCart: () => void;
  openQuickView: (product: ApiProduct) => void;
  closeQuickView: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  pushToast: (toast: Omit<StoreToast, "id">) => void;
  dismissToast: (id: string) => void;
  resetUserSession: () => void;

  // Cart Operations
  addToCart: (
    product: ApiProduct,
    quantity?: number,
    variant?: string,
    openDrawer?: boolean
  ) => Promise<void>;
  updateQuantity: (key: string, quantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncCartFromBackend: () => Promise<void>;

  // Coupon Operations
  applyCouponCode: (code: string) => Promise<void>;
  removeCoupon: () => void;

  // Wishlist Operations
  toggleWishlist: (product: ApiProduct) => Promise<void>;
  syncWishlistFromBackend: () => Promise<void>;

  // Tracking & Local Orders
  recordRecentlyViewed: (product: ApiProduct) => void;
  addLocalOrder: (order: ApiOrder) => void;
}

function computeSubtotal(items: StoreCartItem[]): number {
  return items.reduce(
    (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
    0
  );
}

export function migrateShopStorageState(
  persistedState: unknown,
  currentUserId: number | null
) {
  const prev = (persistedState as Record<string, unknown>) || {};
  const storedOwnerId = (prev.sessionOwnerId as number | null) ?? null;

  // If the persisted state was owned by another user ID, do NOT restore their private items!
  if (storedOwnerId !== currentUserId) {
    return {
      items: [] as StoreCartItem[],
      appliedCoupon: null as AppliedCouponState | null,
      wishlist: [] as ApiProduct[],
      localOrders: [] as ApiOrder[],
      recentlyViewed: Array.isArray(prev.recentlyViewed)
        ? (prev.recentlyViewed as ApiProduct[])
        : [],
      sessionOwnerId: currentUserId,
    };
  }

  return {
    items: Array.isArray(prev.items)
      ? (prev.items as StoreCartItem[])
      : [],
    appliedCoupon: null as AppliedCouponState | null,
    wishlist: Array.isArray(prev.wishlist)
      ? (prev.wishlist as ApiProduct[])
      : [],
    localOrders: [] as ApiOrder[],
    recentlyViewed: Array.isArray(prev.recentlyViewed)
      ? (prev.recentlyViewed as ApiProduct[])
      : [],
    sessionOwnerId: storedOwnerId,
  };
}

export const useShopStore = create<ShopStoreState>()(
  persist(
    (set, get) => ({
      sessionOwnerId: typeof window !== "undefined" ? getCurrentUserId() : null,
      items: [],
      appliedCoupon: null,
      isCartOpen: false,
      wishlist: [],
      recentlyViewed: [],
      localOrders: [],
      quickViewProduct: null,
      isSearchOpen: false,
      toasts: [],

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      openQuickView: (product) => set({ quickViewProduct: product }),
      closeQuickView: () => set({ quickViewProduct: null }),
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),

      resetUserSession: () => {
        set({
          sessionOwnerId: null,
          items: [],
          appliedCoupon: null,
          wishlist: [],
          localOrders: [],
          isCartOpen: false,
          quickViewProduct: null,
        });
      },

      pushToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          toasts: [...state.toasts.slice(-3), { ...toast, id }],
        }));
        if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
          window.setTimeout(() => {
            get().dismissToast(id);
          }, 3600);
        }
      },

      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      addToCart: async (product, quantity = 1, variant, openDrawer = true) => {
        const key = `${product.id}:${variant || "default"}`;
        const maxStock = Math.max(1, product.stock || 99);

        set((state) => {
          const existing = state.items.find((i) => i.key === key);
          let nextItems: StoreCartItem[];
          if (existing) {
            nextItems = state.items.map((i) =>
              i.key === key
                ? { ...i, quantity: Math.min(maxStock, i.quantity + quantity) }
                : i
            );
          } else {
            nextItems = [
              ...state.items,
              {
                key,
                product,
                quantity: Math.min(maxStock, quantity),
                variant,
              },
            ];
          }
          return {
            items: nextItems,
            isCartOpen: openDrawer ? true : state.isCartOpen,
          };
        });

        get().pushToast({
          title: "Added to Shopping Bag",
          description: `${product.name}${variant ? ` (${variant})` : ""} × ${quantity}`,
          tone: "success",
        });

        // Re-evaluate coupon if active
        const activeCoupon = get().appliedCoupon;
        if (activeCoupon) {
          try {
            await get().applyCouponCode(activeCoupon.code);
          } catch {
            set({ appliedCoupon: null });
          }
        }

        // Sync to backend when logged in
        if (isLoggedIn()) {
          const requestEpoch = getSessionEpoch();
          const requestUserId = getCurrentUserId();
          try {
            const res = await cartApi.addItem({
              product_id: product.id,
              quantity,
            });
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
            const serverItem = res.data?.items?.find(
              (si) => si.product_id === product.id
            );
            if (serverItem) {
              set((state) => ({
                sessionOwnerId: requestUserId,
                items: state.items.map((i) =>
                  i.product.id === product.id
                    ? { ...i, backendItemId: serverItem.id }
                    : i
                ),
              }));
            }
          } catch {
            // Keep optimistic local cart item if backend is unreachable
          }
        }
      },

      updateQuantity: async (key, quantity) => {
        if (quantity <= 0) {
          await get().removeFromCart(key);
          return;
        }
        const target = get().items.find((i) => i.key === key);
        if (!target) return;

        const clamped = Math.min(Math.max(1, target.product.stock || 99), quantity);
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: clamped } : i
          ),
        }));

        const activeCoupon = get().appliedCoupon;
        if (activeCoupon) {
          try {
            await get().applyCouponCode(activeCoupon.code);
          } catch {
            set({ appliedCoupon: null });
          }
        }

        if (isLoggedIn() && target.backendItemId) {
          const requestEpoch = getSessionEpoch();
          const requestUserId = getCurrentUserId();
          try {
            await cartApi.updateItem(target.backendItemId, clamped);
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
          } catch {
            // Keep local optimistic update
          }
        }
      },

      removeFromCart: async (key) => {
        const target = get().items.find((i) => i.key === key);
        set((state) => {
          const next = state.items.filter((i) => i.key !== key);
          return {
            items: next,
            appliedCoupon: next.length === 0 ? null : state.appliedCoupon,
          };
        });

        const activeCoupon = get().appliedCoupon;
        if (activeCoupon && get().items.length > 0) {
          try {
            await get().applyCouponCode(activeCoupon.code);
          } catch {
            set({ appliedCoupon: null });
          }
        }

        if (isLoggedIn() && target?.backendItemId) {
          const requestEpoch = getSessionEpoch();
          const requestUserId = getCurrentUserId();
          try {
            await cartApi.removeItem(target.backendItemId);
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
          } catch {
            // Ignore offline error
          }
        }
      },

      clearCart: async () => {
        set({ items: [], appliedCoupon: null });
        if (isLoggedIn()) {
          const requestEpoch = getSessionEpoch();
          const requestUserId = getCurrentUserId();
          try {
            await cartApi.clear();
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
          } catch {
            // Ignore offline error
          }
        }
      },

      syncCartFromBackend: async () => {
        if (!isLoggedIn()) return;
        const requestEpoch = getSessionEpoch();
        const requestUserId = getCurrentUserId();

        try {
          const res = await cartApi.get();
          if (
            requestEpoch !== getSessionEpoch() ||
            requestUserId !== getCurrentUserId()
          ) {
            return;
          }

          const serverItems = res.data?.items || [];
          const localItems = get().items;
          const localOwnerId = get().sessionOwnerId;

          // Safe guest cart promotion:
          // ONLY push local items if they were created anonymously in this session (localOwnerId === null)
          // and NOT left over from any previous authenticated user!
          if (
            serverItems.length === 0 &&
            localItems.length > 0 &&
            localOwnerId === null
          ) {
            for (const item of localItems) {
              try {
                await cartApi.addItem({
                  product_id: item.product.id,
                  quantity: item.quantity,
                });
              } catch {
                // Ignore individual sync error
              }
            }
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
            const refreshed = await cartApi.get();
            if (refreshed.data?.items?.length) {
              set({
                sessionOwnerId: requestUserId,
                items: refreshed.data.items.map((si) => ({
                  key: `${si.product_id}:default`,
                  backendItemId: si.id,
                  product: si.product,
                  quantity: si.quantity,
                })),
              });
            }
            return;
          }

          // Always overwrite local items with server items for this authenticated user
          set({
            sessionOwnerId: requestUserId,
            items: serverItems.map((si) => ({
              key: `${si.product_id}:default`,
              backendItemId: si.id,
              product: si.product,
              quantity: si.quantity,
            })),
          });
        } catch {
          // Offline or token invalid
        }
      },

      applyCouponCode: async (code) => {
        const requestEpoch = getSessionEpoch();
        const requestUserId = getCurrentUserId();
        const subtotal = computeSubtotal(get().items);
        try {
          const verified = await validateCouponServerOnly({
            code,
            subtotal,
            validateApi: couponsApi.validate,
          });
          if (
            requestEpoch !== getSessionEpoch() ||
            requestUserId !== getCurrentUserId()
          ) {
            return;
          }
          set({
            appliedCoupon: {
              code: verified.code,
              discountAmount: verified.discountAmount,
              message: verified.message,
            },
          });
        } catch (err) {
          if (
            requestEpoch === getSessionEpoch() &&
            requestUserId === getCurrentUserId()
          ) {
            set({ appliedCoupon: null });
          }
          throw err;
        }
      },

      removeCoupon: () => set({ appliedCoupon: null }),

      toggleWishlist: async (product) => {
        const exists = get().wishlist.some((p) => p.id === product.id);
        set((state) => ({
          wishlist: exists
            ? state.wishlist.filter((p) => p.id !== product.id)
            : [product, ...state.wishlist],
        }));

        get().pushToast({
          title: exists ? "Removed from Wishlist" : "Saved to Wishlist",
          description: product.name,
          tone: "info",
        });

        if (isLoggedIn()) {
          const requestEpoch = getSessionEpoch();
          const requestUserId = getCurrentUserId();
          try {
            await favoritesApi.toggle(product.id);
            if (
              requestEpoch !== getSessionEpoch() ||
              requestUserId !== getCurrentUserId()
            ) {
              return;
            }
          } catch {
            // Keep local state
          }
        }
      },

      syncWishlistFromBackend: async () => {
        if (!isLoggedIn()) return;
        const requestEpoch = getSessionEpoch();
        const requestUserId = getCurrentUserId();

        try {
          const res = await favoritesApi.list();
          if (
            requestEpoch !== getSessionEpoch() ||
            requestUserId !== getCurrentUserId()
          ) {
            return;
          }
          if (res.data) {
            set({
              sessionOwnerId: requestUserId,
              wishlist: res.data.map((f) => f.product),
            });
          }
        } catch {
          // Ignore offline error
        }
      },

      recordRecentlyViewed: (product) =>
        set((state) => ({
          recentlyViewed: [
            product,
            ...state.recentlyViewed.filter((p) => p.id !== product.id),
          ].slice(0, 8),
        })),

      // Retained only as an unconfirmed local draft bucket; never treated as
      // confirmed purchases or persisted into order history.
      addLocalOrder: () => {},
    }),
    {
      name: "blue-panda-shop-storage",
      version: 3,
      migrate: (persistedState: unknown) => {
        const currentUserId = getCurrentUserId();
        return migrateShopStorageState(persistedState, currentUserId);
      },
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        sessionOwnerId: state.sessionOwnerId,
      }),
    }
  )
);

// Register synchronous store cleanup on logout
onLogout(() => {
  useShopStore.getState().resetUserSession();
});

export function getCartTotals(
  items: StoreCartItem[],
  appliedCoupon: AppliedCouponState | null
) {
  const subtotal = computeSubtotal(items);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const discount = appliedCoupon
    ? Math.min(subtotal, appliedCoupon.discountAmount)
    : 0;
  const shipping =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const total = Math.max(0, subtotal - discount + shipping);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return {
    subtotal,
    totalItems,
    discount,
    shipping,
    total,
    amountToFreeShipping,
    freeShippingProgress,
  };
}
