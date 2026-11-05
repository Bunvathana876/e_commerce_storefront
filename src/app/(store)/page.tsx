"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FilterX,
  Grid2X2,
  PackageOpen,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import {
  API_BASE_URL,
  categoriesApi,
  productsApi,
  type ApiCategory,
  type ApiProduct,
} from "@/lib/api";
import {
  getDiscountPercent,
  getEffectivePrice,
  resolveProductImage,
} from "@/lib/store-catalog";
import CategoryCard from "@/components/store/CategoryCard";
import FilterToolbar from "@/components/store/FilterToolbar";
import { PrimaryButton } from "@/components/store/PrimaryButton";
import ProductGrid from "@/components/store/ProductGrid";
import PromoHero from "@/components/store/PromoHero";

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveCategoryImage(image?: string | null): string | null {
  const value = image?.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/uploads") || value.startsWith("uploads/")) {
    return `${BACKEND_ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
  }
  if (value.startsWith("/")) return value;
  return null;
}

function SectionHeader({
  eyebrow,
  title,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div>
        <p className="text-xs font-bold tracking-wider uppercase text-blue-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h2>
      </div>
      {href && action && (
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 transition"
        >
          {action} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

export default function StoreHomePage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Discovery / Filter toolbar state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("featured");

  const loadHomepage = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    const [productResult, categoryResult] = await Promise.allSettled([
      productsApi.list({ limit: 40 }),
      categoriesApi.list(true),
    ]);
    let requestFailed = false;

    if (productResult.status === "fulfilled") {
      setProducts(
        (productResult.value.data?.items ?? []).filter(
          (product) => product.is_active !== false
        )
      );
    } else {
      setProducts([]);
      requestFailed = true;
    }

    if (categoryResult.status === "fulfilled") {
      setCategories(categoryResult.value.data ?? []);
    } else {
      setCategories([]);
      requestFailed = true;
    }

    if (requestFailed) {
      setLoadError(
        "Some store content could not be loaded. Check your connection and try again."
      );
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadHomepage();
  }, [loadHomepage]);

  const availableCategories = useMemo(() => {
    if (categories.length > 0) return categories;

    const fromProducts = new Map<number, ApiCategory>();
    products.forEach((product) => {
      if (product.category) fromProducts.set(product.category.id, product.category);
    });
    return Array.from(fromProducts.values());
  }, [categories, products]);

  const heroProduct = useMemo(
    () => products.find((product) => product.stock > 0) ?? products[0] ?? null,
    [products]
  );

  const isFiltered = useMemo(() => {
    return (
      selectedCategory !== "all" ||
      priceRange !== "all" ||
      minRating > 0 ||
      inStockOnly ||
      sortBy !== "featured"
    );
  }, [selectedCategory, priceRange, minRating, inStockOnly, sortBy]);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory("all");
    setPriceRange("all");
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("featured");
  }, []);

  // Filtered products based on user discovery selections
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // 1. Category
    if (selectedCategory !== "all") {
      list = list.filter(
        (p) =>
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          String(p.category_id) === selectedCategory
      );
    }

    // 2. Price Range
    if (priceRange === "under-50") {
      list = list.filter((p) => getEffectivePrice(p) < 50);
    } else if (priceRange === "50-100") {
      list = list.filter((p) => {
        const price = getEffectivePrice(p);
        return price >= 50 && price <= 100;
      });
    } else if (priceRange === "over-100") {
      list = list.filter((p) => getEffectivePrice(p) > 100);
    }

    // 3. Rating
    if (minRating > 0) {
      list = list.filter((p) => Number(p.rating || 0) >= minRating);
    }

    // 4. In Stock
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    // 5. Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === "rating") {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    }

    return list;
  }, [products, selectedCategory, priceRange, minRating, inStockOnly, sortBy]);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

  const electronicsProducts = useMemo(
    () =>
      products
        .filter((product) => /electr|tech|audio|gadget/i.test(product.category?.name ?? ""))
        .sort((a, b) => Number(b.rating) - Number(a.rating))
        .slice(0, 4),
    [products]
  );

  const discountedProducts = useMemo(
    () =>
      products
        .filter((product) => getDiscountPercent(product) > 0)
        .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
        .slice(0, 4),
    [products]
  );

  return (
    <div className="pb-16 sm:pb-24">
      {/* Step 4: Editorial Hero Banner */}
      <PromoHero product={heroProduct} isLoading={isLoading} />

      {loadError && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{loadError}</span>
            <PrimaryButton
              type="button"
              variant="secondary"
              onClick={() => void loadHomepage()}
              className="border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-900"
            >
              <RefreshCw size={15} /> Retry
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Step 5: Filter Toolbar (Pill-shaped Discovery Bar) */}
      <FilterToolbar
        categories={availableCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        priceRange={priceRange}
        onSelectPriceRange={setPriceRange}
        minRating={minRating}
        onSelectMinRating={setMinRating}
        inStockOnly={inStockOnly}
        onToggleInStockOnly={() => setInStockOnly((prev) => !prev)}
        sortBy={sortBy}
        onSelectSortBy={setSortBy}
        totalResults={filteredProducts.length}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
      />

      {/* When filters are actively applied */}
      {isFiltered ? (
        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-blue-700">Filtered Catalog</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Products for You
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <RotateCcw size={13} /> Clear filters
            </button>
          </div>

          {filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <FilterX size={38} className="mx-auto text-slate-300" />
              <h3 className="mt-4 text-base font-bold text-slate-900">
                No products match your filters
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
                Try clearing or adjusting your price, category, or rating options to find what you&apos;re looking for.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600 hover:border-blue-600"
              >
                <RotateCcw size={14} /> Reset Filters
              </button>
            </div>
          )}
        </section>
      ) : (
        /* Standard Curated Storefront View */
        <>
          {/* Step 6: Featured Products Section */}
          <section className="mx-auto mt-12 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Curated for you"
              title="Featured Products"
              href="/shop"
              action="View all items"
            />

            {isLoading ? (
              <ProductGrid isLoading skeletonCount={8} />
            ) : featuredProducts.length > 0 ? (
              <ProductGrid products={featuredProducts} />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <PackageOpen size={34} className="mx-auto text-slate-300" />
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  No products are available yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Please try again later or refresh the catalog.
                </p>
                <PrimaryButton
                  type="button"
                  variant="secondary"
                  onClick={() => void loadHomepage()}
                  className="mt-5"
                >
                  <RefreshCw size={15} /> Refresh
                </PrimaryButton>
              </div>
            )}
          </section>

          {/* Browse Categories Section */}
          <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Shop your way"
              title="Browse Categories"
              href="/categories"
              action="View all"
            />

            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-4/3 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : availableCategories.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {availableCategories.slice(0, 6).map((category) => {
                  const categoryProduct = products.find(
                    (product) =>
                      product.category_id === category.id || product.category?.id === category.id
                  );
                  const categoryImage = resolveCategoryImage(category.image);
                  const image = categoryImage
                    ? categoryImage
                    : categoryProduct
                    ? resolveProductImage(categoryProduct)
                    : null;

                  return <CategoryCard key={category.id} category={category} image={image} />;
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <Grid2X2 size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Categories are not available right now.
                </p>
              </div>
            )}
          </section>

          {/* Deals & Promotions Section */}
          {!isLoading && discountedProducts.length > 0 && (
            <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
              <SectionHeader
                eyebrow="Special offers"
                title="Deals of the Week"
                href="/deals"
                action="Explore deals"
              />
              <ProductGrid products={discountedProducts} />
            </section>
          )}

          {/* Top Rated Electronics Section */}
          {!isLoading && electronicsProducts.length > 0 && (
            <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
              <SectionHeader
                eyebrow="Customer favorites"
                title="Popular Electronics"
                href="/shop?category=Electronics"
                action="Explore tech"
              />
              <ProductGrid products={electronicsProducts} />
            </section>
          )}
        </>
      )}

      {/* Shopping Reassurance & Trust Pillars Strip */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:mt-20 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-2xl border border-slate-200/90 bg-white sm:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Free Delivery over $100",
              description: "Enjoy complimentary standard shipping on eligible orders nationwide.",
            },
            {
              icon: ShieldCheck,
              title: "Buyer Protection Guarantee",
              description: "Authentic products and 30-day hassle-free return support.",
            },
            {
              icon: Sparkles,
              title: "Live Stock & Verified Sellers",
              description: "All products verified with real-time inventory and pricing.",
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex gap-4 p-5 sm:p-6 ${
                  index > 0 ? "border-t border-slate-200/90 sm:border-t-0 sm:border-l" : ""
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
