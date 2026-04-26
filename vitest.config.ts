import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["convex/**/*.test.ts", "frontend/src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["convex/_lib/**/*.ts", "frontend/src/shared/lib/**/*.ts"],
    },
  },
});
