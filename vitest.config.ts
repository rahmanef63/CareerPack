import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["convex/**/*.test.ts", "frontend/{shared,slices}/**/*.test.{ts,tsx}"],
    // 5s (the default) is not enough for the convex-test files. `convexTest()`
    // loads the ENTIRE convex function module graph before the first assertion,
    // and the suite runs on the production VPS — the same box serving every
    // Dokploy container — so that import competes for CPU with whatever else is
    // running. It passes in about 2s idle and blew past 5s under load, which is
    // the worst failure shape there is: green locally, red in the push gate,
    // and nothing wrong with the code. Generous, because a slow pass costs
    // seconds and a flaky fail costs a debugging session.
    testTimeout: 30_000,
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
      // Ratcheted 2026-07-30 after the storage-orphan tests: measured
      // 25.78 stmts / 25.52 branch / 21.79 funcs / 26.38 lines. Floors left a
      // little under each so an unrelated refactor does not redden the push
      // gate over a rounding error.
      thresholds: {
        statements: 25,
        branches: 25,
        functions: 21,
        lines: 25,
      },
    },
  },
});
