"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { getEffectivePrice, resolveProductImage } from "@/lib/store-catalog";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartTotals,
  useShopStore,
} from "@/lib/store";

const QUICK_VOUCHERS = ["WELCOME10", "SAVE20", "SUMMER15"];

export default function CartDrawer() {
  const isOpen = useShopStore((s) => s.isCartOpen);
  const closeCart = useShopStore((s) => s.closeCart);
  const items = useShopStore((s) => s.items);
  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const updateQuantity = useShopStore((s) => s.updateQuantity);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const applyCouponCode = useShopStore((s) => s.applyCouponCode);
  const removeCoupon = useShopStore((s) => s.removeCoupon);

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const totals = getCartTotals(items, appliedCoupon);

  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply ?? promoInput).trim();
    if (!code) return;
    setPromoError(null);
    setApplyingPromo(true);
    try {
      await applyCouponCode(code);
      setPromoInput("");
    } catch (err: any) {
      setPromoError(err?.message || "Invalid promo code.");
    } finally {
      setApplyingPromo(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        aria-label="Shopping Bag"
        className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Your Shopping Bag
                </h2>
                <p className="text-xs text-slate-500">
                  {totals.totalItems}{" "}
                  {totals.totalItems === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close shopping bag"
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Free Shipping Progress */}
          {items.length > 0 && (
            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                {totals.amountToFreeShipping > 0 ? (
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Truck size={14} className="text-blue-600" />
                    Add{" "}
                    <strong className="text-blue-600">
                      ${totals.amountToFreeShipping.toFixed(2)}
                    </strong>{" "}
                    for FREE shipping!
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Unlocked FREE Express Shipping!
                  </span>
                )}
                <span className="text-[11px] font-bold text-slate-400">
                  ${FREE_SHIPPING_THRESHOLD} goal
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totals.amountToFreeShipping === 0
                      ? "bg-emerald-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${totals.freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <ShoppingBag size={34} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Your bag is empty
              </h3>
              <p className="text-sm text-slate-500 max-w-xs mt-1.5">
                Explore trending drops, flagship electronics, and exclusive
                vouchers waiting for you.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-6 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                Explore Products <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const unitPrice = getEffectivePrice(item.product);
              return (
                <div
                  key={item.key}
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition"
                >
                  <Link
                    href={`/product/${item.product.id}`}
                    onClick={closeCart}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0"
                  >
                    <img
                      src={resolveProductImage(item.product)}
                      alt={item.product.name}
                      fetchPriority="low"
                      loading="lazy"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.product.id}`}
                          onClick={closeCart}
                          className="text-sm font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <p className="text-[11px] font-medium text-slate-400">
                            Option: {item.variant}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        aria-label={`Remove ${item.product.name}`}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white text-slate-700 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.key, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white text-slate-700 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-slate-900">
                        ${(unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-4">
            {/* Promo Voucher Box */}
            <div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <span className="font-bold flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-600" />
                    Code {appliedCoupon.code} (-$
                    {totals.discount.toFixed(2)})
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Promo code (e.g. WELCOME10)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      disabled={applyingPromo || !promoInput.trim()}
                      onClick={() => handleApplyPromo()}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {applyingPromo ? "..." : "Apply"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <Sparkles size={12} className="text-blue-600 shrink-0" />
                    {QUICK_VOUCHERS.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleApplyPromo(code)}
                        className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition shrink-0 cursor-pointer"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-medium">
                      {promoError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ${totals.subtotal.toFixed(2)}
                </span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount</span>
                  <span>-${totals.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-slate-900">
                  {totals.shipping === 0
                    ? "FREE"
                    : `$${totals.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>${totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
              >
                Checkout Now • ${totals.total.toFixed(2)}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full py-2.5 text-center text-xs font-bold text-slate-600 hover:text-blue-600 transition"
              >
                View Full Shopping Bag
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
