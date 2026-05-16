/**
 * Client-side slug validator — mirrors convex/profile/mutations.ts so
 * users see errors instantly instead of after a server roundtrip.
 *
 * Returned message strings are user-facing Indonesian — the section
 * renders them inline below the input.
 */

import { DEFAULT_RESERVED_SLUGS, FIELD_LIMITS } from "./defaults";
import type { SlugValidation } from "./types";

const SLUG_REGEX = /^[a-z][a-z0-9-]+[a-z0-9]$/;

export interface ValidateSlugOpts {
  reservedSlugs?: ReadonlySet<string>;
  min?: number;
  max?: number;
}

export function validateSlug(
  raw: string,
  opts: ValidateSlugOpts = {},
): SlugValidation {
  const reserved = opts.reservedSlugs ?? DEFAULT_RESERVED_SLUGS;
  const min = opts.min ?? FIELD_LIMITS.slugMin;
  const max = opts.max ?? FIELD_LIMITS.slugMax;
  const slug = raw.trim().toLowerCase();
  if (slug.length === 0) return { ok: true };
  if (slug.length < min) return { ok: false, message: `Minimal ${min} karakter.` };
  if (slug.length > max) return { ok: false, message: `Maksimal ${max} karakter.` };
  if (!SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      message:
        "Hanya huruf kecil, angka, tanda '-'. Awali huruf, akhiri huruf/angka.",
    };
  }
  if (slug.includes("--")) {
    return { ok: false, message: "Tidak boleh '--' berurutan." };
  }
  if (reserved.has(slug)) {
    return { ok: false, message: "Slug ini dipakai sistem — pilih lain." };
  }
  return { ok: true };
}
