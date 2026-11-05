"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { ordersApi, type ApiOrder } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { getOrderPaymentPresentation } from "@/lib/checkout-security";
import { fetchStoreProducts, SHOWCASE_PRODUCTS } from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";

const TRACKING_STEPS = ["pending", "processing", "shipped", "delivered"];

function getStepIndex(status: string): number {
  const idx = TRACKING_STEPS.indexOf(status.toLowerCase());
  return idx === -1 ? 0 : idx;
}

export default function OrdersPage() {
  const addToCart = useShopStore((s) => s.addToCart);

  const [serverOrders, setServerOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadOrders = async () => {
    if (!isLoggedIn()) {
      setServerOrders([]);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await ordersApi.list();
      if (res.success === false || !Array.isArray(res.data)) {
        throw new Error(res.message || "Unable to load your orders.");
      }
      const confirmedOnly = res.data.filter(
        (o) => Number.isInteger(Number(o.id)) && Number(o.id) > 0
      );
      setServerOrders(confirmedOnly);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setLoadError(
        msg.includes("Failed to fetch") ||
          msg.includes("NetworkError") ||
          msg.includes("Load failed")
          ? "Unable to reach the server to load your orders. Please check your connection and try again."
          : msg || "Unable to load your order history right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const allOrders = useMemo(() => {
    const list = [...serverOrders].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (statusFilter === "all") return list;
    return list.filter((o) => o.status.toLowerCase() === statusFilter);
  }, [serverOrders, statusFilter]);

  const handleReorder = async (order: ApiOrder) => {
    const { products } = await fetchStoreProducts();
    const pool = products.length > 0 ? products : SHOWCASE_PRODUCTS;
    for (const oi of order.items) {
      const found =
        pool.find((p) => p.id === oi.product_id) ||
        pool.find((p) =>
          oi.product_name.toLowerCase().includes(p.name.toLowerCase())
        );
      if (found) {
        await addToCart(found, oi.quantity, undefined, false);
      }
    }
    useShopStore.getState().openCart();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
            Live Order Tracking
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            My Orders & Receipts
          </h1>
        </div>

        {isLoggedIn() && (
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Status
          </button>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "Pending" },
          { id: "processing", label: "Processing" },
          { id: "shipped", label: "Shipped" },
          { id: "delivered", label: "Delivered" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shrink-0 cursor-pointer ${
              statusFilter === f.id
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex flex-wrap items-center justify-between gap-3"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {loadError}
          </span>
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-100 text-xs font-extrabold text-rose-700 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {allOrders.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200/80 p-14 text-center">
          <div className="w-18 h-18 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {isLoggedIn() ? "No confirmed orders found yet" : "Sign in to view your orders"}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            {isLoggedIn()
              ? "When your order is confirmed by the server, live delivery and payment status updates will appear right here."
              : "Sign in to view your server-confirmed order history and delivery status."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold inline-flex items-center gap-2 transition"
            >
              Start Shopping <ArrowRight size={15} />
            </Link>
            {!isLoggedIn() && (
              <Link
                href="/login?redirect=/orders"
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {allOrders.map((order) => {
            const cancelled = order.status.toLowerCase() === "cancelled";
            const activeStep = getStepIndex(order.status);
            const paymentMeta = getOrderPaymentPresentation(order);

            return (
              <article
                key={order.id}
                className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Order #{order.id}
                      </h2>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-extrabold capitalize ${
                          cancelled
                            ? "bg-rose-50 text-rose-600"
                            : order.status.toLowerCase() === "delivered"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        Order: {paymentMeta.orderStatusLabel}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                          paymentMeta.isPaid
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        Payment: {paymentMeta.paymentStatusLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock size={12} />
                      Placed on{" "}
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      • {order.payment_method}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">
                      {paymentMeta.totalLabel}
                    </span>
                    <span className="text-xl font-extrabold text-blue-600">
                      ${Number(order.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 4-Step Visual Progress Tracker */}
                {cancelled ? (
                  <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <XCircle size={16} /> This order was cancelled.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Placed", icon: ShoppingBag },
                      { label: "Processing", icon: Package },
                      { label: "Shipped", icon: Truck },
                      { label: "Delivered", icon: CheckCircle2 },
                    ].map((step, idx) => {
                      const Icon = step.icon;
                      const done = idx <= activeStep;
                      return (
                        <div
                          key={step.label}
                          className={`p-3 rounded-2xl border text-center transition ${
                            done
                              ? "border-blue-200 bg-blue-50/70 text-blue-700"
                              : "border-slate-100 bg-slate-50 text-slate-400"
                          }`}
                        >
                          <Icon size={17} className="mx-auto mb-1" />
                          <span className="text-[11px] font-extrabold block">
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Line Items */}
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs sm:text-sm py-1.5"
                    >
                      <span className="font-semibold text-slate-800">
                        {item.product_name}{" "}
                        <span className="text-slate-400">
                          × {item.quantity}
                        </span>
                      </span>
                      <span className="font-extrabold text-slate-900">
                        ${Number(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Address + Reorder */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-600 shrink-0" />
                    <span className="line-clamp-1">
                      {order.shipping_address}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShoppingBag size={13} />
                    Buy Again
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
