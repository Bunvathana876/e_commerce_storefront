"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react";
import {
  getDiscountPercent,
  getEffectivePrice,
  getOriginalPrice,
  resolveProductImage,
} from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";

export default function QuickViewDialog() {
  const product = useShopStore((s) => s.quickViewProduct);
  const closeQuickView = useShopStore((s) => s.closeQuickView);
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const wishlist = useShopStore((s) => s.wishlist);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("Standard");

  useEffect(() => {
    setQuantity(1);
    setSelectedVariant("Standard");
  }, [product?.id]);

  // Open / close native modal dialog in top layer
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (product) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [product]);

  // Mandatory light-dismiss fallback for browsers without <dialog closedby="any"> support (e.g., Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      closeQuickView();
    };
    dialog.addEventListener("close", handleClose);

    let handleBackdropClick: ((event: MouseEvent) => void) | null = null;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (handleBackdropClick) {
        dialog.removeEventListener("click", handleBackdropClick);
      }
    };
  }, [closeQuickView]);

  const isWishlisted = product
    ? wishlist.some((w) => w.id === product.id)
    : false;

  const variants = product?.category?.name?.toLowerCase().includes("shoe")
    ? ["US 8", "US 9", "US 10", "US 11"]
    : product?.category?.name?.toLowerCase().includes("fashion")
    ? ["S", "M", "L", "XL"]
    : ["Standard", "Pro Bundle"];

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as any)}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-3xl bg-white p-0 text-slate-900 shadow-2xl border border-slate-200/80 overflow-hidden"
    >
      {product && (
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Visual */}
          <div className="relative bg-slate-100 aspect-square md:aspect-auto md:min-h-105">
            <img
              src={resolveProductImage(product)}
              alt={product.name}
              fetchPriority="low"
              width={600}
              height={600}
              className="w-full h-full object-cover"
            />
            {getDiscountPercent(product) > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-sm">
                Save {getDiscountPercent(product)}%
              </span>
            )}
          </div>

          {/* Right: Details */}
          <div className="p-6 sm:p-7 flex flex-col justify-between max-h-[82vh] overflow-y-auto">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {product.category?.name || "Featured Drop"}
                </span>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  aria-label="Close quick view"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <h2
                id={titleId}
                className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3 leading-tight"
              >
                {product.name}
              </h2>

              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  {(Number(product.rating) || 4.8).toFixed(1)} Rating
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={`font-semibold ${
                    product.stock > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-extrabold text-slate-900">
                  ${getEffectivePrice(product).toFixed(2)}
                </span>
                {getOriginalPrice(product) && (
                  <span className="text-base text-slate-400 line-through font-medium">
                    ${getOriginalPrice(product)!.toFixed(2)}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 leading-relaxed mt-3">
                {product.description ||
                  "Crafted with premium materials and backed by Blue Panda's 100% authenticity & satisfaction guarantee."}
              </p>

              {/* Variant Selector */}
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Option:{" "}
                  <span className="text-blue-600">{selectedVariant}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        selectedVariant === v
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Add */}
              <div className="flex items-center gap-3 mt-6">
                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-slate-700 transition cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-sm font-bold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(Math.max(1, product.stock || 99), q + 1)
                      )
                    }
                    aria-label="Increase quantity"
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white text-slate-700 transition cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={product.stock <= 0}
                  onClick={() => {
                    addToCart(product, quantity, selectedVariant, true);
                    dialogRef.current?.close();
                  }}
                  className="flex-1 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  Add to Bag
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label="Toggle wishlist"
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition cursor-pointer ${
                    isWishlisted
                      ? "bg-rose-50 border-rose-200 text-rose-500"
                      : "border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-500"
                  }`}
                >
                  <Heart
                    size={18}
                    className={isWishlisted ? "fill-current" : ""}
                  />
                </button>
              </div>
            </div>

            {/* Footer Perks + Full Link */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Truck size={14} className="text-blue-600 shrink-0" />
                  Free delivery $100+
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  100% Authentic
                </span>
              </div>

              <Link
                href={`/product/${product.id}`}
                onClick={() => dialogRef.current?.close()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View full specifications & customer reviews
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
