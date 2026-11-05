import {
  API_BASE_URL,
  categoriesApi,
  couponsApi,
  productsApi,
  reviewsApi,
  sellersApi,
  type ApiCategory,
  type ApiCoupon,
  type ApiProduct,
  type ApiReview,
  type ApiSeller,
} from "./api";

const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const SEEDED_IMAGE_MAP: Record<string, string> = {
  "assets/images/products/nike_airmax.png":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/adidas_ultraboost.png":
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/puma_rsx.png":
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/new_balance.png":
    "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/sony_headphones.png":
    "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/apple_watch.png":
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/galaxy_buds.png":
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/denim_jacket.png":
    "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/fleece_hoodie.png":
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/chinos.png":
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/leather_wallet.png":
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=85",
  "assets/images/products/face_oil.png":
    "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85",
};

export function resolveProductImage(
  product?: Partial<ApiProduct> | null
): string {
  const raw = product?.image_url?.trim() || "";
  if (raw) {
    if (SEEDED_IMAGE_MAP[raw]) return SEEDED_IMAGE_MAP[raw];
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (raw.startsWith("/uploads") || raw.startsWith("uploads/")) {
      return `${BACKEND_ORIGIN}${raw.startsWith("/") ? raw : `/${raw}`}`;
    }
  }

  const name = (product?.name || "").toLowerCase();
  if (name.includes("nike") || name.includes("air max"))
    return SEEDED_IMAGE_MAP["assets/images/products/nike_airmax.png"];
  if (name.includes("adidas") || name.includes("ultraboost"))
    return SEEDED_IMAGE_MAP["assets/images/products/adidas_ultraboost.png"];
  if (name.includes("puma"))
    return SEEDED_IMAGE_MAP["assets/images/products/puma_rsx.png"];
  if (name.includes("new balance"))
    return SEEDED_IMAGE_MAP["assets/images/products/new_balance.png"];
  if (name.includes("headphone") || name.includes("sony"))
    return SEEDED_IMAGE_MAP["assets/images/products/sony_headphones.png"];
  if (name.includes("watch"))
    return SEEDED_IMAGE_MAP["assets/images/products/apple_watch.png"];
  if (name.includes("buds") || name.includes("earbud"))
    return SEEDED_IMAGE_MAP["assets/images/products/galaxy_buds.png"];
  if (name.includes("jacket") || name.includes("denim"))
    return SEEDED_IMAGE_MAP["assets/images/products/denim_jacket.png"];
  if (name.includes("hoodie") || name.includes("fleece"))
    return SEEDED_IMAGE_MAP["assets/images/products/fleece_hoodie.png"];
  if (name.includes("chino") || name.includes("pant"))
    return SEEDED_IMAGE_MAP["assets/images/products/chinos.png"];
  if (name.includes("wallet") || name.includes("leather"))
    return SEEDED_IMAGE_MAP["assets/images/products/leather_wallet.png"];
  if (name.includes("oil") || name.includes("serum") || name.includes("beauty"))
    return SEEDED_IMAGE_MAP["assets/images/products/face_oil.png"];

  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85";
}

export function getEffectivePrice(product: ApiProduct): number {
  const regular = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  return discount > 0 && discount < regular ? discount : regular;
}

export function getOriginalPrice(product: ApiProduct): number | null {
  const regular = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  return discount > 0 && discount < regular ? regular : null;
}

export function getDiscountPercent(product: ApiProduct): number {
  const regular = Number(product.price) || 0;
  const discount = Number(product.discount_price) || 0;
  if (discount > 0 && discount < regular) {
    return Math.round(((regular - discount) / regular) * 100);
  }
  return 0;
}

export interface CategoryVisualMeta {
  gradient: string;
  badge: string;
  coverImage: string;
  tagline: string;
}

export function getCategoryVisualMeta(name: string): CategoryVisualMeta {
  const lower = name.toLowerCase();
  if (lower.includes("shoe") || lower.includes("sneaker")) {
    return {
      gradient: "from-blue-600 via-indigo-600 to-cyan-500",
      badge: "Trending Footwear",
      coverImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
      tagline: "Performance runners, iconic streetwear trainers & daily kicks.",
    };
  }
  if (lower.includes("electr") || lower.includes("tech") || lower.includes("audio")) {
    return {
      gradient: "from-slate-900 via-blue-900 to-indigo-700",
      badge: "Flagship Tech",
      coverImage:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      tagline: "Noise-cancelling audio, smart wearables & next-gen gear.",
    };
  }
  if (lower.includes("fashion") || lower.includes("cloth") || lower.includes("apparel")) {
    return {
      gradient: "from-violet-600 via-purple-600 to-fuchsia-500",
      badge: "New Season",
      coverImage:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
      tagline: "Heavyweight essentials, tailored fits & urban layers.",
    };
  }
  if (lower.includes("access") || lower.includes("bag") || lower.includes("watch")) {
    return {
      gradient: "from-amber-500 via-orange-500 to-rose-500",
      badge: "Everyday Carry",
      coverImage:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
      tagline: "Full-grain leather goods, minimalist wallets & travel packs.",
    };
  }
  if (lower.includes("beauty") || lower.includes("skin")) {
    return {
      gradient: "from-emerald-500 via-teal-500 to-cyan-600",
      badge: "Clean Botanicals",
      coverImage:
        "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80",
      tagline: "Cold-pressed botanical oils, serums & daily glow rituals.",
    };
  }
  return {
    gradient: "from-blue-600 via-sky-600 to-teal-500",
    badge: "Curated Pick",
    coverImage:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    tagline: "Handpicked essentials backed by our authenticity guarantee.",
  };
}

export const SHOWCASE_CATEGORIES: ApiCategory[] = [
  {
    id: 1,
    name: "Shoes",
    description: "Running sneakers, casual trainers, and luxury footwear.",
    image: "assets/images/products/shoe.png",
    is_active: true,
  },
  {
    id: 2,
    name: "Electronics",
    description: "Smart gadgets, headphones, wearables, and audio gear.",
    image: "assets/images/products/headphone.png",
    is_active: true,
  },
  {
    id: 3,
    name: "Fashion",
    description: "Trendy apparel, streetwear, jackets, and everyday wear.",
    image: "assets/images/products/hoodie.png",
    is_active: true,
  },
  {
    id: 4,
    name: "Accessories",
    description: "Bags, wallets, watches, and smart accessories.",
    image: "assets/images/products/watch.png",
    is_active: true,
  },
  {
    id: 5,
    name: "Beauty",
    description: "Skincare, perfumes, organic oils, and cosmetics.",
    image: "assets/images/products/skincare.png",
    is_active: true,
  },
];

export const SHOWCASE_SELLERS: ApiSeller[] = [
  {
    id: 1,
    name: "TechGadgets Official Store",
    owner_name: "Alex Rivera",
    email: "seller@ecommerce.com",
    phone: "+855 12 999 001",
    address: "Building 4, Monivong Blvd, Phnom Penh",
    description:
      "Authorized retailer for premier tech accessories, studio audio, and smart electronics.",
    status: "Active",
    rating: 4.9,
    products_count: 6,
    orders_count: 428,
    total_revenue: 64200,
    created_at: "2026-01-15T08:00:00Z",
    updated_at: "2026-10-01T08:00:00Z",
  },
  {
    id: 2,
    name: "Urban Chic Boutique",
    owner_name: "Sarah Chen",
    email: "seller2@ecommerce.com",
    phone: "+855 12 999 002",
    address: "Norodom Blvd, BKK1, Phnom Penh",
    description:
      "Modern street fashion, heavyweight essentials, and curated lifestyle pieces.",
    status: "Active",
    rating: 4.85,
    products_count: 5,
    orders_count: 312,
    total_revenue: 29850,
    created_at: "2026-02-10T08:00:00Z",
    updated_at: "2026-10-01T08:00:00Z",
  },
  {
    id: 3,
    name: "Blue Panda Athletics Lab",
    owner_name: "Marcus Vance",
    email: "athletics@ecommerce.com",
    phone: "+855 12 888 108",
    address: "AEON Mall Sen Sok, Phnom Penh",
    description:
      "100% authenticity-verified performance footwear, limited-edition drops, and clean skincare.",
    status: "Active",
    rating: 4.95,
    products_count: 5,
    orders_count: 519,
    total_revenue: 78400,
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-10-01T08:00:00Z",
  },
];

export const SHOWCASE_PRODUCTS: ApiProduct[] = [
  {
    id: 1,
    category_id: 1,
    seller_id: 3,
    name: "Nike Air Max 270",
    description:
      "The Nike Air Max 270 delivers unmatched all-day comfort with a 32mm Max Air unit in the heel, breathable engineered mesh upper, and sleek running-inspired silhouette.",
    price: 159.99,
    discount_price: 134.99,
    stock: 25,
    rating: 4.85,
    image_url: "assets/images/products/nike_airmax.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[0],
    seller: SHOWCASE_SELLERS[2],
  },
  {
    id: 2,
    category_id: 2,
    seller_id: 1,
    name: "Sony WH-1000XM5 Wireless Headphones",
    description:
      "Industry-leading noise cancellation powered by dual processors and 8 adaptive microphones, 30-hour battery life with 3-minute quick charge, and featherlight soft-fit leather.",
    price: 399.99,
    discount_price: 339.99,
    stock: 15,
    rating: 4.95,
    image_url: "assets/images/products/sony_headphones.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[1],
    seller: SHOWCASE_SELLERS[0],
  },
  {
    id: 3,
    category_id: 2,
    seller_id: 1,
    name: "Apple Watch Series 9 GPS",
    description:
      "Powered by the S9 SiP with Double Tap gesture, 2000-nit Always-On Retina display, precision workout metrics, blood oxygen, and all-day health insights.",
    price: 399.0,
    discount_price: 369.0,
    stock: 12,
    rating: 4.9,
    image_url: "assets/images/products/apple_watch.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[1],
    seller: SHOWCASE_SELLERS[0],
  },
  {
    id: 4,
    category_id: 1,
    seller_id: 3,
    name: "Adidas Ultraboost Light",
    description:
      "Experience epic energy return with our lightest BOOST midsole ever made—30% lighter cushioning paired with a Primeknit+ FORGED upper for responsive support.",
    price: 189.99,
    discount_price: 159.99,
    stock: 18,
    rating: 4.75,
    image_url: "assets/images/products/adidas_ultraboost.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[0],
    seller: SHOWCASE_SELLERS[2],
  },
  {
    id: 5,
    category_id: 3,
    seller_id: 2,
    name: "Classic Vintage Denim Jacket",
    description:
      "Timeless relaxed-fit trucker denim jacket crafted from 14oz heavyweight washed organic cotton with brushed antique brass hardware and deep interior pockets.",
    price: 89.99,
    discount_price: 59.99,
    stock: 35,
    rating: 4.65,
    image_url: "assets/images/products/denim_jacket.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[2],
    seller: SHOWCASE_SELLERS[1],
  },
  {
    id: 6,
    category_id: 2,
    seller_id: 1,
    name: "Samsung Galaxy Buds2 Pro",
    description:
      "24-bit Hi-Fi lossless wireless audio with intelligent Active Noise Cancellation, 360 Audio head tracking, IPX7 water resistance, and ergonomic compact fit.",
    price: 229.99,
    discount_price: 169.99,
    stock: 20,
    rating: 4.7,
    image_url: "assets/images/products/galaxy_buds.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[1],
    seller: SHOWCASE_SELLERS[0],
  },
  {
    id: 7,
    category_id: 3,
    seller_id: 2,
    name: "Heavyweight Fleece Hoodie",
    description:
      "480GSM ultra-soft brushed French terry interior with a structured double-layered hood, dropped shoulders, and ribbed cuffs built to hold shape season after season.",
    price: 64.99,
    discount_price: 49.99,
    stock: 50,
    rating: 4.8,
    image_url: "assets/images/products/fleece_hoodie.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[2],
    seller: SHOWCASE_SELLERS[1],
  },
  {
    id: 8,
    category_id: 1,
    seller_id: 3,
    name: "New Balance 574 Legacy",
    description:
      "The most iconic New Balance heritage silhouette elevated with premium pigskin suede, breathable mesh underlays, and ENCAP midsole cushioning.",
    price: 99.99,
    discount_price: 84.99,
    stock: 40,
    rating: 4.7,
    image_url: "assets/images/products/new_balance.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[0],
    seller: SHOWCASE_SELLERS[2],
  },
  {
    id: 9,
    category_id: 4,
    seller_id: 2,
    name: "Minimalist Full-Grain Leather Wallet",
    description:
      "Ultra-slim bifold crafted from vegetable-tanned Italian top-grain leather with built-in RFID shielding, quick-access pull tab, and room for 8 cards + bills.",
    price: 48.0,
    discount_price: 35.0,
    stock: 60,
    rating: 4.85,
    image_url: "assets/images/products/leather_wallet.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[3],
    seller: SHOWCASE_SELLERS[1],
  },
  {
    id: 10,
    category_id: 5,
    seller_id: 3,
    name: "Organic Botanical Face Oil",
    description:
      "Cold-pressed nourishing facial elixir infused with wild rosehip, golden jojoba, sea buckthorn, and natural vitamin E for glass-skin barrier hydration.",
    price: 44.0,
    discount_price: 36.0,
    stock: 45,
    rating: 4.92,
    image_url: "assets/images/products/face_oil.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[4],
    seller: SHOWCASE_SELLERS[2],
  },
  {
    id: 11,
    category_id: 1,
    seller_id: 3,
    name: "Puma RS-X Efekt",
    description:
      "Progressive street aesthetic meets plush RS cushioning with sculpted nubuck overlays, breathable ripstop mesh, and high-traction rubber outsole.",
    price: 119.99,
    discount_price: null,
    stock: 30,
    rating: 4.55,
    image_url: "assets/images/products/puma_rsx.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[0],
    seller: SHOWCASE_SELLERS[2],
  },
  {
    id: 12,
    category_id: 3,
    seller_id: 2,
    name: "Modern Slim-Fit Chinos",
    description:
      "4-way comfort stretch organic cotton twill trousers featuring a clean tapered ankle cut, hidden zip security pocket, and wrinkle-resistant finish.",
    price: 54.99,
    discount_price: 39.99,
    stock: 28,
    rating: 4.5,
    image_url: "assets/images/products/chinos.png",
    is_active: true,
    category: SHOWCASE_CATEGORIES[2],
    seller: SHOWCASE_SELLERS[1],
  },
  {
    id: 13,
    category_id: 2,
    seller_id: 1,
    name: "Keychron Q1 Pro Wireless Mechanical Keyboard",
    description:
      "Full CNC machined 6063 aluminum body, double-gasket mount feel, hot-swappable tactile switches, PBT keycaps, and multi-device Bluetooth 5.1 + USB-C.",
    price: 199.0,
    discount_price: 174.0,
    stock: 9,
    rating: 4.9,
    image_url:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=85",
    is_active: true,
    category: SHOWCASE_CATEGORIES[1],
    seller: SHOWCASE_SELLERS[0],
  },
  {
    id: 14,
    category_id: 4,
    seller_id: 1,
    name: "Nomad Commuter Tech Backpack 24L",
    description:
      "Weatherproof Cordura ballistic nylon daypack with suspended 16-inch laptop vault, magneticFidlock sternum strap, and luggage pass-through.",
    price: 149.0,
    discount_price: 119.0,
    stock: 14,
    rating: 4.88,
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85",
    is_active: true,
    category: SHOWCASE_CATEGORIES[3],
    seller: SHOWCASE_SELLERS[0],
  },
];

export const SHOWCASE_COUPONS: ApiCoupon[] = [
  {
    id: 1,
    code: "WELCOME10",
    description: "10% off your entire order — no minimum spend",
    discount_type: "percent",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 100,
    is_active: true,
  },
  {
    id: 2,
    code: "SAVE20",
    description: "$20 instant discount on orders over $50",
    discount_type: "fixed",
    discount_value: 20,
    min_order_amount: 50,
    max_discount_amount: null,
    is_active: true,
  },
  {
    id: 3,
    code: "SUMMER15",
    description: "15% off seasonal drop on orders $30+",
    discount_type: "percent",
    discount_value: 15,
    min_order_amount: 30,
    max_discount_amount: 75,
    is_active: true,
  },
  {
    id: 4,
    code: "SUPER50",
    description: "$50 VIP savings on orders over $150",
    discount_type: "fixed",
    discount_value: 50,
    min_order_amount: 150,
    max_discount_amount: null,
    is_active: true,
  },
];

export const SHOWCASE_REVIEWS: ApiReview[] = [
  {
    id: 101,
    product_id: 1,
    user_id: 2,
    rating: 5,
    comment:
      "Unbelievable comfort right out of the box! Shipped to Phnom Penh in less than 24 hours and 100% authentic packaging.",
    status: "Approved",
    admin_reply:
      "Thank you for shopping with Blue Panda! Enjoy every step in your Air Max 270s!",
    created_at: "2026-10-18T10:20:00Z",
    updated_at: "2026-10-18T12:00:00Z",
    user: {
      id: 2,
      name: "Sophea Lim",
      email: "sophea@example.com",
      role: "customer",
      is_active: true,
      created_at: "2026-06-01T00:00:00Z",
    },
  },
  {
    id: 102,
    product_id: 2,
    user_id: 3,
    rating: 5,
    comment:
      "Noise cancellation completely silences coffee shop chatter and flights. Battery easily lasts my whole work week.",
    status: "Approved",
    created_at: "2026-10-21T14:40:00Z",
    updated_at: "2026-10-21T14:40:00Z",
    user: {
      id: 3,
      name: "David Vann",
      email: "david@example.com",
      role: "customer",
      is_active: true,
      created_at: "2026-07-12T00:00:00Z",
    },
  },
  {
    id: 103,
    product_id: 1,
    user_id: 4,
    rating: 4,
    comment:
      "True to size, super bouncy heel cushion, and the colorway pops even better in person.",
    status: "Approved",
    created_at: "2026-10-24T09:15:00Z",
    updated_at: "2026-10-24T09:15:00Z",
    user: {
      id: 4,
      name: "Nary Chan",
      email: "nary@example.com",
      role: "customer",
      is_active: true,
      created_at: "2026-08-03T00:00:00Z",
    },
  },
];

// ==========================================
// Resilient Dual-Mode Fetchers (Live API + Showcase Fallback)
// ==========================================
export async function fetchStoreProducts(): Promise<{
  products: ApiProduct[];
  isLiveBackend: boolean;
}> {
  try {
    const res = await productsApi.list({ limit: 100 });
    const items = (res.data?.items || []).filter((p) => p.is_active !== false);
    if (items.length > 0) {
      return { products: items, isLiveBackend: true };
    }
  } catch {
    // Graceful fallback when backend is offline
  }
  return { products: SHOWCASE_PRODUCTS, isLiveBackend: false };
}

export async function fetchStoreProductById(id: number): Promise<{
  product: ApiProduct | null;
  isLiveBackend: boolean;
}> {
  try {
    const res = await productsApi.get(id);
    if (res.data) {
      return { product: res.data, isLiveBackend: true };
    }
  } catch {
    // Graceful fallback to showcase catalog
  }
  const fallback = SHOWCASE_PRODUCTS.find((p) => p.id === id) || null;
  return { product: fallback, isLiveBackend: false };
}

export async function fetchStoreCategories(): Promise<ApiCategory[]> {
  try {
    const res = await categoriesApi.list(true);
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // Fallback
  }
  return SHOWCASE_CATEGORIES;
}

export async function fetchStoreSellers(): Promise<ApiSeller[]> {
  try {
    const res = await sellersApi.list({ status: "Active" });
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // Fallback
  }
  return SHOWCASE_SELLERS;
}

export async function fetchStoreCoupons(): Promise<ApiCoupon[]> {
  try {
    const res = await couponsApi.available();
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // Fallback
  }
  return SHOWCASE_COUPONS;
}

export async function fetchStoreReviews(productId: number): Promise<ApiReview[]> {
  try {
    const res = await reviewsApi.list({ product_id: productId });
    if (res.data && res.data.length > 0) return res.data;
  } catch {
    // Fallback
  }
  const matching = SHOWCASE_REVIEWS.filter((r) => r.product_id === productId);
  return matching.length > 0 ? matching : SHOWCASE_REVIEWS.slice(0, 2);
}

/**
 * Isolated demo/test coupon evaluator.
 * Requires explicit `options.allowDemoMode === true` or
 * `NEXT_PUBLIC_ENABLE_DEMO_COUPONS === "true"`. Never used as an automatic
 * fallback when backend coupon validation fails.
 */
export function validateCouponLocally(
  code: string,
  subtotal: number,
  coupons: ApiCoupon[] = SHOWCASE_COUPONS,
  options?: { allowDemoMode?: boolean }
): {
  valid: boolean;
  code: string;
  discountAmount: number;
  message: string;
} {
  const demoAllowed =
    options?.allowDemoMode === true ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_COUPONS === "true";
  if (!demoAllowed) {
    throw new Error(
      "Unable to verify promo code right now. Please check your connection and try again."
    );
  }
  const clean = code.trim().toUpperCase();
  const found = coupons.find((c) => c.code.toUpperCase() === clean && c.is_active);
  if (!found) {
    throw new Error(`Promo code '${clean}' is invalid or expired.`);
  }
  if (subtotal < Number(found.min_order_amount || 0)) {
    throw new Error(
      `Promo code '${clean}' requires a minimum subtotal of $${Number(
        found.min_order_amount
      ).toFixed(2)}.`
    );
  }
  let discount = 0;
  if (found.discount_type === "percent") {
    discount = (subtotal * Number(found.discount_value)) / 100;
    if (found.max_discount_amount && discount > Number(found.max_discount_amount)) {
      discount = Number(found.max_discount_amount);
    }
  } else {
    discount = Number(found.discount_value);
  }
  discount = Math.min(subtotal, Math.round(discount * 100) / 100);
  return {
    valid: true,
    code: found.code,
    discountAmount: discount,
    message: `Promo '${found.code}' applied! You saved $${discount.toFixed(2)}.`,
  };
}
