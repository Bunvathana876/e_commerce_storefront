import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEffectivePrice } from "../store-catalog.ts";

// Helper function implementing homepage discovery filter logic
function filterAndSortProducts(products, {
  category = "all",
  priceRange = "all",
  minRating = 0,
  inStockOnly = false,
  sortBy = "featured",
}) {
  let list = [...products];

  if (category !== "all") {
    list = list.filter(
      (p) =>
        p.category?.name?.toLowerCase() === category.toLowerCase() ||
        String(p.category_id) === category
    );
  }

  if (priceRange === "under-50") {
    list = list.filter((p) => getEffectivePrice(p) < 50);
  } else if (priceRange === "50-100") {
    list = list.filter((p) => {
      const price = getEffectivePrice(p);
      return price >= 50 && price <= 100;
    });
  } else if (priceRange === "over-100") {
    list = list.filter((p) => getEffectivePrice(p) > 100);
  }

  if (minRating > 0) {
    list = list.filter((p) => Number(p.rating || 0) >= minRating);
  }

  if (inStockOnly) {
    list = list.filter((p) => p.stock > 0);
  }

  if (sortBy === "price-asc") {
    list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
  } else if (sortBy === "price-desc") {
    list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
  } else if (sortBy === "rating") {
    list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }

  return list;
}

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 120,
    stock: 15,
    rating: 4.8,
    category: { id: 10, name: "Electronics" },
    category_id: 10,
  },
  {
    id: 2,
    name: "Cotton T-Shirt",
    price: 25,
    stock: 50,
    rating: 4.2,
    category: { id: 20, name: "Clothing" },
    category_id: 20,
  },
  {
    id: 3,
    name: "Premium Coffee Beans",
    price: 35,
    discount_price: 28,
    stock: 0, // out of stock
    rating: 4.9,
    category: { id: 30, name: "Groceries" },
    category_id: 30,
  },
  {
    id: 4,
    name: "Running Shoes",
    price: 95,
    stock: 8,
    rating: 3.8,
    category: { id: 40, name: "Footwear" },
    category_id: 40,
  },
  {
    id: 5,
    name: "Bluetooth Speaker",
    price: 75,
    discount_price: 60,
    stock: 20,
    rating: 4.5,
    category: { id: 10, name: "Electronics" },
    category_id: 10,
  },
];

describe("Storefront Homepage Discovery & Filter Controls", () => {
  it("1. Returns all products when default filters are active", () => {
    const result = filterAndSortProducts(SAMPLE_PRODUCTS, {});
    assert.equal(result.length, 5);
  });

  it("2. Filters products accurately by category name (case-insensitive)", () => {
    const electronics = filterAndSortProducts(SAMPLE_PRODUCTS, { category: "electronics" });
    assert.equal(electronics.length, 2);
    assert.ok(electronics.every((p) => p.category.name === "Electronics"));

    const clothing = filterAndSortProducts(SAMPLE_PRODUCTS, { category: "Clothing" });
    assert.equal(clothing.length, 1);
    assert.equal(clothing[0].name, "Cotton T-Shirt");
  });

  it("3. Filters products by price range based on effective price", () => {
    const under50 = filterAndSortProducts(SAMPLE_PRODUCTS, { priceRange: "under-50" });
    // Cotton T-Shirt ($25) and Coffee Beans (discount_price: $28)
    assert.equal(under50.length, 2);
    assert.ok(under50.some((p) => p.id === 2));
    assert.ok(under50.some((p) => p.id === 3));

    const range50to100 = filterAndSortProducts(SAMPLE_PRODUCTS, { priceRange: "50-100" });
    // Running Shoes ($95) and Bluetooth Speaker (effective $60)
    assert.equal(range50to100.length, 2);
    assert.ok(range50to100.some((p) => p.id === 4));
    assert.ok(range50to100.some((p) => p.id === 5));

    const over100 = filterAndSortProducts(SAMPLE_PRODUCTS, { priceRange: "over-100" });
    // Wireless Headphones ($120)
    assert.equal(over100.length, 1);
    assert.equal(over100[0].id, 1);
  });

  it("4. Filters products by minimum customer rating", () => {
    const fourStarAbove = filterAndSortProducts(SAMPLE_PRODUCTS, { minRating: 4.0 });
    assert.equal(fourStarAbove.length, 4); // excludes Running Shoes (3.8)
    assert.ok(fourStarAbove.every((p) => p.rating >= 4.0));
  });

  it("5. Filters out of stock products when inStockOnly is active", () => {
    const inStock = filterAndSortProducts(SAMPLE_PRODUCTS, { inStockOnly: true });
    assert.equal(inStock.length, 4);
    assert.ok(inStock.every((p) => p.stock > 0));
    assert.ok(!inStock.some((p) => p.id === 3)); // Coffee Beans has stock 0
  });

  it("6. Sorts products by price ascending, descending, and rating", () => {
    const priceAsc = filterAndSortProducts(SAMPLE_PRODUCTS, { sortBy: "price-asc" });
    assert.equal(priceAsc[0].id, 2); // $25
    assert.equal(priceAsc[priceAsc.length - 1].id, 1); // $120

    const priceDesc = filterAndSortProducts(SAMPLE_PRODUCTS, { sortBy: "price-desc" });
    assert.equal(priceDesc[0].id, 1); // $120
    assert.equal(priceDesc[priceDesc.length - 1].id, 2); // $25

    const ratingSort = filterAndSortProducts(SAMPLE_PRODUCTS, { sortBy: "rating" });
    assert.equal(ratingSort[0].rating, 4.9);
    assert.equal(ratingSort[ratingSort.length - 1].rating, 3.8);
  });

  it("7. Handles combination of multiple active filters correctly", () => {
    const combined = filterAndSortProducts(SAMPLE_PRODUCTS, {
      category: "Electronics",
      priceRange: "50-100",
      inStockOnly: true,
      minRating: 4.0,
      sortBy: "rating",
    });

    assert.equal(combined.length, 1);
    assert.equal(combined[0].name, "Bluetooth Speaker");
  });
});
