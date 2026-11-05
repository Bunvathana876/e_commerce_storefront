"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CreditCard,
  Lock,
  MapPin,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
  Tag,
  type LucideIcon,
} from "lucide-react";
import {
  addressesApi,
  cartApi,
  ordersApi,
  type ApiAddress,
  type ApiOrder,
} from "@/lib/api";
import { getCurrentUser, isLoggedIn } from "@/lib/auth";
import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSubmissionLock,
  DEFAULT_CHECKOUT_PAYMENT_METHOD,
  executeCheckoutOrder,
  getOrderPaymentPresentation,
} from "@/lib/checkout-security";
import { getEffectivePrice, resolveProductImage } from "@/lib/store-catalog";
import { getCartTotals, useShopStore } from "@/lib/store";

const PAYMENT_METHOD_ICONS: Record<string, LucideIcon> = {
  "Cash on Delivery": Banknote,
  "KHQR Scan & Pay": QrCode,
  "Credit / Debit Card": CreditCard,
  "Apple Pay": Smartphone,
};

export default function CheckoutPage() {
  const items = useShopStore((s) => s.items);
  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const clearCart = useShopStore((s) => s.clearCart);
  const applyCouponCode = useShopStore((s) => s.applyCouponCode);
  const removeCoupon = useShopStore((s) => s.removeCoupon);
  const pushToast = useShopStore((s) => s.pushToast);

  const submissionLockRef = useRef(createCheckoutSubmissionLock());

  const [savedAddresses, setSavedAddresses] = useState<ApiAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    "new"
  );

  // Semantic autofill-ready address form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saveAddressForLater, setSaveAddressForLater] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState(
    DEFAULT_CHECKOUT_PAYMENT_METHOD
  );
  const [promoInput, setPromoInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<ApiOrder | null>(null);

  const totals = getCartTotals(items, appliedCoupon);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setFullName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }

    if (isLoggedIn()) {
      addressesApi
        .list()
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setSavedAddresses(res.data);
            const def = res.data.find((a) => a.is_default) || res.data[0];
            setSelectedAddressId(def.id);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submissionLockRef.current.isLocked()) return;

    setErrorMessage(null);
    setSubmitting(true);

    try {
      let resolvedAddressText = "";
      if (selectedAddressId !== "new") {
        const picked = savedAddresses.find((a) => a.id === selectedAddressId);
        if (picked) {
          resolvedAddressText = [
            picked.full_name,
            picked.phone,
            picked.address_line,
            picked.city,
            picked.postal_code,
          ]
            .filter(Boolean)
            .join(", ");
        }
      } else {
        resolvedAddressText = [
          fullName.trim(),
          phone.trim(),
          streetAddress.trim(),
          city.trim(),
          postalCode.trim(),
        ]
          .filter(Boolean)
          .join(", ");
      }

      const result = await executeCheckoutOrder({
        lock: submissionLockRef.current,
        isAuthenticated: isLoggedIn(),
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: resolvedAddressText,
        shippingAddressId:
          selectedAddressId !== "new" ? selectedAddressId : undefined,
        newAddressToSave:
          selectedAddressId === "new" && saveAddressForLater
            ? {
                full_name: fullName.trim(),
                phone: phone.trim(),
                address_line: streetAddress.trim(),
                city: city.trim(),
                postal_code: postalCode.trim() || undefined,
                is_default: savedAddresses.length === 0,
              }
            : undefined,
        paymentMethod,
        phone: phone.trim() || undefined,
        fullName: fullName.trim() || undefined,
        couponCode: appliedCoupon?.code || undefined,
        deps: {
          createAddress: addressesApi.create,
          clearServerCart: cartApi.clear,
          addServerCartItem: cartApi.addItem,
          createOrder: ordersApi.create,
          clearClientCart: clearCart,
        },
      });

      if (result.status === "duplicate_blocked") {
        return;
      }

      setPlacedOrder(result.order);
      pushToast({
        title: `Order #${result.order.id} Confirmed!`,
        description: "Thank you for shopping with Blue Panda.",
        tone: "success",
      });
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Could not complete your order. Please check your details."
      );
    } finally {
      if (!submissionLockRef.current.isLocked()) {
        setSubmitting(false);
      }
    }
  };

  // ==========================================
  // ORDER CONFIRMED CELEBRATION VIEW
  // ==========================================
  if (placedOrder) {
    const paymentMeta = getOrderPaymentPresentation(placedOrder);
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white rounded-[2.25rem] border border-slate-200/80 p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <PackageCheck size={40} />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
              Order Confirmed
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Order{" "}
              <strong className="text-slate-900">#{placedOrder.id}</strong> has
              been confirmed by the server and is queued for processing.
            </p>
          </div>

          <div className="text-left p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Order Status</span>
              <span className="font-extrabold text-blue-700">
                {paymentMeta.orderStatusLabel}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <span className="text-slate-500 font-semibold">
                Payment Method
              </span>
              <span className="font-extrabold text-slate-900">
                {placedOrder.payment_method}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <span className="text-slate-500 font-semibold">
                Payment Status
              </span>
              <span
                className={`font-extrabold ${
                  paymentMeta.isPaid ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                {paymentMeta.paymentStatusLabel}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Delivering To</span>
              <span className="font-bold text-slate-800 text-right max-w-md">
                {placedOrder.shipping_address}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              {placedOrder.items.map((oi) => (
                <div
                  key={oi.id}
                  className="flex justify-between text-xs text-slate-700"
                >
                  <span>
                    {oi.product_name} × {oi.quantity}
                  </span>
                  <span className="font-bold">
                    ${Number(oi.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
              <span>{paymentMeta.totalLabel}</span>
              <span className="text-blue-600">
                ${Number(placedOrder.total).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/orders"
              className="px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold inline-flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
            >
              Track Order Live <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Your bag is empty
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Add products to your shopping bag before heading to checkout.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-sm font-extrabold"
        >
          Browse Shop <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link
          href="/cart"
          className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Back to Bag
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">
          Secure Checkout
        </h1>
      </div>

      {!isLoggedIn() && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            Please sign in before placing your order. Guest checkout is not available.
          </span>
          <Link
            href="/login?redirect=/checkout"
            className="px-4 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-extrabold transition"
          >
            Sign In
          </Link>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-2"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Delivery Address */}
          <section className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin size={19} className="text-blue-600" />
                1. Delivery Address
              </h2>
              {!isLoggedIn() && (
                <Link
                  href="/login?redirect=/checkout"
                  className="text-xs font-extrabold text-blue-600 hover:underline"
                >
                  Have an account? Sign in
                </Link>
              )}
            </div>

            {/* Saved Address Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2.5">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-blue-600 bg-blue-50/40"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-slate-900">
                        {addr.full_name} • {addr.phone}
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        {addr.address_line}, {addr.city}{" "}
                        {addr.postal_code || ""}
                      </p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer text-xs font-bold ${
                    selectedAddressId === "new"
                      ? "border-blue-600 bg-blue-50/40 text-blue-700"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="saved-address"
                    checked={selectedAddressId === "new"}
                    onChange={() => setSelectedAddressId("new")}
                    className="text-blue-600 focus:ring-blue-600"
                  />
                   Ship to a new delivery address
                </label>
              </div>
            )}

            {/* New Address Fields (built per autofill-address-form guide) */}
            {selectedAddressId === "new" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    Full Name *
                  </label>
                  <input
                    id="checkout-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    Email for Receipt *
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    Mobile Phone *
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+855 12 345 678"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-street"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    Street Address, Building & Unit *
                  </label>
                  <textarea
                    id="checkout-street"
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="House / Apt #, Street Name, Landmark"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-city"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    City / Province *
                  </label>
                  <input
                    id="checkout-city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Phnom Penh"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-postal"
                    className="block text-xs font-extrabold text-slate-700 mb-1.5"
                  >
                    Postal Code (Optional)
                  </label>
                  <input
                    id="checkout-postal"
                    name="postal-code"
                    type="text"
                    autoComplete="postal-code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                {isLoggedIn() && (
                  <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddressForLater}
                      onChange={(e) => setSaveAddressForLater(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Save this address to my account for faster checkout next time
                  </label>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Payment Method */}
          <section className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard size={19} className="text-blue-600" />
              2. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHECKOUT_PAYMENT_METHODS.map((pm) => {
                const Icon = PAYMENT_METHOD_ICONS[pm.id] || CreditCard;
                const active = paymentMethod === pm.id;
                return (
                  <label
                    key={pm.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      active
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/15"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      checked={active}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="mt-1 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon size={16} className="text-blue-600 shrink-0" />
                        <span className="text-xs font-extrabold text-slate-900">
                          {pm.title}
                        </span>
                        {pm.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                            {pm.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pm.subtitle}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>

            {CHECKOUT_PAYMENT_METHODS.find((pm) => pm.id === paymentMethod)
              ?.isDemo && (
              <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                Demo payment method selected: online payment capture is not
                integrated yet. Your order payment status will remain{" "}
                <strong>Pending Verification</strong> until verified.
              </p>
            )}
          </section>
        </div>

        {/* Right: Order Review & Descriptive CTA */}
        <aside className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5 sticky top-24">
          <h2 className="text-lg font-extrabold text-slate-900">
            Order Review ({totals.totalItems} items)
          </h2>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {items.map((item) => {
              const unit = getEffectivePrice(item.product);
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <img
                    src={resolveProductImage(item.product)}
                    alt={item.product.name}
                    loading="lazy"
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Qty {item.quantity}
                      {item.variant ? ` • ${item.variant}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    ${(unit * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Promo Voucher */}
          <div className="pt-3 border-t border-slate-100">
            {appliedCoupon ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (e.g. WELCOME10)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!promoInput.trim()) return;
                    try {
                      await applyCouponCode(promoInput);
                      setPromoInput("");
                    } catch (err: any) {
                      setErrorMessage(err?.message || "Invalid promo code.");
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-xs sm:text-sm text-slate-600 pt-3 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">
                ${totals.subtotal.toFixed(2)}
              </span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Promo Savings</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-bold text-slate-900">
                {totals.shipping === 0
                  ? "FREE"
                  : `$${totals.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 border-t border-slate-200">
              <span>Order Total</span>
              <span className="text-blue-600">${totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 transition cursor-pointer"
          >
            <Lock size={16} />
            {submitting
              ? "Placing Your Order..."
              : `Place Order • $${totals.total.toFixed(2)}`}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-600" />
            Protected by Blue Panda Buyer Guarantee
          </div>
        </aside>
      </form>
    </div>
  );
}
