import { describe, expect, it } from "vitest";
import { orderTotal, subtotal } from "@/lib/pricing.service";

describe("subtotal", () => {
  it("sums price x quantity across items", () => {
    expect(
      subtotal([
        { price: 2.5, quantity: 2 },
        { price: 1, quantity: 3 },
      ]),
    ).toBe(8);
  });

  it("throws on a negative quantity", () => {
    expect(() => subtotal([{ price: 1, quantity: -1 }])).toThrow();
  });
});

describe("orderTotal", () => {
  it("rounds the discounted total to cents", () => {
    expect(orderTotal([{ price: 111.11, quantity: 1 }])).toBe(100);
  });
});
