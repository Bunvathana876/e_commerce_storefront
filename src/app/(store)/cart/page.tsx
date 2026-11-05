"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { getEffectivePrice, resolveProductImage } from "@/lib/store-catalog";
import {
  FREE_SHIPPING_THRESHOLD,
  getCartTotals,
  useShopStore,
} from "@/lib/store";

export default function CartPage() {
  const items = useShopStore((s) => s.items);
  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const updateQuantity = useShopStore((s) => s.updateQuantity);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const clearCart = useShopStore((s) => s.clearCart);
  const applyCouponCode = useShopStore((s) => s.applyCouponCode);
  const removeCoupon = useShopStore((s) => s.removeCoupon);

  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const totals = getCartTotals(items, appliedCoupon);

  const handleApplyPromo = async (codeOverride?: string) => {
    const code = (codeOverride ?? promoCode).trim();
    if (!code) return;
    setPromoError(null);
    setApplying(true);
    try {
      await applyCouponCode(code);
      setPromoCode("");
    } catch (err: any) {
      setPromoError(err?.message || "Invalid promo code.");
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2rem] border border-slate-200/80 p-12 sm:p-16 shadow-xs">
          <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Browse our latest arrivals, flash deals, and official merchant
            collections to add items to your bag.
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/20 transition"
          >
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/shop"
            className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft size={13} /> Continue Shopping
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
            Shopping Bag ({totals.totalItems}{" "}
            {totals.totalItems === 1 ? "item" : "items"})
          </h1>
        </div>
        <button
          type="button"
          onClick={() => clearCart()}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 inline-flex items-center gap-1.5 transition cursor-pointer"
        >
          <Trash2 size={14} /> Clear Bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Items */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Shipping Meter */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
              {totals.amountToFreeShipping > 0 ? (
                <span className="font-bold text-slate-700 flex items-center gap-2">
                  <Truck size={16} className="text-blue-600" />
                  Add{" "}
                  <strong className="text-blue-600">
                    ${totals.amountToFreeShipping.toFixed(2)}
                  </strong>{" "}
                  more to unlock FREE Express Shipping!
                </span>
              ) : (
                <span className="font-extrabold text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Congratulations! You unlocked FREE Express Shipping!
                </span>
              )}
              <span className="text-xs font-bold text-slate-400">
                ${FREE_SHIPPING_THRESHOLD} threshold
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
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

          {/* Item Rows */}
          {items.map((item) => {
            const unit = getEffectivePrice(item.product);
            return (
              <div
                key={item.key}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xs"
              >
                <Link
                  href={`/product/${item.product.id}`}
                  className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0"
                >
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.name}
                    loading="lazy"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-blue-600">
                    {item.product.category?.name || "Featured"}
                  </span>
                  <Link
                    href={`/product/${item.product.id}`}
                    className="text-base font-extrabold text-slate-900 hover:text-blue-600 block truncate"
                  >
                    {item.product.name}
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Option: <strong>{item.variant}</strong>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    ${unit.toFixed(2)} each
                  </p>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-5">
                  <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-9 text-center text-sm font-extrabold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="text-right min-w-22">
                    <p className="text-base font-extrabold text-slate-900">
                      ${(unit * item.quantity).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      className="text-xs font-semibold text-rose-500 hover:underline mt-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-4 bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-lg font-extrabold text-slate-900">
            Order Summary
          </h2>

          {/* Promo Input */}
          <div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <span className="font-extrabold flex items-center gap-1.5">
                  <Tag size={14} /> {appliedCoupon.code} (-$
                  {totals.discount.toFixed(2)})
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="font-extrabold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    disabled={applying || !promoCode.trim()}
                    onClick={() => handleApplyPromo()}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-extrabold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <Sparkles size={12} className="text-blue-600" />
                  {["WELCOME10", "SAVE20", "SUMMER15", "SUPER50"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleApplyPromo(c)}
                      className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-extrabold cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {promoError && (
                  <p className="text-xs text-rose-600 font-semibold">
                    {promoError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Numbers */}
          <div className="space-y-2.5 text-sm text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">
                ${totals.subtotal.toFixed(2)}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Voucher Savings</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Shipping</span>
              <span className="font-bold text-slate-900">
                {totals.shipping === 0
                  ? "FREE"
                  : `$${totals.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Total</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </Link>

          <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            256-Bit SSL Encrypted Checkout
          </p>
        </aside>
      </div>
    </div>
  );
}
