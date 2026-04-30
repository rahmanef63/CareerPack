/** Template validation helpers for admin template CRUD. */

import { v } from "convex/values";
import {
  templateNodeValidator,
  templateManifestValidator,
  templateConfigValidator,
  VALID_DOMAINS,
} from "../../roadmap/schema";

/** Shared object-spread validator for template upsert + bulk-import args. */
export const templateInputFields = {
  title: v.string(),
  slug: v.string(),
  domain: v.string(),
  icon: v.string(),
  color: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  nodes: v.array(templateNodeValidator),
  isPublic: v.boolean(),
  isSystem: v.boolean(),
  order: v.number(),
  manifest: v.optional(templateManifestValidator),
  config: v.optional(templateConfigValidator),
} as const;

export interface ValidatedTemplateMeta {
  title: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
}

/**
 * Validates + normalizes the string-ish fields. Returns cleaned values.
 * Caller composes the final payload with nodes / flags / order from args.
 *
 * Throws Indonesian errors so they surface verbatim in the admin UI.
 */
export function validateTemplateMeta(raw: {
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  nodes: unknown[];
}): ValidatedTemplateMeta {
  const slug = raw.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!slug || slug.length > 80) {
    throw new Error("Slug 1-80 karakter huruf kecil/angka/tanda hubung");
  }
  const title = raw.title.trim();
  if (!title || title.length > 120) throw new Error("Judul 1-120 karakter");
  if (!VALID_DOMAINS.has(raw.domain)) {
    throw new Error(`Domain "${raw.domain}" tidak valid`);
  }
  if (raw.nodes.length > 200) throw new Error("Maksimal 200 node per template");

  return {
    title,
    slug,
    icon: raw.icon.trim() || "BookOpen",
    color: raw.color.trim() || "bg-brand",
    description: raw.description.trim(),
    tags: raw.tags.map((t) => t.trim()).filter(Boolean).slice(0, 20),
  };
}

