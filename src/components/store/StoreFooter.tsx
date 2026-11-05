"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Headphones,
  RotateCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";

export default function StoreFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-20">
      {/* Perks Banner */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Express Delivery
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Free shipping on orders $100+
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                100% Authentic
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified official merchant stores
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                30-Day Easy Returns
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant exchange or full refund
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Headphones size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                24/7 Live Support
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dedicated customer concierge
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand Column */}
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <img
              src="/images/logo_panda_blue.png"
              alt="Blue Panda Logo"
              loading="lazy"
              width={44}
              height={44}
              className="w-11 h-11 rounded-2xl object-cover"
            />
            <div>
              <span className="text-xl font-extrabold text-white block leading-none">
                Blue<span className="text-blue-400">Panda</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Web & Mobile Marketplace
              </span>
            </div>
          </Link>

          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Your unified destination for flagship electronics, iconic sneakers,
            elevated streetwear, and clean botanicals — synced seamlessly across
            Web and our iOS & Android Flutter App.
          </p>

          <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">
                Synced with Blue Panda Mobile App
              </p>
              <p className="text-[11px] text-slate-400">
                One account for cart, wishlist & live order tracking
              </p>
            </div>
          </div>
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4">
            Shop Catalog
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <Link href="/shop" className="hover:text-white transition">
                All Products
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-white transition">
                Browse Categories
              </Link>
            </li>
            <li>
              <Link href="/deals" className="hover:text-white transition">
                Flash Deals & Vouchers
              </Link>
            </li>
            <li>
              <Link href="/stores" className="hover:text-white transition">
                Official Stores
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4">
            Customer Hub
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>
              <Link href="/orders" className="hover:text-white transition">
                Track My Order
              </Link>
            </li>
            <li>
              <Link href="/wishlist" className="hover:text-white transition">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-white transition">
                Account & Addresses
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition">
                Sign In / Register
              </Link>
            </li>
            <li>
              <a
                href={process.env.NEXT_PUBLIC_MANAGEMENT_URL || "http://localhost:3001"}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                Merchant & Admin Portal →
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white mb-4">
            VIP Drop Alerts
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Get early access to limited sneaker drops and private promo codes.
          </p>
          {subscribed ? (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} />
              Welcome to the VIP list!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                name="newsletter-email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                Join Free <Send size={13} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Blue Panda Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <CreditCard size={14} /> Visa • Mastercard • KHQR • Apple Pay • COD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
