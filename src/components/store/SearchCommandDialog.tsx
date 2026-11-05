"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Flame, Search, Sparkles, X } from "lucide-react";
import type { ApiProduct } from "@/lib/api";
import {
  fetchStoreProducts,
  getEffectivePrice,
  resolveProductImage,
  SHOWCASE_PRODUCTS,
} from "@/lib/store-catalog";
import { useShopStore } from "@/lib/store";

const TRENDING_TERMS = [
  "Air Max",
  "Headphones",
  "Apple Watch",
  "Hoodie",
  "Leather Wallet",
  "Botanical Oil",
];

export default function SearchCommandDialog() {
  const isOpen = useShopStore((s) => s.isSearchOpen);
  const closeSearch = useShopStore((s) => s.closeSearch);
  const openSearch = useShopStore((s) => s.openSearch);

  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<ApiProduct[]>(SHOWCASE_PRODUCTS);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) closeSearch();
        else openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Load live catalog once when opened
  useEffect(() => {
    if (!isOpen) return;
    fetchStoreProducts().then(({ products }) => setCatalog(products));
  }, [isOpen]);

  // Manage native top-layer <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      window.setTimeout(() => inputRef.current?.focus(), 40);
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Mandatory light-dismiss fallback for browsers without <dialog closedby="any">
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => closeSearch();
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
  }, [closeSearch]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog.slice(0, 6);
    return catalog
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category?.name || "").toLowerCase().includes(q) ||
          (p.seller?.name || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [catalog, query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dialogRef.current?.close();
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/shop");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as any)}
      aria-labelledby={titleId}
      className="mx-auto mt-12 sm:mt-20 w-[calc(100%-1.5rem)] max-w-2xl rounded-3xl bg-white p-0 text-slate-900 shadow-2xl border border-slate-200 overflow-hidden"
    >
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <h2 id={titleId} className="sr-only">
          Search Blue Panda Store
        </h2>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search size={20} className="absolute left-3.5 text-blue-600" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sneakers, headphones, streetwear, brands..."
            className="w-full pl-11 pr-20 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-12 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close search"
            className="ml-2 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 shrink-0 cursor-pointer"
          >
            <X size={16} />
          </button>
        </form>

        {/* Trending Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0">
            <Flame size={12} className="text-orange-500" />
            Popular:
          </span>
          {TRENDING_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-medium text-slate-600 shrink-0 transition cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-blue-600" />
            {query.trim() ? `Results for "${query}"` : "Recommended For You"}
          </p>
          <Link
            href={
              query.trim()
                ? `/shop?q=${encodeURIComponent(query.trim())}`
                : "/shop"
            }
            onClick={() => dialogRef.current?.close()}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            See all in Shop <ArrowRight size={12} />
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No products matched &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try searching for Shoes, Electronics, Jacket, or Watch.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {matches.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                onClick={() => dialogRef.current?.close()}
                className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition group"
              >
                <img
                  src={resolveProductImage(item)}
                  alt={item.name}
                  fetchPriority="low"
                  loading="lazy"
                  width={64}
                  height={64}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {item.category?.name || "Store"}
                  </p>
                  <p className="text-sm font-extrabold text-blue-600 mt-0.5">
                    ${getEffectivePrice(item).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
