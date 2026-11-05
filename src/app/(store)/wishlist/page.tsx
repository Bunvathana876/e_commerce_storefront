"use client";

import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useShopStore } from "@/lib/store";
import ProductCard from "@/components/store/ProductCard";

export default function WishlistPage() {
  const wishlist = useShopStore((s) => s.wishlist);
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);

  const handleMoveAllToBag = async () => {
    for (const item of wishlist) {
      if (item.stock > 0) {
        await addToCart(item, 1, undefined, false);
      }
    }
    useShopStore.getState().openCart();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
            Saved Collection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            My Wishlist ({wishlist.length})
          </h1>
        </div>

        {wishlist.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleMoveAllToBag}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <ShoppingBag size={15} />
              Add All to Bag
            </button>
            <button
              type="button"
              onClick={() => {
                [...wishlist].forEach((p) => toggleWishlist(p));
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:border-rose-200 hover:text-rose-600 text-xs font-bold text-slate-600 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200/80 p-14 text-center max-w-xl mx-auto">
          <div className="w-18 h-18 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Your wishlist is empty
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Tap the heart icon on any product to save items you love and watch
            for price drops.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition"
          >
            Discover Products <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
