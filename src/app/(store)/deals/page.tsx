"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Flame, Tag } from "lucide-react";
import type { ApiCoupon, ApiProduct } from "@/lib/api";
import {
  fetchStoreCoupons,
  fetchStoreProducts,
  getDiscountPercent,
  SHOWCASE_COUPONS,
  SHOWCASE_PRODUCTS,
} from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";
import ProductCard from "@/components/store/ProductCard";

export default function DealsPage() {
  const pushToast = useShopStore((s) => s.pushToast);

  const [products, setProducts] = useState<ApiProduct[]>(SHOWCASE_PRODUCTS);
  const [coupons, setCoupons] = useState<ApiCoupon[]>(SHOWCASE_COUPONS);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreProducts().then(({ products: list }) => setProducts(list));
    fetchStoreCoupons().then(setCoupons);
  }, []);

  const discountedProducts = useMemo(() => {
    const onSale = products
      .filter((p) => getDiscountPercent(p) > 0)
      .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
    return onSale.length > 0 ? onSale : products;
  }, [products]);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    pushToast({
      title: `Promo Code ${code} Copied`,
      description: "Paste it inside your Shopping Bag or at Checkout!",
      tone: "success",
    });
    window.setTimeout(() => setCopied(null), 2200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Banner */}
      <div className="rounded-[2rem] bg-gradient-to-br from-rose-600 via-orange-600 to-slate-950 text-white p-8 sm:p-12 shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-extrabold uppercase tracking-wider">
          <Flame size={14} /> Flash Deals & Promo Vault
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold mt-3 leading-tight">
          Stack Vouchers on Top of Markdowns.
        </h1>
        <p className="text-sm sm:text-base text-rose-100 mt-2 max-w-2xl">
          Grab up to 33% OFF storewide markdowns and apply official promo
          vouchers at checkout for extra instant savings.
        </p>
      </div>

      {/* Vouchers */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Tag size={20} className="text-blue-600" />
          Active Promo Codes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-3xl bg-white border-2 border-dashed border-blue-200 flex flex-col justify-between gap-4"
            >
              <div>
                <span className="px-3 py-1 rounded-xl bg-blue-600 text-white text-sm font-extrabold">
                  {c.discount_type === "percent"
                    ? `${Number(c.discount_value)}% OFF`
                    : `$${Number(c.discount_value)} OFF`}
                </span>
                <p className="text-sm font-bold text-slate-800 mt-3">
                  {c.description || "Official store discount"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {Number(c.min_order_amount) > 0
                    ? `Min. order $${Number(c.min_order_amount).toFixed(0)}`
                    : "Valid on all orders"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <code className="text-xs font-extrabold bg-slate-100 px-2.5 py-1 rounded-lg">
                  {c.code}
                </code>
                <button
                  type="button"
                  onClick={() => copyCode(c.code)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copied === c.code ? (
                    <>
                      <Check size={13} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Discounted Products */}
      <section className="space-y-5">
        <h2 className="text-2xl font-extrabold text-slate-900">
          Markdowns Live Right Now ({discountedProducts.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {discountedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
