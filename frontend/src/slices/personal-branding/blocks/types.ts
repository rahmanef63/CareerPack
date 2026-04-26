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

export type PersonalBrandingTheme = "linktree" | "bento" | "magazine";

export interface HeaderBg {
  kind: "gradient" | "solid" | "image" | "none";
  value: string;
}

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
};
