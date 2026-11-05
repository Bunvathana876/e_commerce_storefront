import Link from "next/link";

export default function MinimalStoreFooter() {
  return (
    <footer className="mt-20 border-t border-[#e8eaed] bg-[#f5f6f8]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Blue Panda home">
            <img src="/images/logo_panda_blue.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg" />
            <span className="text-base font-bold tracking-tight text-[#17191f]">Blue Panda</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#737780]">
            Browse products, save favorites, and manage your bag in one place.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#17191f]">Shop</h2>
          <nav aria-label="Shop links" className="mt-3 flex flex-col items-start gap-2 text-sm text-[#737780]">
            <Link href="/shop" className="hover:text-blue-700">All products</Link>
            <Link href="/categories" className="hover:text-blue-700">Categories</Link>
            <Link href="/deals" className="hover:text-blue-700">Current deals</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#17191f]">Account</h2>
          <nav aria-label="Account links" className="mt-3 flex flex-col items-start gap-2 text-sm text-[#737780]">
            <Link href="/wishlist" className="hover:text-blue-700">Wishlist</Link>
            <Link href="/orders" className="hover:text-blue-700">Orders</Link>
            <Link href="/account" className="hover:text-blue-700">Account settings</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-[#e8eaed]">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-[#737780] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Blue Panda Marketplace.
        </div>
      </div>
    </footer>
  );
}
