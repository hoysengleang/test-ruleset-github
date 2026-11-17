import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // "cobertura" writes coverage/cobertura-coverage.xml, the format
      // GitHub's "Restrict code coverage" rule reads.
      reporter: ["text", "cobertura"],
      reportsDirectory: "coverage",
      // Count every source file, including ones with no tests (0%),
      // so the percentage is honest.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
