import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["convex/**/*.test.ts", "frontend/{shared,slices}/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Coverage denominator = every domain/dir that has co-located tests.
      // Keep this list in sync with where *.test.{ts,tsx} files actually live
      // so regressions in tested code trip the floor (was scoped to only
      // _shared + shared/lib, which silently excluded ~15 tested source files
      // — admin/webhooks, notifications, matcher, profile, engine, calendar,
      // data-table, branding/roadmap slices). Never list convex/_generated.
      include: [
        "convex/_shared/**/*.ts",
        "convex/admin/**/*.ts",
        "convex/notifications/**/*.ts",
        "convex/matcher/**/*.ts",
        "convex/profile/**/*.ts",
        "convex/engine/**/*.ts",
        "convex/calendar/**/*.ts",
        "frontend/shared/**/*.{ts,tsx}",
        "frontend/slices/personal-branding/**/*.{ts,tsx}",
        "frontend/slices/skill-roadmap/**/*.{ts,tsx}",
      ],
      // Anti-regression floor. Measured 2026-06-15 over the WIDENED include
      // set above (v8): 20.59% stmts (1155/5608) / 21.88% branch (864/3948) /
      // 17.15% funcs (192/1119) / 20.92% lines (1009/4822). The %% are lower
      // than the old narrow baseline (26/26/21/26) only because the
      // denominator grew ~5x to cover many untested UI files — the absolute
      // covered counts went UP. Floor set just under the new measured numbers.
      // Ratchet upward as coverage grows; never lower.
      thresholds: {
        statements: 20,
        branches: 21,
        functions: 16,
        lines: 20,
      },
    },
  },
});
