"use client";

import Link from "next/link";
import { Eye, Heart, ShoppingBag, Star, Store } from "lucide-react";
import type { ApiProduct } from "@/lib/api";
import {
  getDiscountPercent,
  getEffectivePrice,
  getOriginalPrice,
  resolveProductImage,
} from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";

interface ProductCardProps {
  product: ApiProduct;
  layout?: "grid" | "list";
}

export default function ProductCard({
  product,
  layout = "grid",
}: ProductCardProps) {
  const addToCart = useShopStore((state) => state.addToCart);
  const toggleWishlist = useShopStore((state) => state.toggleWishlist);
  const openQuickView = useShopStore((state) => state.openQuickView);
  const isWishlisted = useShopStore((state) =>
    state.wishlist.some((item) => item.id === product.id)
  );

  const effectivePrice = getEffectivePrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const rating = Number(product.rating) || 0;
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 12;

  if (layout === "list") {
    return (
      <article className="group flex flex-col gap-5 rounded-2xl border border-slate-200/90 bg-white p-4 transition duration-200 hover:border-slate-300 hover:shadow-md sm:flex-row sm:p-5">
        <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl bg-[#f6f7f9] p-3 sm:h-48 sm:w-48 flex items-center justify-center">
          <Link href={`/product/${product.id}`} className="block h-full w-full">
            <img
              src={resolveProductImage(product)}
              alt={product.name}
              loading="lazy"
              width={480}
              height={480}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
              -{discountPercent}%
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from favorites`
                : `Save ${product.name} to favorites`
            }
            aria-pressed={isWishlisted}
            className={`absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-xs transition ${
              isWishlisted
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-slate-100 bg-white/95 text-slate-700 hover:text-rose-600"
            }`}
          >
            <Heart size={16} className={isWishlisted ? "fill-current" : ""} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              {product.category?.name && (
                <span className="font-semibold text-blue-600">
                  {product.category.name}
                </span>
              )}
              {product.seller?.name && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Store size={12} /> {product.seller.name}
                </span>
              )}
              {rating > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {rating.toFixed(1)}
                </span>
              )}
            </div>

            <h3>
              <Link
                href={`/product/${product.id}`}
                className="line-clamp-2 text-base font-bold text-slate-950 transition-colors hover:text-blue-600"
              >
                {product.name}
              </Link>
            </h3>

            {product.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-950">
                  ${effectivePrice.toFixed(2)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-slate-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p
                className={`mt-0.5 text-xs font-semibold ${
                  outOfStock
                    ? "text-rose-600"
                    : lowStock
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {outOfStock
                  ? "Out of stock"
                  : lowStock
                  ? `Only ${product.stock} left`
                  : "In stock"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openQuickView(product)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                <Eye size={14} /> Quick view
              </button>
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => addToCart(product, 1)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-blue-600 hover:border-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <ShoppingBag size={14} />
                {outOfStock ? "Sold out" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Product Image Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f6f7f9] p-4 flex items-center justify-center">
        <Link href={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={resolveProductImage(product)}
            alt={product.name}
            loading="lazy"
            width={600}
            height={600}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
            -{discountPercent}%
          </span>
        )}

        {/* Out of Stock Badge */}
        {outOfStock && (
          <span className="absolute bottom-3 left-3 rounded-md bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            Out of stock
          </span>
        )}

        {/* Favorite & Quick View Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from favorites`
                : `Save ${product.name} to favorites`
            }
            aria-pressed={isWishlisted}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-xs transition ${
              isWishlisted
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-slate-100 bg-white/95 text-slate-700 hover:text-rose-600"
            }`}
          >
            <Heart size={15} className={isWishlisted ? "fill-current" : ""} />
          </button>
          <button
            type="button"
            onClick={() => openQuickView(product)}
            aria-label={`Quick view ${product.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-slate-700 shadow-xs transition hover:text-blue-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <Eye size={15} />
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-semibold text-blue-600">
            {product.category?.name ?? "Product"}
          </span>
          {rating > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-slate-800">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="mt-1.5">
          <Link
            href={`/product/${product.id}`}
            className="line-clamp-2 text-sm font-bold text-slate-950 transition-colors hover:text-blue-600 leading-snug"
          >
            {product.name}
          </Link>
        </h3>

        {/* Seller Info if available */}
        {product.seller?.name && (
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-400">
            <Store size={11} className="shrink-0" />
            <span className="truncate">{product.seller.name}</span>
          </p>
        )}

        {/* Price & Add to Cart Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-slate-950">
                ${effectivePrice.toFixed(2)}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {lowStock && (
              <p className="text-[11px] font-semibold text-amber-600">
                Only {product.stock} left
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1)}
            aria-label={`Add ${product.name} to cart`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <ShoppingBag size={13} />
            <span>{outOfStock ? "Out" : "Add to Cart"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
