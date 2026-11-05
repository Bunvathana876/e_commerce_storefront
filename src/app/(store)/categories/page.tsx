"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { ApiCategory, ApiProduct } from "@/lib/api";
import {
  fetchStoreCategories,
  fetchStoreProducts,
  getCategoryVisualMeta,
  SHOWCASE_CATEGORIES,
  SHOWCASE_PRODUCTS,
} from "@/lib/store-catalog";

export default function CategoriesPage() {
  const [categories, setCategories] =
    useState<ApiCategory[]>(SHOWCASE_CATEGORIES);
  const [products, setProducts] = useState<ApiProduct[]>(SHOWCASE_PRODUCTS);

  useEffect(() => {
    fetchStoreCategories().then(setCategories);
    fetchStoreProducts().then(({ products: list }) => setProducts(list));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-600">
          <Layers size={14} /> Store Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
          Shop by Category
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Explore curated departments across performance footwear, studio audio,
          elevated streetwear, everyday carry, and clean skincare.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const meta = getCategoryVisualMeta(cat.name);
          const count = products.filter(
            (p) =>
              p.category_id === cat.id ||
              p.category?.name?.toLowerCase() === cat.name.toLowerCase()
          ).length;

          return (
            <Link
              key={cat.id}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="group relative h-80 rounded-[2rem] overflow-hidden bg-slate-950 shadow-md hover:shadow-2xl transition-all"
            >
              <img
                src={meta.coverImage}
                alt={cat.name}
                loading="lazy"
                width={600}
                height={500}
                className="w-full h-full object-cover opacity-80 group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold">
                    {meta.badge}
                  </span>
                  <span className="text-xs font-bold text-blue-300">
                    {count} {count === 1 ? "Product" : "Products"}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold group-hover:text-blue-300 transition-colors">
                  {cat.name}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {cat.description || meta.tagline}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white pt-1">
                  Explore {cat.name} <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
