"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import type { ApiSeller } from "@/lib/api";
import { fetchStoreSellers, SHOWCASE_SELLERS } from "@/lib/store-catalog";

export default function OfficialStoresPage() {
  const [sellers, setSellers] = useState<ApiSeller[]>(SHOWCASE_SELLERS);

  useEffect(() => {
    fetchStoreSellers().then(setSellers);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-600">
          <ShieldCheck size={15} /> 100% Verified Merchants
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
          Official Partner Stores
        </h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Every Official Store on Blue Panda undergoes strict brand verification
          to guarantee genuine products, factory warranties, and fast dispatch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.map((seller) => (
          <div
            key={seller.id}
            className="bg-white rounded-[2rem] border border-slate-200/80 p-7 shadow-xs hover:shadow-xl transition flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-extrabold flex items-center justify-center shadow-lg shadow-blue-600/20">
                  {seller.name.charAt(0)}
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-extrabold">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  {Number(seller.rating || 4.9).toFixed(2)} Rating
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 mt-5 flex items-center gap-2">
                {seller.name}
                <ShieldCheck size={18} className="text-blue-600 shrink-0" />
              </h2>
              {seller.owner_name && (
                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                  Managed by {seller.owner_name}
                </p>
              )}

              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {seller.description ||
                  "Authorized official Blue Panda retailer delivering genuine products and responsive customer service."}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                {seller.address && (
                  <p className="flex items-center gap-2">
                    <MapPin size={13} className="text-blue-600 shrink-0" />
                    {seller.address}
                  </p>
                )}
                {seller.phone && (
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-blue-600 shrink-0" />
                    {seller.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1.5">
                <Store size={14} className="text-blue-600" />
                {seller.products_count || 5}+ Active Listings
              </span>
              <Link
                href={`/shop?seller=${seller.id}`}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
              >
                Shop Store <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
