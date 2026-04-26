/**
 * Frontend mirror of convex/profile/blocks.ts. Kept as a thin re-export
 * point so editor + theme renderer + public page share one source of
 * truth for block shapes.
 */
export type {
  Block,
  BlockType,
  BlockPayloadFor,
  HeadingPayload,
  ParagraphPayload,
  LinkPayload,
  SocialPayload,
  ImagePayload,
  EmbedPayload,
  DividerPayload,
  HtmlPayload,
  EmbedProvider,
  SocialPlatform,
} from "../../../../../convex/profile/blocks";
export {
  ALLOWED_BLOCK_TYPES,
  ALLOWED_EMBED_PROVIDERS,
  SOCIAL_PLATFORMS,
  HEADER_GRADIENT_PRESETS,
  parseEmbedUrl,
} from "../../../../../convex/profile/blocks";

export type PersonalBrandingTheme =
  | "linktree"
  | "bento"
  | "magazine"
  | "template-v1"
  | "template-v2"
  | "template-v3";

export interface HeaderBg {
  kind: "gradient" | "solid" | "image" | "none";
  value: string;
}

/**
 * Themes split into two families:
 * 1. Block-driven layouts (linktree/bento/magazine) — render via React with
 *    user's blocks, accent, and headerBg.
 * 2. Static HTML templates (template-v*) — full-page premium templates
 *    served from /public/personal-branding/templates/. Editable blocks are
 *    not used; user picks one and replaces placeholder content via the
 *    template-edit flow.
 */
export const TEMPLATE_THEMES = ["template-v1", "template-v2", "template-v3"] as const;
export type TemplateTheme = (typeof TEMPLATE_THEMES)[number];

export function isTemplateTheme(theme: PersonalBrandingTheme): theme is TemplateTheme {
  return (TEMPLATE_THEMES as readonly string[]).includes(theme);
}

export const TEMPLATE_URLS: Record<TemplateTheme, string> = {
  "template-v1": "/personal-branding/templates/v1.html",
  "template-v2": "/personal-branding/templates/v2.html",
  "template-v3": "/personal-branding/templates/v3.html",
};

export const THEME_LABELS: Record<PersonalBrandingTheme, { label: string; tagline: string }> = {
  linktree: {
    label: "Stack Klasik",
    tagline: "Tumpukan vertikal — paling ramah scrolling, mirip Linktree.",
  },
  bento: {
    label: "Bento Grid",
    tagline: "Grid asimetris — tile besar/kecil, gaya Apple landing.",
  },
  magazine: {
    label: "Editorial",
    tagline: "Hero serif + bagian baca panjang. Cocok untuk blog/portfolio.",
  },
  "template-v1": {
    label: "Purple Glass",
    tagline: "Template gelap glassmorphism — animasi penuh, magnetic buttons.",
  },
  "template-v2": {
    label: "Editorial Cream",
    tagline: "Template cream-gold serif — cocok hiring manager senior.",
  },
  "template-v3": {
    label: "Premium Dark",
    tagline: "Template gelap editorial — typography hierarchy paling rapi.",
  },
};
