"use client";

import Link from "next/link";
import { ArrowRight, PackageOpen, ShoppingBag } from "lucide-react";
import type { ApiProduct } from "@/lib/api";
import { getEffectivePrice, resolveProductImage } from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";

interface PromoHeroProps {
  product: ApiProduct | null;
  isLoading: boolean;
}

export default function PromoHero({ product, isLoading }: PromoHeroProps) {
  const addToCart = useShopStore((state) => state.addToCart);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-slate-200/80 bg-[#fbfbfd] shadow-xs lg:grid-cols-12 min-h-[460px] lg:min-h-[500px]">
        {/* Left Column: Editorial Headline & Primary CTA */}
        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-16 lg:col-span-7 lg:px-16">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            CURATED MARKETPLACE SELECTION
          </div>

          <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[52px] lg:leading-[1.12]">
            Grab the Best Tech &amp; Lifestyle Essentials.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
            Explore verified products from the live Blue Panda catalog. Real
            inventory, direct seller connections, and dependable order fulfillment.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2.5 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Shop Now
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              All Categories
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Product Artwork & Floating Detail Card */}
        <div className="relative flex items-center justify-center p-6 sm:p-8 lg:col-span-5 lg:p-10">
          <div className="relative flex h-full min-h-[300px] w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-xs sm:min-h-[360px]">
            {isLoading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
            ) : product ? (
              <>
                <img
                  src={resolveProductImage(product)}
                  alt={product.name}
                  fetchPriority="high"
                  width={640}
                  height={640}
                  className="max-h-72 w-auto object-contain transition-transform duration-500 hover:scale-105 sm:max-h-84"
                />

                {/* Floating product card tag */}
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-slate-200/80 bg-white/95 p-3.5 shadow-sm backdrop-blur-xs sm:inset-x-6 sm:bottom-6">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-blue-600">
                        {product.category?.name ?? "Featured Item"}
                      </span>
                      <Link
                        href={`/product/${product.id}`}
                        className="block truncate text-sm font-bold text-slate-900 hover:text-blue-600"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm font-bold text-slate-950">
                        ${getEffectivePrice(product).toFixed(2)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => addToCart(product, 1)}
                      aria-label={`Add ${product.name} to cart`}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      <ShoppingBag size={14} />
                      <span>{product.stock > 0 ? "Add" : "Out"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400">
                <PackageOpen size={40} className="mx-auto text-slate-300" />
                <p className="mt-2 text-xs font-semibold">Catalog loading...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
