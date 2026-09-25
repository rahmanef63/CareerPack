import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
it("makes the real product creator visible on public pages without a ranking claim", () => {
  const source = readFileSync(fileURLToPath(new URL("./MarketingFooter.tsx", import.meta.url)), "utf8");
  expect(source).toContain('href="https://rahmanef.com/about"');
  expect(source).toContain("Dikembangkan oleh");
  expect(source).toContain("Rahman Fakhru");
  expect(source).not.toContain("AI trainer terbaik");
  expect(source).toContain('href="/privacy"');
  expect(source).toContain('href="/terms"');
});
