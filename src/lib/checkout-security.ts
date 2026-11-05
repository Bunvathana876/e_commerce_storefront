import type {
  ApiAddress,
  ApiCart,
  ApiCouponValidation,
  ApiOrder,
  ApiResponse,
} from "./api";

export const DEFAULT_CHECKOUT_PAYMENT_METHOD = "Cash on Delivery";

export interface CheckoutPaymentMethodMeta {
  id: string;
  title: string;
  subtitle: string;
  isDemo: boolean;
  badge: "DEMO" | null;
}

export const CHECKOUT_PAYMENT_METHODS: readonly CheckoutPaymentMethodMeta[] = [
  {
    id: "Cash on Delivery",
    title: "Cash on Delivery (COD)",
    subtitle: "Pay in cash when your parcel arrives",
    isDemo: false,
    badge: null,
  },
  {
    id: "KHQR Scan & Pay",
    title: "KHQR / Bakong Pay",
    subtitle: "Demo only — live KHQR verification is not integrated yet",
    isDemo: true,
    badge: "DEMO",
  },
  {
    id: "Credit / Debit Card",
    title: "Credit or Debit Card",
    subtitle: "Demo only — live card gateway is not integrated yet",
    isDemo: true,
    badge: "DEMO",
  },
  {
    id: "Apple Pay",
    title: "Apple Pay / Wallet",
    subtitle: "Demo only — live wallet authorization is not integrated yet",
    isDemo: true,
    badge: "DEMO",
  },
];

const UNVERIFIED_CLIENT_PAYMENT_METHODS = new Set([
  "cash on delivery",
  "cash on delivery (cod)",
  "cod",
  "credit / debit card",
  "credit or debit card",
  "card",
  "khqr scan & pay",
  "khqr",
  "apple pay",
]);

export function isUnverifiedPaymentMethod(method?: string | null): boolean {
  const normalized = (method || "").trim().toLowerCase();
  if (!normalized) return true;
  if (UNVERIFIED_CLIENT_PAYMENT_METHODS.has(normalized)) return true;
  return CHECKOUT_PAYMENT_METHODS.some(
    (pm) => pm.id.toLowerCase() === normalized && (pm.isDemo || pm.id === "Cash on Delivery")
  );
}

export function isNetworkTransportError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || "");
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("Load failed") ||
    msg.includes("ECONNREFUSED")
  );
}

export function toCheckoutErrorMessage(err: unknown): string {
  if (isNetworkTransportError(err)) {
    return "Unable to reach the server to place your order. Your shopping bag has been kept intact—please check your connection and try again.";
  }
  const msg = err instanceof Error ? err.message.trim() : "";
  return msg || "Could not complete your order. Please verify your details and try again.";
}

export function normalizeServerConfirmedOrder(
  response: ApiResponse<ApiOrder> | null | undefined,
  requestedPaymentMethod: string
): ApiOrder {
  if (!response || response.success === false || !response.data) {
    throw new Error(
      response?.message || "Order could not be confirmed by the server."
    );
  }

  const raw = response.data;
  const orderId = Number(raw.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("Server returned an invalid order confirmation ID.");
  }

  const resolvedMethod = (raw.payment_method || requestedPaymentMethod || "").trim() ||
    DEFAULT_CHECKOUT_PAYMENT_METHOD;
  const rawPaymentStatus = (raw.payment_status || "pending").trim().toLowerCase();

  // Never mark an order paid based solely on an unintegrated or COD client method.
  const safePaymentStatus =
    rawPaymentStatus === "paid" && isUnverifiedPaymentMethod(resolvedMethod)
      ? "pending"
      : rawPaymentStatus || "pending";

  return {
    ...raw,
    id: orderId,
    status: (raw.status || "pending").trim() || "pending",
    payment_method: resolvedMethod,
    payment_status: safePaymentStatus,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

export interface OrderPaymentPresentation {
  isPaid: boolean;
  orderStatusLabel: string;
  paymentStatusLabel: string;
  totalLabel: "Total Paid" | "Order Total";
}

function capitalizeWords(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function getOrderPaymentPresentation(
  order: Pick<ApiOrder, "status" | "payment_status" | "payment_method">
): OrderPaymentPresentation {
  const rawPaymentStatus = (order.payment_status || "pending").trim().toLowerCase();
  const method = (order.payment_method || "").trim();
  const isPaid = rawPaymentStatus === "paid" && !isUnverifiedPaymentMethod(method);

  let paymentStatusLabel = "Pending Verification";
  if (isPaid) {
    paymentStatusLabel = "Paid";
  } else if (rawPaymentStatus === "failed") {
    paymentStatusLabel = "Payment Failed";
  } else if (rawPaymentStatus === "refunded") {
    paymentStatusLabel = "Refunded";
  } else if (method.toLowerCase().includes("cash") || method.toLowerCase() === "cod") {
    paymentStatusLabel = "Unpaid (Cash on Delivery)";
  }

  return {
    isPaid,
    orderStatusLabel: capitalizeWords(order.status || "pending"),
    paymentStatusLabel,
    totalLabel: isPaid ? "Total Paid" : "Order Total",
  };
}

export interface CheckoutSubmissionLock {
  isLocked: () => boolean;
  acquire: () => boolean;
  release: () => void;
}

export function createCheckoutSubmissionLock(): CheckoutSubmissionLock {
  let inFlight = false;
  return {
    isLocked: () => inFlight,
    acquire: () => {
      if (inFlight) return false;
      inFlight = true;
      return true;
    },
    release: () => {
      inFlight = false;
    },
  };
}

export interface CheckoutCartLine {
  productId: number;
  quantity: number;
}

export interface ExecuteCheckoutParams {
  lock: CheckoutSubmissionLock;
  isAuthenticated: boolean;
  items: CheckoutCartLine[];
  shippingAddress: string;
  shippingAddressId?: number;
  newAddressToSave?: {
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    postal_code?: string;
    is_default?: boolean;
  };
  paymentMethod: string;
  phone?: string;
  fullName?: string;
  couponCode?: string | null;
  deps: {
    createAddress?: (data: {
      full_name: string;
      phone: string;
      address_line: string;
      city: string;
      postal_code?: string;
      is_default?: boolean;
    }) => Promise<ApiResponse<ApiAddress>>;
    clearServerCart: () => Promise<unknown>;
    addServerCartItem: (data: {
      product_id: number;
      quantity: number;
    }) => Promise<ApiResponse<ApiCart>>;
    createOrder: (data: {
      shipping_address?: string;
      shipping_address_id?: number;
      payment_method: string;
      phone?: string;
      full_name?: string;
      coupon_code?: string;
    }) => Promise<ApiResponse<ApiOrder>>;
    clearClientCart: () => Promise<void>;
  };
}

export type ExecuteCheckoutResult =
  | { status: "duplicate_blocked" }
  | { status: "confirmed"; order: ApiOrder };

export async function executeCheckoutOrder(
  params: ExecuteCheckoutParams
): Promise<ExecuteCheckoutResult> {
  if (!params.lock.acquire()) {
    return { status: "duplicate_blocked" };
  }

  try {
    if (params.items.length === 0) {
      throw new Error("Your shopping bag is empty.");
    }

    const trimmedAddress = params.shippingAddress.trim();
    if (!trimmedAddress) {
      throw new Error("Please complete your delivery address.");
    }

    if (!params.isAuthenticated) {
      throw new Error(
        "Please sign in to place your order. Guest checkout is not available."
      );
    }

    let addressIdToUse = params.shippingAddressId;
    if (!addressIdToUse && params.newAddressToSave && params.deps.createAddress) {
      try {
        const createdAddr = await params.deps.createAddress(params.newAddressToSave);
        addressIdToUse = createdAddr.data?.id;
      } catch {
        // Non-fatal: order creation still sends full shipping_address text.
      }
    }

    await params.deps.clearServerCart();
    for (const item of params.items) {
      await params.deps.addServerCartItem({
        product_id: item.productId,
        quantity: item.quantity,
      });
    }

    const orderRes = await params.deps.createOrder({
      shipping_address: trimmedAddress,
      shipping_address_id: addressIdToUse,
      payment_method: params.paymentMethod,
      phone: params.phone?.trim() || undefined,
      full_name: params.fullName?.trim() || undefined,
      coupon_code: params.couponCode?.trim() || undefined,
    });

    const confirmedOrder = normalizeServerConfirmedOrder(
      orderRes,
      params.paymentMethod
    );

    await params.deps.clearClientCart();
    return { status: "confirmed", order: confirmedOrder };
  } catch (err) {
    throw new Error(toCheckoutErrorMessage(err));
  } finally {
    params.lock.release();
  }
}

export interface VerifiedCouponResult {
  code: string;
  discountAmount: number;
  message: string;
}

export async function validateCouponServerOnly(params: {
  code: string;
  subtotal: number;
  validateApi: (data: {
    code: string;
    subtotal: number;
  }) => Promise<ApiResponse<ApiCouponValidation>>;
  allowDemoFallback?: boolean;
  demoValidator?: (
    code: string,
    subtotal: number
  ) => VerifiedCouponResult;
}): Promise<VerifiedCouponResult> {
  const clean = params.code.trim().toUpperCase();
  if (!clean) {
    throw new Error("Please enter a promo code.");
  }
  if (!Number.isFinite(params.subtotal) || params.subtotal <= 0) {
    throw new Error("Add items to your bag before applying a promo code.");
  }

  try {
    const res = await params.validateApi({
      code: clean,
      subtotal: params.subtotal,
    });

    if (!res || res.success === false || !res.data || res.data.valid !== true) {
      throw new Error(
        res?.data?.message || res?.message || "Invalid or expired promo code."
      );
    }

    const discountAmount = Number(res.data.discount_amount);
    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      throw new Error(
        res.data.message || "This promo code does not apply to your current bag."
      );
    }

    const verifiedCode = String(res.data.code || clean).trim().toUpperCase();
    return {
      code: verifiedCode,
      discountAmount,
      message: res.data.message || `Coupon '${verifiedCode}' applied.`,
    };
  } catch (err) {
    if (
      params.allowDemoFallback === true &&
      params.demoValidator &&
      isNetworkTransportError(err)
    ) {
      return params.demoValidator(clean, params.subtotal);
    }

    if (isNetworkTransportError(err)) {
      throw new Error(
        "Unable to verify promo code right now. Please check your connection and try again."
      );
    }

    throw err instanceof Error
      ? err
      : new Error("Invalid or expired promo code.");
  }
}
