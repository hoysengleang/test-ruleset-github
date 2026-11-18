import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.{ts,tsx}"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "business",
          include: ["tests/business/**/*.test.{ts,tsx}"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      // skipFull: false = list every file, including ones at 100%.
      reporter: [["text", { skipFull: false }]],
      reportsDirectory: "coverage",
      // Unit coverage measures all of src/. Business coverage narrows this
      // to controllers and services only (see "test:business:coverage"
      // in package.json).
      include: ["src/**/*.{ts,tsx}"],
    },
  },
});
