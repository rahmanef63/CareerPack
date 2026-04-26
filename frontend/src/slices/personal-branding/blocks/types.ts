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

/**
 * Three full-page HTML templates served from
 * `/public/personal-branding/templates/`. Only these three are
 * supported as theme options — legacy block-driven themes
 * (linktree/bento/magazine) are deprecated. Schema validators still
 * accept the old strings for backward read-compat; the renderer maps
 * them to template-v2 at display time.
 */
export const TEMPLATE_THEMES = ["template-v1", "template-v2", "template-v3"] as const;
export type TemplateTheme = (typeof TEMPLATE_THEMES)[number];
export type PersonalBrandingTheme = TemplateTheme;

export interface HeaderBg {
  kind: "gradient" | "solid" | "image" | "none";
  value: string;
}

export function isTemplateTheme(theme: string): theme is TemplateTheme {
  return (TEMPLATE_THEMES as readonly string[]).includes(theme);
}

export const TEMPLATE_URLS: Record<TemplateTheme, string> = {
  "template-v1": "/personal-branding/templates/v1.html",
  "template-v2": "/personal-branding/templates/v2.html",
  "template-v3": "/personal-branding/templates/v3.html",
};

export const THEME_LABELS: Record<PersonalBrandingTheme, { label: string; tagline: string }> = {
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
