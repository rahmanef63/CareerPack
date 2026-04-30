/**
 * Personal Branding block schema — types + constants.
 */

export const ALLOWED_BLOCK_TYPES = [
  "heading",
  "paragraph",
  "link",
  "social",
  "image",
  "embed",
  "divider",
  "html",
  "container",
] as const;
export type BlockType = (typeof ALLOWED_BLOCK_TYPES)[number];

/**
 * Container layouts. Stack/row/grid are CSS-grid-driven; carousel uses
 * scroll-snap on mobile and falls back to a row on desktop.
 */
export const CONTAINER_LAYOUTS = [
  "stack",
  "row",
  "grid-2",
  "grid-3",
  "grid-4",
  "carousel",
] as const;
export type ContainerLayout = (typeof CONTAINER_LAYOUTS)[number];

export const CONTAINER_MOBILE_LAYOUTS = [
  "auto",
  "stack",
  "carousel",
] as const;
export type ContainerMobileLayout = (typeof CONTAINER_MOBILE_LAYOUTS)[number];

export const CONTAINER_GAPS = ["tight", "normal", "loose"] as const;
export type ContainerGap = (typeof CONTAINER_GAPS)[number];

export const CONTAINER_ALIGNS = ["start", "center", "end", "stretch"] as const;
export type ContainerAlign = (typeof CONTAINER_ALIGNS)[number];

/** Optional chrome applied to any block via `Block.style`. Curated
 *  preset values rather than free-form CSS so we never have to
 *  sanitise arbitrary CSSOM strings on the iframe side. */
export const BLOCK_BG_VARIANTS = [
  "none",
  "card",
  "muted",
  "primary-soft",
  "border",
] as const;
export type BlockBgVariant = (typeof BLOCK_BG_VARIANTS)[number];

export const BLOCK_PADDINGS = ["none", "sm", "md", "lg"] as const;
export type BlockPadding = (typeof BLOCK_PADDINGS)[number];

export const BLOCK_TEXT_ALIGNS = ["start", "center", "end"] as const;
export type BlockTextAlign = (typeof BLOCK_TEXT_ALIGNS)[number];

export interface BlockStyle {
  bgVariant?: BlockBgVariant;
  padding?: BlockPadding;
  textAlign?: BlockTextAlign;
}

export interface ContainerPayload {
  layout?: ContainerLayout;
  mobileLayout?: ContainerMobileLayout;
  gap?: ContainerGap;
  align?: ContainerAlign;
  /** Recursive — children render in the parent's chosen layout. Depth
   *  is capped at 1 (containers cannot contain containers). */
  children?: Block[];
}

export interface HeadingPayload {
  text: string;
  size?: "lg" | "md";
}

export interface ParagraphPayload {
  text: string;
}

export interface LinkPayload {
  label: string;
  url: string;
  description?: string;
  variant?: "primary" | "secondary" | "ghost";
  emoji?: string;
}

export const SOCIAL_PLATFORMS = [
  "linkedin",
  "instagram",
  "twitter",
  "github",
  "youtube",
  "tiktok",
  "dribbble",
  "behance",
  "facebook",
  "whatsapp",
  "email",
  "website",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialPayload {
  items: Array<{ platform: SocialPlatform; url: string }>;
}

export interface ImagePayload {
  url: string;
  alt: string;
  caption?: string;
  link?: string;
}

export const ALLOWED_EMBED_PROVIDERS = [
  "youtube",
  "vimeo",
  "spotify",
  "soundcloud",
] as const;
export type EmbedProvider = (typeof ALLOWED_EMBED_PROVIDERS)[number];

export interface EmbedPayload {
  provider: EmbedProvider;
  id: string;
  /** Optional caption shown below the embed. */
  caption?: string;
}

export interface DividerPayload {
  style?: "line" | "dot";
}

export interface HtmlPayload {
  content: string;
}

export interface Block<T extends BlockType = BlockType> {
  id: string;
  type: T;
  hidden?: boolean;
  payload: BlockPayloadFor<T>;
  /** Optional chrome applied to the block wrapper. */
  style?: BlockStyle;
}

export type BlockPayloadFor<T extends BlockType> =
  T extends "heading" ? HeadingPayload :
  T extends "paragraph" ? ParagraphPayload :
  T extends "link" ? LinkPayload :
  T extends "social" ? SocialPayload :
  T extends "image" ? ImagePayload :
  T extends "embed" ? EmbedPayload :
  T extends "divider" ? DividerPayload :
  T extends "html" ? HtmlPayload :
  T extends "container" ? ContainerPayload :
  never;

// Lengths shared between sanitisers.
export const MAX_TEXT_LEN = 2000;
export const MAX_LABEL_LEN = 80;
export const MAX_HEADING_LEN = 120;
export const MAX_HTML_LEN = 5000;
export const MAX_URL_LEN = 500;
