"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import {
  addressesApi,
  authApi,
  notificationsApi,
  type ApiAddress,
  type ApiNotification,
  type ApiUser,
} from "@/lib/api";
import {
  getCurrentUser,
  isLoggedIn,
  logout,
  saveAuthSession,
  getAccessToken,
} from "@/lib/auth";
import { useShopStore } from "@/lib/store";

function AccountHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pushToast = useShopStore((s) => s.pushToast);

  const [user, setUser] = useState<ApiUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "addresses" | "security" | "notifications"
  >("profile");

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine, setAddrLine] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "addresses" ||
      tab === "security" ||
      tab === "notifications" ||
      tab === "profile"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const current = getCurrentUser();
    if (current) {
      setUser(current);
      setName(current.name || "");
      setPhone(current.phone || "");
      setAddrName(current.name || "");
      setAddrPhone(current.phone || "");
    }

    addressesApi
      .list()
      .then((res) => {
        if (res.data) setAddresses(res.data);
      })
      .catch(() => {});

    notificationsApi
      .getAll({ limit: 20 })
      .then((res) => {
        if (res.data) setNotifications(res.data);
      })
      .catch(() => {});
  }, []);

  // Clear private account state immediately when auth state changes (e.g. logout or account switch)
  useEffect(() => {
    const handleAuthChange = () => {
      if (!isLoggedIn()) {
        setUser(null);
        setName("");
        setPhone("");
        setAddrName("");
        setAddrPhone("");
        setAddresses([]);
        setNotifications([]);
      } else {
        const current = getCurrentUser();
        if (current) {
          setUser(current);
          setName(current.name || "");
          setPhone(current.phone || "");
          setAddrName(current.name || "");
          setAddrPhone(current.phone || "");
        }
      }
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2rem] border border-slate-200/80 p-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <User size={30} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Sign in to Your Blue Panda Account
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Manage saved addresses, sync your wishlist with the mobile app, and
            track real-time parcel updates.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/login?redirect=/account"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition"
            >
              Sign In
            </Link>
            <Link
              href="/register?redirect=/account"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authApi.updateMe({ name, phone });
      const token = getAccessToken();
      if (res.data && token) {
        saveAuthSession(token, res.data);
        setUser(res.data);
      }
      pushToast({
        title: "Profile Updated",
        description: "Your account details have been saved.",
        tone: "success",
      });
    } catch (err: any) {
      pushToast({
        title: "Could not update profile",
        description: err?.message || "Please try again.",
        tone: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const res = await addressesApi.create({
        full_name: addrName,
        phone: addrPhone,
        address_line: addrLine,
        city: addrCity,
        is_default: addresses.length === 0,
      });
      if (res.data) {
        setAddresses((prev) => [res.data, ...prev]);
        setAddrLine("");
        setAddrCity("");
        pushToast({
          title: "Address Saved",
          description: `${res.data.city} added to your address book.`,
          tone: "success",
        });
      }
    } catch (err: any) {
      pushToast({
        title: "Could not save address",
        description: err?.message || "Backend unavailable.",
        tone: "error",
      });
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await addressesApi.delete(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      pushToast({
        title: "Password Changed",
        description: "Your account password has been updated securely.",
        tone: "success",
      });
    } catch (err: any) {
      pushToast({
        title: "Password update failed",
        description: err?.message || "Check your current password.",
        tone: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl font-extrabold flex items-center justify-center">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-slate-900 truncate">
                {user.name}
              </h1>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                {user.role}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: "profile" as const, label: "Personal Profile", icon: User },
              {
                id: "addresses" as const,
                label: "Shipping Addresses",
                icon: MapPin,
              },
              {
                id: "notifications" as const,
                label: "Notifications",
                icon: Bell,
              },
              {
                id: "security" as const,
                label: "Password & Security",
                icon: KeyRound,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition cursor-pointer ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {(user.role === "admin" || user.role === "seller") && (
            <a
              href={
                user.role === "seller"
                  ? `${process.env.NEXT_PUBLIC_MANAGEMENT_URL || "http://localhost:3001"}/seller`
                  : `${process.env.NEXT_PUBLIC_MANAGEMENT_URL || "http://localhost:3001"}/admin/dashboard`
              }
              className="w-full py-3 px-4 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-extrabold flex items-center justify-center gap-2 transition"
            >
              <LayoutDashboard size={15} />
              Open Merchant Admin Portal
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8 bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
              <h2 className="text-xl font-extrabold text-slate-900">
                Personal Information
              </h2>
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500"
                />
              </div>

              <div>
                <label
                  htmlFor="profile-phone"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  Mobile Phone
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+855 12 345 678"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition cursor-pointer"
              >
                {savingProfile ? "Saving..." : "Save Profile Changes"}
              </button>
            </form>
          )}

          {activeTab === "addresses" && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-slate-900">
                Saved Shipping Addresses
              </h2>

              {addresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-2"
                    >
                      <div className="text-xs space-y-1">
                        <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          {addr.full_name}
                          {addr.is_default && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px]">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-slate-500">{addr.phone}</p>
                        <p className="text-slate-600">
                          {addr.address_line}, {addr.city}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleCreateAddress}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4"
              >
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Plus size={16} className="text-blue-600" /> Add New Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="addr-name"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      Recipient Full Name
                    </label>
                    <input
                      id="addr-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={addrName}
                      onChange={(e) => setAddrName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-phone"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      Phone Number
                    </label>
                    <input
                      id="addr-phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={addrPhone}
                      onChange={(e) => setAddrPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="addr-street"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      Street Address
                    </label>
                    <textarea
                      id="addr-street"
                      rows={2}
                      autoComplete="street-address"
                      required
                      value={addrLine}
                      onChange={(e) => setAddrLine(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="addr-city"
                      className="block text-xs font-bold text-slate-600 mb-1"
                    >
                      City / Province
                    </label>
                    <input
                      id="addr-city"
                      type="text"
                      autoComplete="address-level2"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold transition cursor-pointer"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Notifications
                </h2>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await notificationsApi.markAllAsRead().catch(() => {});
                      setNotifications((prev) =>
                        prev.map((n) => ({ ...n, read: true }))
                      );
                    }}
                    className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  No notifications right now.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border ${
                        n.read
                          ? "border-slate-100 bg-slate-50/60"
                          : "border-blue-200 bg-blue-50/40"
                      }`}
                    >
                      <p className="text-sm font-extrabold text-slate-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <h2 className="text-xl font-extrabold text-slate-900">
                Change Password
              </h2>
              <div>
                <label
                  htmlFor="sec-current"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  Current Password
                </label>
                <input
                  id="sec-current"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="sec-new"
                  className="block text-xs font-extrabold text-slate-700 mb-1.5"
                >
                  New Password (min 6 characters)
                </label>
                <input
                  id="sec-new"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition cursor-pointer"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <AccountHubContent />
    </Suspense>
  );
}
