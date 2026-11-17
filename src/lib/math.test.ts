import { describe, expect, it } from "vitest";
import { add, isEven } from "./math";

describe("add", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });
});

describe("isEven", () => {
  it("detects even and odd numbers", () => {
    expect(isEven(4)).toBe(true);
    expect(isEven(7)).toBe(false);
  });
});
