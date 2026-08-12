import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards the HTTP status code of every unknown path under `/`.
 *
 * `app/[slug]/` is a root catch-all serving public profiles. A `loading.tsx`
 * in that segment makes Next flush a Suspense fallback before the page runs,
 * which commits `200 OK` — so the later `notFound()` cannot set 404 and every
 * guessed URL answers 200 with a "not found" body. That is a soft 404, and on
 * a root catch-all it applies to the entire URL space.
 *
 * It is invisible in review (adding a skeleton looks like a UX improvement),
 * invisible in `next build` (the route still lists fine), and invisible in
 * every other test here, because nothing else asserts a status code. So it
 * gets a file-existence test — crude, but it fails the moment someone
 * reintroduces the file, which is the only thing that matters.
 */
const SEGMENT = join(__dirname, "[slug]");

describe("app/[slug] route status", () => {
  it("has no segment-level loading.tsx", () => {
    const offender = ["loading.tsx", "loading.jsx", "loading.js"].find((f) =>
      existsSync(join(SEGMENT, f)),
    );
    expect(
      offender,
      offender
        ? `app/[slug]/${offender} exists. It flushes a Suspense shell before the page runs, ` +
            "which commits HTTP 200 and turns every unknown slug into a soft 404. " +
            "Put the skeleton inside page.tsx, below the notFound() decision, instead."
        : undefined,
    ).toBeUndefined();
  });

  it("still declares the ISR config the 404 caching depends on", () => {
    // `force-static` + `revalidate` is what lets an unknown slug answer 404
    // from the cache without a Convex round trip. If someone drops it, real
    // profiles stop being CDN-cached and enumeration reaches the backend.
    const page = readFileSync(join(SEGMENT, "page.tsx"), "utf8");
    expect(page).toContain('export const dynamic = "force-static"');
    expect(page).toMatch(/export const revalidate = \d+/);
  });
});
