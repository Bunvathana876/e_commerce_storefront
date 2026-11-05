"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Heart,
  MessageSquarePlus,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
  Zap,
} from "lucide-react";
import {
  reviewsApi,
  type ApiProduct,
  type ApiReview,
} from "@/lib/api";
import { getCurrentUser, isLoggedIn } from "@/lib/auth";
import {
  fetchStoreProductById,
  fetchStoreProducts,
  fetchStoreReviews,
  getDiscountPercent,
  getEffectivePrice,
  getOriginalPrice,
  resolveProductImage,
  SHOWCASE_PRODUCTS,
} from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";
import ProductCard from "@/components/store/ProductCard";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const numericId = Number(id) || 1;
  const router = useRouter();

  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const recordRecentlyViewed = useShopStore((s) => s.recordRecentlyViewed);
  const pushToast = useShopStore((s) => s.pushToast);
  const wishlist = useShopStore((s) => s.wishlist);

  const [product, setProduct] = useState<ApiProduct | null>(
    () => SHOWCASE_PRODUCTS.find((p) => p.id === numericId) || null
  );
  const [allProducts, setAllProducts] =
    useState<ApiProduct[]>(SHOWCASE_PRODUCTS);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(!product);

  const [selectedVariant, setSelectedVariant] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "reviews">(
    "overview"
  );
  const [zoomLens, setZoomLens] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchStoreProductById(numericId),
      fetchStoreProducts(),
      fetchStoreReviews(numericId),
    ]).then(([prodRes, listRes, revRes]) => {
      if (!active) return;
      if (prodRes.product) {
        setProduct(prodRes.product);
        recordRecentlyViewed(prodRes.product);
      }
      setAllProducts(listRes.products);
      setReviews(revRes);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [numericId, recordRecentlyViewed]);

  const variants = useMemo(() => {
    const cat = (product?.category?.name || "").toLowerCase();
    if (cat.includes("shoe") || cat.includes("sneaker")) {
      return ["US 7.5", "US 8", "US 9", "US 10", "US 11"];
    }
    if (cat.includes("fashion") || cat.includes("cloth")) {
      return ["Small (S)", "Medium (M)", "Large (L)", "X-Large (XL)"];
    }
    if (cat.includes("electr")) {
      return ["Midnight Black", "Platinum Silver", "Cobalt Edition"];
    }
    return ["Standard Edition", "Gift Box Edition"];
  }, [product?.category?.name]);

  useEffect(() => {
    if (variants.length > 0) setSelectedVariant(variants[0]);
  }, [variants]);

  const relatedProducts = useMemo(() => {
    if (!product) return allProducts.slice(0, 4);
    const sameCategory = allProducts.filter(
      (p) => p.category_id === product.category_id && p.id !== product.id
    );
    const others = allProducts.filter(
      (p) => p.category_id !== product.category_id && p.id !== product.id
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [product, allProducts]);

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Product Not Found
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          This item may have sold out or moved to another collection.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product);
  const originalPrice = getOriginalPrice(product);
  const discountPercent = getDiscountPercent(product);
  const isWishlisted = wishlist.some((w) => w.id === product.id);
  const rating = Number(product.rating) || 4.8;
  const outOfStock = product.stock <= 0;

  const handleBuyNow = async () => {
    await addToCart(product, quantity, selectedVariant, false);
    router.push("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setSubmittingReview(true);

    const currentUser = getCurrentUser();
    try {
      if (isLoggedIn()) {
        const res = await reviewsApi.create(product.id, {
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        if (res.data) {
          setReviews((prev) => [res.data, ...prev]);
        }
      } else {
        // Optimistic showcase review for guests
        const guestReview: ApiReview = {
          id: Date.now(),
          product_id: product.id,
          user_id: 0,
          rating: reviewRating,
          comment: reviewComment.trim(),
          status: "Approved",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 0,
            name: currentUser?.name || "Verified Guest Shopper",
            email: "guest@bluepanda.store",
            role: "customer",
            is_active: true,
            created_at: new Date().toISOString(),
          },
        };
        setReviews((prev) => [guestReview, ...prev]);
      }

      setReviewComment("");
      setReviewRating(5);
      pushToast({
        title: "Thank you for your review!",
        description: "Your feedback helps fellow Blue Panda shoppers.",
        tone: "success",
      });
    } catch (err: any) {
      pushToast({
        title: "Could not submit review",
        description: err?.message || "Please try again.",
        tone: "error",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto no-scrollbar"
      >
        <Link href="/" className="hover:text-blue-600 shrink-0">
          Home
        </Link>
        <ChevronRight size={13} className="shrink-0 text-slate-300" />
        <Link href="/shop" className="hover:text-blue-600 shrink-0">
          Shop
        </Link>
        {product.category?.name && (
          <>
            <ChevronRight size={13} className="shrink-0 text-slate-300" />
            <Link
              href={`/shop?category=${encodeURIComponent(
                product.category.name
              )}`}
              className="hover:text-blue-600 shrink-0"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={13} className="shrink-0 text-slate-300" />
        <span className="text-slate-900 font-bold truncate">
          {product.name}
        </span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Product Image Stage */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onClick={() => setZoomLens((z) => !z)}
            className="relative aspect-square rounded-[2rem] overflow-hidden bg-white border border-slate-200/80 shadow-sm cursor-zoom-in"
          >
            <img
              src={resolveProductImage(product)}
              alt={product.name}
              fetchPriority="high"
              width={900}
              height={900}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                zoomLens ? "scale-125" : "scale-100 hover:scale-105"
              }`}
            />

            {discountPercent > 0 && (
              <span className="absolute top-5 left-5 px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-xs font-extrabold shadow-md">
                -{discountPercent}% OFF
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product);
              }}
              aria-label="Save to wishlist"
              className={`absolute top-5 right-5 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition cursor-pointer ${
                isWishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-white/90 text-slate-700 hover:text-rose-500"
              }`}
            >
              <Heart size={20} className={isWishlisted ? "fill-current" : ""} />
            </button>

            <span className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-semibold">
              {zoomLens ? "Click to reset zoom" : "Click image to zoom"}
            </span>
          </div>
        </div>

        {/* Right: Buy Box */}
        <div className="lg:col-span-6 bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Category & Rating */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
              {product.category?.name || "Flagship Edition"}
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {rating.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className="text-slate-500 hover:text-blue-600 font-semibold cursor-pointer"
              >
                ({reviews.length} reviews)
              </button>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>
            {product.seller && (
              <Link
                href={`/shop?seller=${product.seller.id}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
              >
                <Store size={14} className="text-blue-600" />
                Sold & fulfilled by{" "}
                <span className="text-slate-800 underline decoration-slate-300">
                  {product.seller.name}
                </span>
                <ShieldCheck size={14} className="text-emerald-600" />
              </Link>
            )}
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-wrap items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                ${effectivePrice.toFixed(2)}
              </span>
              {originalPrice && (
                <span className="text-lg text-slate-400 line-through font-semibold">
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              {originalPrice && (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  You save ${(originalPrice - effectivePrice).toFixed(2)}
                </span>
              )}
            </div>

            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${
                outOfStock
                  ? "text-rose-600"
                  : product.stock <= 12
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              <Check size={14} />
              {outOfStock
                ? "Out of Stock"
                : `${product.stock} units ready to ship`}
            </span>
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description ||
              "Engineered with premium materials for everyday performance, comfort, and durability. Covered by Blue Panda's 30-day return guarantee."}
          </p>

          {/* Variant Selector */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2.5">
              <span className="font-extrabold uppercase tracking-wider text-slate-500">
                Select Option:{" "}
                <strong className="text-slate-900">{selectedVariant}</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedVariant === variant
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-xs"
                      : "border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + CTA Buttons */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white text-slate-700 transition cursor-pointer"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-extrabold">
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white text-slate-700 transition cursor-pointer"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => addToCart(product, quantity, selectedVariant)}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition cursor-pointer"
              >
                <ShoppingBag size={18} />
                Add to Bag • ${(effectivePrice * quantity).toFixed(2)}
              </button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Zap size={16} className="text-amber-400" />
              Express Buy Now
            </button>
          </div>

          {/* Delivery & Protection Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Truck size={17} className="text-blue-600 shrink-0" />
              <span>Free Shipping $100+</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <ShieldCheck size={17} className="text-emerald-600 shrink-0" />
              <span>1-Year Official Warranty</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <RotateCcw size={17} className="text-amber-600 shrink-0" />
              <span>30-Day Free Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Overview / Specs / Customer Reviews */}
      <section className="bg-white rounded-[2rem] border border-slate-200/80 p-6 sm:p-9 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "overview" as const, label: "Product Overview" },
            { id: "specs" as const, label: "Specifications & Care" },
            {
              id: "reviews" as const,
              label: `Verified Reviews (${reviews.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4 max-w-3xl text-sm text-slate-600 leading-relaxed">
            <p>
              {product.description ||
                "Designed for uncompromising daily performance and timeless visual appeal."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-xs font-extrabold uppercase text-blue-600 flex items-center gap-1.5">
                  <Sparkles size={14} /> Why Shoppers Love It
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  Rigorously inspected for genuine quality, sealed factory
                  packaging, and backed by instant customer concierge support.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-xs font-extrabold uppercase text-emerald-600 flex items-center gap-1.5">
                  <Truck size={14} /> Same-Day Dispatch
                </h3>
                <p className="text-xs text-slate-600 mt-1.5">
                  Orders placed before 4:00 PM dispatch the same day with live
                  step-by-step tracking on Web & Mobile App.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "specs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl text-sm">
            {[
              ["SKU", `BP-${String(product.id).padStart(4, "0")}`],
              ["Category", product.category?.name || "General"],
              [
                "Official Merchant",
                product.seller?.name || "Blue Panda Direct",
              ],
              ["Authenticity", "100% Verified Original"],
              ["Return Policy", "30 Days Unworn / Original Box"],
              ["Shipping Fee", "$2.00 Standard • FREE over $100"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <span className="text-xs font-bold text-slate-500">
                  {label}
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Existing Reviews */}
            <div className="lg:col-span-7 space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center">
                        {(rev.user?.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {rev.user?.name || "Verified Customer"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={13}
                          className={
                            idx < rev.rating ? "fill-amber-400" : "text-slate-300"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {rev.comment}
                  </p>
                  {rev.admin_reply && (
                    <div className="mt-2 p-3 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900">
                      <strong className="block mb-0.5">
                        Official Store Response:
                      </strong>
                      {rev.admin_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Write a Review Form */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleSubmitReview}
                className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4"
              >
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageSquarePlus size={16} className="text-blue-600" />
                  Write a Customer Review
                </h3>

                <div>
                  <span className="text-xs font-bold text-slate-600 block mb-1.5">
                    Your Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} stars`}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          size={22}
                          className={
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="text-xs font-bold text-slate-600 block mb-1.5"
                  >
                    Share your experience
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How is the fit, build quality, or sound?"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold transition cursor-pointer"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Related Products */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
              Complete Your Setup
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              You Might Also Like
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-extrabold text-blue-600 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
