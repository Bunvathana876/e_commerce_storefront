"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type { ApiCategory, ApiProduct, ApiSeller } from "@/lib/api";
import {
  fetchStoreCategories,
  fetchStoreProducts,
  fetchStoreSellers,
  getDiscountPercent,
  getEffectivePrice,
  SHOWCASE_CATEGORIES,
  SHOWCASE_PRODUCTS,
  SHOWCASE_SELLERS,
} from "@/lib/store-catalog";
import ProductCard from "@/components/store/ProductCard";

function ShopCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";
  const initialSeller = searchParams.get("seller") || "All";

  const [products, setProducts] = useState<ApiProduct[]>(SHOWCASE_PRODUCTS);
  const [categories, setCategories] =
    useState<ApiCategory[]>(SHOWCASE_CATEGORIES);
  const [sellers, setSellers] = useState<ApiSeller[]>(SHOWCASE_SELLERS);

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSeller, setSelectedSeller] = useState(initialSeller);
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRating, setMinRating] = useState(0);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL params when navigated from Navbar / Categories / Stores
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "All");
    setSelectedSeller(searchParams.get("seller") || "All");
  }, [searchParams]);

  useEffect(() => {
    fetchStoreProducts().then(({ products: list }) => setProducts(list));
    fetchStoreCategories().then(setCategories);
    fetchStoreSellers().then(setSellers);
  }, []);

  const highestCatalogPrice = useMemo(() => {
    const max = Math.max(...products.map((p) => getEffectivePrice(p)), 500);
    return Math.ceil(max / 50) * 50;
  }, [products]);

  useEffect(() => {
    setMaxPrice(highestCatalogPrice);
  }, [highestCatalogPrice]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = products.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.description || ""} ${
          p.category?.name || ""
        } ${p.seller?.name || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (selectedCategory !== "All") {
        const catMatch =
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          String(p.category_id) === selectedCategory;
        if (!catMatch) return false;
      }

      if (selectedSeller !== "All") {
        const sellerMatch =
          String(p.seller_id) === selectedSeller ||
          String(p.seller?.id) === selectedSeller;
        if (!sellerMatch) return false;
      }

      const price = getEffectivePrice(p);
      if (price > maxPrice) return false;

      if (minRating > 0 && (Number(p.rating) || 4.8) < minRating) return false;
      if (onlyDiscounted && getDiscountPercent(p) <= 0) return false;
      if (onlyInStock && p.stock <= 0) return false;

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === "price_asc")
        return getEffectivePrice(a) - getEffectivePrice(b);
      if (sortBy === "price_desc")
        return getEffectivePrice(b) - getEffectivePrice(a);
      if (sortBy === "rating")
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === "discount")
        return getDiscountPercent(b) - getDiscountPercent(a);
      return b.id - a.id;
    });
  }, [
    products,
    search,
    selectedCategory,
    selectedSeller,
    maxPrice,
    minRating,
    onlyDiscounted,
    onlyInStock,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedSeller("All");
    setMaxPrice(highestCatalogPrice);
    setMinRating(0);
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setSortBy("popular");
    router.replace("/shop");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedSeller !== "All" ||
    maxPrice < highestCatalogPrice ||
    minRating > 0 ||
    onlyDiscounted ||
    onlyInStock;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="rounded-3xl bg-slate-950 text-white p-7 sm:p-10 mb-8 relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
              Official Catalog
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold mt-1">
              Explore All Products
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
              Filter by category, verified store, rating, and budget to find
              your next favorite piece.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Shop Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-5 space-y-6 shadow-xs ${
            mobileFiltersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-blue-600" />
              Filters
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
              Categories
            </h3>
            <div className="space-y-1">
              {["All", ...categories.map((c) => c.name)].map((catName) => {
                const active =
                  selectedCategory.toLowerCase() === catName.toLowerCase();
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setSelectedCategory(catName)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{catName === "All" ? "All Categories" : catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Ceiling */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Max Price
              </h3>
              <span className="text-xs font-extrabold text-blue-600">
                Up to ${maxPrice}
              </span>
            </div>
            <input
              type="range"
              min={25}
              max={highestCatalogPrice}
              step={5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>$25</span>
              <span>${highestCatalogPrice}</span>
            </div>
          </div>

          {/* Official Store Filter */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Official Store
            </h3>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Verified Stores</option>
              {sellers.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Customer Rating
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[0, 4.5, 4.8].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMinRating(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1 transition cursor-pointer ${
                    minRating === r
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r === 0 ? (
                    "Any"
                  ) : (
                    <>
                      <Star
                        size={12}
                        className="fill-amber-400 text-amber-400"
                      />
                      {r}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Checkboxes */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyDiscounted}
                onChange={(e) => setOnlyDiscounted(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              On Sale / Discounted Only
            </label>
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              In Stock Ready to Ship
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="lg:col-span-9 space-y-5">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="lg:hidden px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                Showing{" "}
                <span className="text-blue-600">{filteredProducts.length}</span>{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="popular">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Savings</option>
              </select>

              <div className="hidden sm:inline-flex rounded-xl border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center">
              <p className="text-lg font-extrabold text-slate-900">
                No matching products found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Try broadening your price filter or clearing your search query.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} layout="list" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <ShopCatalogContent />
    </Suspense>
  );
}
