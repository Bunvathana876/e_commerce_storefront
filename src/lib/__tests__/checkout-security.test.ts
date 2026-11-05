import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ApiCart, ApiOrder, ApiResponse } from "../api";
import {
  CHECKOUT_PAYMENT_METHODS,
  createCheckoutSubmissionLock,
  DEFAULT_CHECKOUT_PAYMENT_METHOD,
  executeCheckoutOrder,
  getOrderPaymentPresentation,
  normalizeServerConfirmedOrder,
  validateCouponServerOnly,
} from "../checkout-security";
import { validateCouponLocally } from "../store-catalog";

function buildServerOrder(overrides: Partial<ApiOrder> = {}): ApiOrder {
  return {
    id: 402,
    user_id: 7,
    status: "pending",
    subtotal: "48.00",
    discount_amount: "0.00",
    coupon_code: null,
    shipping_fee: "2.00",
    total: "50.00",
    payment_method: "Cash on Delivery",
    payment_status: "pending",
    shipping_address: "Sokha, +85512345678, St 2004, Phnom Penh",
    created_at: "2026-10-31T06:00:00Z",
    updated_at: "2026-10-31T06:00:00Z",
    items: [
      {
        id: 1,
        order_id: 402,
        product_id: 101,
        product_name: "Blue Panda Hoodie",
        price: "48.00",
        quantity: 1,
        subtotal: "48.00",
        created_at: "2026-10-31T06:00:00Z",
      },
    ],
    ...overrides,
  };
}

const EMPTY_CART_RESPONSE: ApiResponse<ApiCart> = {
  success: true,
  message: "OK",
  data: { items: [], total_items: 0, subtotal: 0 },
};

describe("Next.js Storefront Checkout, Order, Payment & Coupon Security", () => {
  it("1 & 2. Failed API or unauthenticated checkout never produces a confirmed order and keeps cart intact", async () => {
    let clientCartClearedCount = 0;
    const bagItems = [{ productId: 101, quantity: 2 }];

    // Case A: Network failure ("Failed to fetch") must NOT fall back to a local order
    await assert.rejects(
      () =>
        executeCheckoutOrder({
          lock: createCheckoutSubmissionLock(),
          isAuthenticated: true,
          items: bagItems,
          shippingAddress: "123 Norodom Blvd, Phnom Penh",
          paymentMethod: "Cash on Delivery",
          deps: {
            clearServerCart: async () => ({ success: true, message: "ok", data: null }),
            addServerCartItem: async () => EMPTY_CART_RESPONSE,
            createOrder: async () => {
              throw new TypeError("Failed to fetch");
            },
            clearClientCart: async () => {
              clientCartClearedCount += 1;
            },
          },
        }),
      /Unable to reach the server to place your order/
    );
    assert.equal(clientCartClearedCount, 0);
    assert.equal(bagItems.length, 1);

    // Case B: Backend 400 error (e.g. insufficient stock) keeps cart intact
    await assert.rejects(
      () =>
        executeCheckoutOrder({
          lock: createCheckoutSubmissionLock(),
          isAuthenticated: true,
          items: bagItems,
          shippingAddress: "123 Norodom Blvd, Phnom Penh",
          paymentMethod: "Cash on Delivery",
          deps: {
            clearServerCart: async () => ({ success: true, message: "ok", data: null }),
            addServerCartItem: async () => EMPTY_CART_RESPONSE,
            createOrder: async () => {
              throw new Error("Insufficient stock for Blue Panda Hoodie");
            },
            clearClientCart: async () => {
              clientCartClearedCount += 1;
            },
          },
        }),
      /Insufficient stock/
    );
    assert.equal(clientCartClearedCount, 0);

    // Case C: Unauthenticated guest user is rejected without fabricating a guest order
    await assert.rejects(
      () =>
        executeCheckoutOrder({
          lock: createCheckoutSubmissionLock(),
          isAuthenticated: false,
          items: bagItems,
          shippingAddress: "123 Norodom Blvd, Phnom Penh",
          paymentMethod: "Cash on Delivery",
          deps: {
            clearServerCart: async () => ({ success: true, message: "ok", data: null }),
            addServerCartItem: async () => EMPTY_CART_RESPONSE,
            createOrder: async () => ({
              success: true,
              message: "ok",
              data: buildServerOrder(),
            }),
            clearClientCart: async () => {
              clientCartClearedCount += 1;
            },
          },
        }),
      /Please sign in to place your order/
    );
    assert.equal(clientCartClearedCount, 0);

    // Case D: Invalid/missing server order ID is rejected
    assert.throws(
      () =>
        normalizeServerConfirmedOrder(
          {
            success: true,
            message: "ok",
            data: buildServerOrder({ id: 0 }),
          },
          "Cash on Delivery"
        ),
      /invalid order confirmation ID/i
    );
  });

  it("3. Duplicate checkout submissions are blocked while in flight", async () => {
    const lock = createCheckoutSubmissionLock();
    let createOrderCalls = 0;
    let releaseRequest!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    const runAttempt = () =>
      executeCheckoutOrder({
        lock,
        isAuthenticated: true,
        items: [{ productId: 101, quantity: 1 }],
        shippingAddress: "St 51, Phnom Penh",
        paymentMethod: "Cash on Delivery",
        deps: {
          clearServerCart: async () => ({ success: true, message: "ok", data: null }),
          addServerCartItem: async () => EMPTY_CART_RESPONSE,
          createOrder: async () => {
            createOrderCalls += 1;
            await gate;
            return {
              success: true,
              message: "Order created",
              data: buildServerOrder({ id: 777 }),
            };
          },
          clearClientCart: async () => {},
        },
      });

    const firstAttempt = runAttempt();
    const secondAttempt = runAttempt();

    const duplicateOutcome = await secondAttempt;
    assert.deepEqual(duplicateOutcome, { status: "duplicate_blocked" });

    releaseRequest();
    const firstOutcome = await firstAttempt;
    assert.equal(firstOutcome.status, "confirmed");
    assert.equal(createOrderCalls, 1);
  });

  it("4. Unverified payment methods are labeled DEMO and never marked paid", () => {
    assert.equal(DEFAULT_CHECKOUT_PAYMENT_METHOD, "Cash on Delivery");

    const codMethod = CHECKOUT_PAYMENT_METHODS.find(
      (m) => m.id === "Cash on Delivery"
    );
    assert.ok(codMethod);
    assert.equal(codMethod.isDemo, false);
    assert.equal(codMethod.badge, null);

    for (const demoId of [
      "KHQR Scan & Pay",
      "Credit / Debit Card",
      "Apple Pay",
    ]) {
      const method = CHECKOUT_PAYMENT_METHODS.find((m) => m.id === demoId);
      assert.ok(method, `Missing method ${demoId}`);
      assert.equal(method.isDemo, true);
      assert.equal(method.badge, "DEMO");

      // Even if an untrusted payload claimed payment_status="paid", client normalizes to pending
      const normalized = normalizeServerConfirmedOrder(
        {
          success: true,
          message: "ok",
          data: buildServerOrder({
            id: 501,
            payment_method: demoId,
            payment_status: "paid",
          }),
        },
        demoId
      );
      assert.equal(normalized.payment_status, "pending");

      const meta = getOrderPaymentPresentation(normalized);
      assert.equal(meta.isPaid, false);
      assert.equal(meta.paymentStatusLabel, "Pending Verification");
      assert.equal(meta.totalLabel, "Order Total");
    }
  });

  it("5. Invalid or unavailable backend coupons are rejected without local fallback", async () => {
    // Network failure must NOT fall back to local WELCOME10
    await assert.rejects(
      () =>
        validateCouponServerOnly({
          code: "WELCOME10",
          subtotal: 100,
          validateApi: async () => {
            throw new TypeError("Failed to fetch");
          },
        }),
      /Unable to verify promo code right now/
    );

    // Backend valid=false response is rejected
    await assert.rejects(
      () =>
        validateCouponServerOnly({
          code: "EXPIRED50",
          subtotal: 100,
          validateApi: async () => ({
            success: true,
            message: "ok",
            data: {
              valid: false,
              code: "EXPIRED50",
              discount_type: "percent",
              discount_value: 50,
              discount_amount: 0,
              new_subtotal: 100,
              message: "Coupon has expired",
            },
          }),
        }),
      /Coupon has expired/
    );

    // Direct call to validateCouponLocally without explicit demo flag is blocked
    assert.throws(
      () => validateCouponLocally("WELCOME10", 100),
      /Unable to verify promo code right now/
    );

    // Explicit isolated demo mode still works when deliberately opted in for tests
    const isolatedDemo = validateCouponLocally("WELCOME10", 100, undefined, {
      allowDemoMode: true,
    });
    assert.equal(isolatedDemo.valid, true);
    assert.equal(isolatedDemo.discountAmount, 10);
  });

  it("6. Real backend Cash on Delivery orders succeed and clear cart only after confirmation", async () => {
    let clientCartClearedCount = 0;

    const result = await executeCheckoutOrder({
      lock: createCheckoutSubmissionLock(),
      isAuthenticated: true,
      items: [{ productId: 101, quantity: 1 }],
      shippingAddress: "Sokha, +85512345678, St 2004, Phnom Penh",
      paymentMethod: "Cash on Delivery",
      phone: "+85512345678",
      fullName: "Sokha",
      deps: {
        clearServerCart: async () => ({ success: true, message: "ok", data: null }),
        addServerCartItem: async () => EMPTY_CART_RESPONSE,
        createOrder: async (payload) => {
          assert.equal(payload.payment_method, "Cash on Delivery");
          return {
            success: true,
            message: "Order placed successfully",
            data: buildServerOrder({
              id: 888,
              status: "pending",
              payment_method: "Cash on Delivery",
              payment_status: "pending",
            }),
          };
        },
        clearClientCart: async () => {
          clientCartClearedCount += 1;
        },
      },
    });

    assert.equal(result.status, "confirmed");
    if (result.status === "confirmed") {
      assert.equal(result.order.id, 888);
      assert.equal(result.order.status, "pending");
      assert.equal(result.order.payment_status, "pending");

      const meta = getOrderPaymentPresentation(result.order);
      assert.equal(meta.isPaid, false);
      assert.equal(meta.orderStatusLabel, "Pending");
      assert.equal(meta.paymentStatusLabel, "Unpaid (Cash on Delivery)");
      assert.equal(meta.totalLabel, "Order Total");
    }
    assert.equal(clientCartClearedCount, 1);
  });
});
