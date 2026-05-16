/**
 * Single source of truth for every "what does a brand-new profile
 * look like" answer. Sections that need an override accept props with
 * matching shape — see ../sections/IdentityCard reservedSlugs prop
 * for an example pattern.
 */

import { DEFAULT_AUTO_TOGGLES } from "../../../../../convex/profile/autoBlocks";
import type { FormState } from "./types";

export const DEFAULT_FORM_STATE: FormState = {
  enabled: false,
  slug: "",
  headline: "",

  avatarShow: false,
  bioShow: false,
  skillsShow: false,
  targetRoleShow: false,
  portfolioShow: false,

  contactEmail: "",
  linkedinUrl: "",
  portfolioUrl: "",

  allowIndex: false,

  mode: "auto",
  theme: "template-v2",
  headerBg: null,
  autoToggles: DEFAULT_AUTO_TOGGLES,
  blocks: [],

  htmlExport: false,
  embedExport: false,
  promptExport: false,

  availableForHire: false,
  availabilityNote: "",
  ctaLabel: "",
  ctaUrl: "",
  ctaType: "link",
  sectionOrder: [],
  style: {},
};

/** Canonical section order — used by SectionLayoutCard as the
 *  baseline when the user hasn't reordered yet. */
export const DEFAULT_SECTION_ORDER: ReadonlyArray<{
  key: string;
  label: string;
}> = [
  { key: "about", label: "Tentang" },
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Pengalaman" },
  { key: "projects", label: "Proyek" },
  { key: "education", label: "Pendidikan" },
  { key: "certifications", label: "Sertifikasi" },
  { key: "languages", label: "Bahasa" },
  { key: "contact", label: "Kontak" },
];

export const FIELD_LIMITS_PB = {
  availabilityNoteMax: 80,
  ctaLabelMax: 40,
} as const;

/** Field-length constraints used across the builder. Exposed as
 *  constants so sections can consume them via props for parity with
 *  server-side validation. */
export const FIELD_LIMITS = {
  slugMin: 3,
  slugMax: 30,
  headlineMax: 120,
  contactEmailMax: 120,
  urlMax: 300,
} as const;

/** Reserved-slug blocklist mirrors convex/profile/mutations.ts. Kept
 *  here so the client can validate before the server roundtrip. */
export const DEFAULT_RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "_next", "api", "r", "static", "assets", "public",
  "icon", "apple-icon", "apple-touch-icon", "favicon",
  "manifest", "robots", "sitemap", "well-known",
  "login", "logout", "signin", "signup", "register",
  "forgot-password", "reset-password", "verify", "auth",
  "dashboard", "admin", "settings", "help", "profile",
  "account", "terms", "privacy", "cookies", "legal",
  "about", "contact", "pricing", "home", "docs", "blog",
  "faq", "support", "careers", "press", "root", "null",
  "undefined", "error", "404", "500", "status",
  "careerpack", "anthropic", "claude",
]);

export const SLUG_HINT_DEFAULT =
  "Huruf kecil, angka, tanda '-'. Diawali huruf, diakhiri huruf/angka. 3-30 karakter.";
