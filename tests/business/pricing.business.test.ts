import { describe, expect, it } from "vitest";
import { orderTotal } from "@/lib/pricing.service";

describe("Business rule: bulk discount", () => {
  it("charges full price for orders under $100", () => {
    expect(orderTotal([{ price: 30, quantity: 3 }])).toBe(90);
  });

  it("gives 10% off orders of exactly $100", () => {
    expect(orderTotal([{ price: 50, quantity: 2 }])).toBe(90);
  });

  it("gives 10% off orders over $100", () => {
    expect(
      orderTotal([
        { price: 80, quantity: 1 },
        { price: 40, quantity: 2 },
      ]),
    ).toBe(144);
  });
});

describe("Business rule: invalid orders are rejected", () => {
  it("rejects a negative price", () => {
    expect(() => orderTotal([{ price: -5, quantity: 1 }])).toThrow();
  });

  it("charges nothing for an empty order", () => {
    expect(orderTotal([])).toBe(0);
  });
});
