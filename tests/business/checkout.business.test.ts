import { describe, expect, it } from "vitest";
import { checkoutMessage } from "@/lib/price.controller";


describe("Business rule: checkout shows the discounted total", () => {
  it("shows full price under $100", () => {
    expect(checkoutMessage([{ price: 30, quantity: 3 }])).toBe("Total: $90.00");
  });

  it("shows 10% off at $100", () => {
    expect(checkoutMessage([{ price: 50, quantity: 2 }])).toBe("Total: $90.00");
  });
});
