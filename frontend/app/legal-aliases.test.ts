import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("public legal aliases", () => {
  it("keeps explicit Google-friendly legal URLs backed by the canonical pages", () => {
    const root = process.cwd();
    expect(readFileSync(join(root, "frontend/app/terms-of-service/page.tsx"), "utf8"))
      .toContain('from "../terms/page"');
    expect(readFileSync(join(root, "frontend/app/privacy-policy/page.tsx"), "utf8"))
      .toContain('from "../privacy/page"');
  });
});
