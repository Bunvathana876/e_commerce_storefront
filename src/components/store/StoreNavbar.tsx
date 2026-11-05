"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Store,
  User,
  X,
} from "lucide-react";
import {
  notificationsApi,
  type ApiNotification,
  type ApiUser,
} from "@/lib/api";
import { getCurrentUser, isLoggedIn, logout } from "@/lib/auth";
import { getCartTotals, useShopStore } from "@/lib/store";

const NAV_LINKS = [
  { href: "/categories", label: "Categories", hasDropdown: true },
  { href: "/deals", label: "Deals" },
  { href: "/shop?sort=newest", label: "What's New" },
  { href: "/orders", label: "Delivery" },
];

export default function StoreNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const items = useShopStore((state) => state.items);
  const appliedCoupon = useShopStore((state) => state.appliedCoupon);
  const wishlist = useShopStore((state) => state.wishlist);
  const openCart = useShopStore((state) => state.openCart);
  const openSearch = useShopStore((state) => state.openSearch);
  const pushToast = useShopStore((state) => state.pushToast);
  const syncCartFromBackend = useShopStore((state) => state.syncCartFromBackend);
  const syncWishlistFromBackend = useShopStore(
    (state) => state.syncWishlistFromBackend
  );

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const refreshAuth = () => {
      if (isLoggedIn()) {
        const current = getCurrentUser();
        setUser(current);
        void syncCartFromBackend();
        void syncWishlistFromBackend();
      } else {
        setUser(null);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    refreshAuth();
    window.addEventListener("auth-changed", refreshAuth);
    return () => window.removeEventListener("auth-changed", refreshAuth);
  }, [syncCartFromBackend, syncWishlistFromBackend]);

  useEffect(() => {
    if (!user) return;

    notificationsApi
      .getAll({ limit: 5 })
      .then((response) => {
        const list = response.data ?? [];
        setNotifications(list);
        setUnreadCount(
          typeof response.unread_count === "number"
            ? response.unread_count
            : list.filter((notification) => !notification.read).length
        );
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const totals = getCartTotals(items, appliedCoupon);
  const cartCount = mounted ? totals.totalItems : 0;
  const wishlistCount = mounted ? wishlist.length : 0;
  const isStaff = user?.role === "admin" || user?.role === "seller";
  const managementUrl =
    process.env.NEXT_PUBLIC_MANAGEMENT_URL || "http://localhost:3001";
  const staffDestination =
    user?.role === "seller"
      ? `${managementUrl}/seller`
      : `${managementUrl}/admin/dashboard`;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    pushToast({
      title: "Signed out",
      description: "Your storefront session has ended.",
      tone: "info",
    });
    router.push("/");
  };

  const isActiveLink = (href: string) => {
    const baseHref = href.split("?")[0];
    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  };

  return (
    <>
      {/* STEP 2 — SLIM ANNOUNCEMENT BAR */}
      <div className="bg-[#0f172a] text-slate-300 border-b border-slate-800 text-xs">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="font-medium text-slate-200">
              Free delivery on orders over $100
            </span>
            <span className="hidden text-slate-400 md:inline">
              — Real-time order tracking & direct seller fulfillment
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/orders"
              className="transition-colors hover:text-white"
            >
              Track Order
            </Link>
            <span className="h-3 w-px bg-slate-700" />
            <Link
              href="/shop"
              className="transition-colors hover:text-white"
            >
              All Products
            </Link>
          </div>
        </div>
      </div>

      {/* STEP 3 — HEADER AND NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/98 shadow-[0_1px_8px_rgba(15,23,42,0.03)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 lg:h-18">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-store-navigation"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* LEFT: Logo & Wordmark */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              aria-label="Blue Panda home"
            >
              <img
                src="/images/logo_panda_blue.png"
                alt="Blue Panda"
                width={36}
                height={36}
                className="h-9 w-9 rounded-xl object-contain shadow-xs"
              />
              <span className="text-xl font-bold tracking-tight text-slate-950">
                Blue Panda
              </span>
            </Link>

            {/* CENTER: Navigation Links */}
            <nav
              aria-label="Store primary navigation"
              className="hidden items-center gap-6 lg:flex"
            >
              {NAV_LINKS.map((link) => {
                const active = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-1 text-sm font-semibold transition-colors ${
                      active
                        ? "text-blue-600"
                        : "text-slate-700 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <ChevronDown size={14} className="text-slate-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT: Search, Wishlist, Account, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Pill launcher */}
              <button
                type="button"
                onClick={openSearch}
                aria-label="Search products"
                className="group relative flex h-10 w-36 items-center gap-2 rounded-full border border-slate-200 bg-slate-100/90 px-3.5 text-left text-xs font-medium text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-48 md:w-56"
              >
                <Search size={15} className="text-slate-400 group-hover:text-slate-600" />
                <span className="truncate">Search Product...</span>
                <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 md:inline-block">
                  ⌘K
                </kbd>
              </button>

              {/* Wishlist Icon */}
              <Link
                href="/wishlist"
                aria-label={`Favorites${wishlistCount ? `, ${wishlistCount} items` : ""}`}
                className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
              >
                <Heart size={18} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notifications (Logged in users) */}
              {mounted && user && (
                <div className="relative hidden md:block" ref={notificationMenuRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationMenuOpen((open) => !open)}
                    aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                    aria-expanded={notificationMenuOpen}
                    aria-controls="store-notification-menu"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationMenuOpen && (
                    <div
                      id="store-notification-menu"
                      className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-950">
                          Notifications
                        </span>
                        <Link
                          href="/account?tab=notifications"
                          onClick={() => setNotificationMenuOpen(false)}
                          className="text-xs font-semibold text-blue-700 hover:underline"
                        >
                          View all
                        </Link>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <p className="p-6 text-center text-sm text-slate-500">
                            No new notifications.
                          </p>
                        ) : (
                          notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={notification.link || "/orders"}
                              onClick={() => setNotificationMenuOpen(false)}
                              className="block px-4 py-3 transition-colors hover:bg-slate-50"
                            >
                              <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                                {notification.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {notification.message}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Dropdown or Sign In */}
              {mounted && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((open) => !open)}
                    aria-label="Open account menu"
                    aria-expanded={userMenuOpen}
                    aria-controls="store-account-menu"
                    className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                    <span className="hidden max-w-20 truncate text-xs font-semibold text-slate-800 xl:block">
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown size={13} className="hidden text-slate-400 sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div
                      id="store-account-menu"
                      className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {user.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-2">
                        {[
                          { href: "/account", label: "My account", icon: User },
                          { href: "/orders", label: "My orders", icon: Package },
                          { href: "/wishlist", label: "Favorites", icon: Heart },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                            >
                              <Icon size={16} /> {item.label}
                            </Link>
                          );
                        })}
                        {isStaff && (
                          <a
                            href={staffDestination}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            <LayoutDashboard size={16} /> Management portal
                          </a>
                        )}
                      </div>
                      <div className="border-t border-slate-100 p-2">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  aria-label="Sign in"
                  className="flex h-10 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Account</span>
                </Link>
              )}

              {/* Cart Button */}
              <button
                type="button"
                onClick={openCart}
                aria-label={`Open shopping cart${cartCount ? `, ${cartCount} items` : ""}`}
                className="relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-600 hover:border-blue-600 sm:px-4"
              >
                <ShoppingBag size={16} />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0"
            />
            <nav
              id="mobile-store-navigation"
              aria-label="Mobile store navigation"
              className="relative max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-5 py-6 shadow-2xl"
            >
              <div className="mx-auto max-w-7xl space-y-1">
                {NAV_LINKS.map((link) => {
                  const active = isActiveLink(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-semibold ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {link.label}
                      <ChevronDown size={16} className="-rotate-90 text-slate-400" />
                    </Link>
                  );
                })}
                <div className="my-3 border-t border-slate-200" />
                <Link
                  href="/shop"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Package size={18} /> All Products
                </Link>
                <Link
                  href="/wishlist"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Heart size={18} /> Favorites
                  {wishlistCount > 0 && (
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Package size={18} /> Orders
                </Link>
                <Link
                  href="/account"
                  className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <User size={18} /> Account
                </Link>
                {isStaff && (
                  <a
                    href={staffDestination}
                    className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    <Store size={18} /> Management portal
                  </a>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
