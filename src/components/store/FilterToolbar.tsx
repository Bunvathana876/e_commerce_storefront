"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, RotateCcw, SlidersHorizontal, Star } from "lucide-react";
import type { ApiCategory } from "@/lib/api";

export interface FilterToolbarProps {
  categories: ApiCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  priceRange: string;
  onSelectPriceRange: (range: string) => void;
  minRating: number;
  onSelectMinRating: (rating: number) => void;
  inStockOnly: boolean;
  onToggleInStockOnly: () => void;
  sortBy: string;
  onSelectSortBy: (sort: string) => void;
  totalResults: number;
  onResetFilters: () => void;
  isFiltered: boolean;
}

const PRICE_OPTIONS = [
  { value: "all", label: "All Prices" },
  { value: "under-50", label: "Under $50" },
  { value: "50-100", label: "$50 to $100" },
  { value: "over-100", label: "Over $100" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Customer Rating" },
];

export default function FilterToolbar({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onSelectPriceRange,
  minRating,
  onSelectMinRating,
  inStockOnly,
  onToggleInStockOnly,
  sortBy,
  onSelectSortBy,
  totalResults,
  onResetFilters,
  isFiltered,
}: FilterToolbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((current) => (current === name ? null : name));
  };

  const getPriceLabel = () => {
    const found = PRICE_OPTIONS.find((o) => o.value === priceRange);
    return found && found.value !== "all" ? found.label : "Price Range";
  };

  const getSortLabel = () => {
    const found = SORT_OPTIONS.find((o) => o.value === sortBy);
    return found ? found.label : "Sort by";
  };

  return (
    <div
      ref={toolbarRef}
      className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-label="Product discovery filters"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Horizontal scrollable pill filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <div className="mr-1 hidden items-center gap-1.5 text-xs font-bold text-slate-400 uppercase sm:inline-flex">
            <SlidersHorizontal size={14} className="text-slate-500" />
            <span>Filters:</span>
          </div>

          {/* 1. Category Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("category")}
              aria-expanded={openDropdown === "category"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                selectedCategory !== "all"
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span className="truncate max-w-28 sm:max-w-36">
                {selectedCategory === "all" ? "Category" : selectedCategory}
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  openDropdown === "category" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "category" && (
              <div className="absolute left-0 z-30 mt-2 max-h-64 w-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory("all");
                    setOpenDropdown(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                    selectedCategory === "all"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === "all" && <Check size={14} />}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      setOpenDropdown(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      selectedCategory === cat.name
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {selectedCategory === cat.name && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Price Range Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("price")}
              aria-expanded={openDropdown === "price"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                priceRange !== "all"
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span>{getPriceLabel()}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  openDropdown === "price" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "price" && (
              <div className="absolute left-0 z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSelectPriceRange(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      priceRange === opt.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {priceRange === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Customer Rating Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("rating")}
              aria-expanded={openDropdown === "rating"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                minRating > 0
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span>{minRating > 0 ? "4★ & Above" : "Rating"}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  openDropdown === "rating" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "rating" && (
              <div className="absolute left-0 z-30 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onSelectMinRating(0);
                    setOpenDropdown(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                    minRating === 0
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>All Ratings</span>
                  {minRating === 0 && <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMinRating(4);
                    setOpenDropdown(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                    minRating === 4
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    4★ &amp; Above
                  </span>
                  {minRating === 4 && <Check size={14} />}
                </button>
              </div>
            )}
          </div>

          {/* 4. In Stock Only Toggle Pill */}
          <button
            type="button"
            onClick={onToggleInStockOnly}
            aria-pressed={inStockOnly}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              inStockOnly
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <span>In Stock</span>
            {inStockOnly && <Check size={13} className="text-blue-600" />}
          </button>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right side: Sort by & result counter */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs font-semibold text-slate-500">
            {totalResults} {totalResults === 1 ? "product" : "products"}
          </span>

          {/* 5. Sort Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown("sort")}
              aria-expanded={openDropdown === "sort"}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="text-slate-400">Sort by:</span>
              <span className="font-bold text-slate-900">{getSortLabel()}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  openDropdown === "sort" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openDropdown === "sort" && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSelectSortBy(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      sortBy === opt.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
