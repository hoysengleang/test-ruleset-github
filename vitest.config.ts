import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text"],
      reportsDirectory: "coverage",
      // Count every source file, including ones with no tests (0%),
      // so the percentage is honest.
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
      // `npm run test:coverage` fails (and so does the CI "test" job)
      // when line coverage is below this percentage.
      // Current coverage is ~28%. Raise this as you add tests.
      thresholds: {
        lines: 25,
      },
    },
  },
});
