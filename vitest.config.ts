import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["convex/**/*.test.ts", "frontend/{shared,slices}/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["convex/_shared/**/*.ts", "frontend/shared/lib/**/*.ts"],
      // Anti-regression floor, set just under the 2026-06-11 baseline
      // (26.77% stmts / 27.59% branch / 21.18% funcs / 26.64% lines after
      // the bug-fix test batch). Ratchet upward as coverage grows; never
      // lower.
      thresholds: {
        statements: 26,
        branches: 26,
        functions: 21,
        lines: 26,
      },
    },
  },
});
