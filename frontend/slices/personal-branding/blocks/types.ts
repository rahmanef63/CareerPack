/**
 * The built-in page templates.
 *
 * This file used to also re-export the whole `Block` type family from
 * convex/profile/blocks — the manual block builder's shared vocabulary. The
 * builder was removed (2026-08-15) in favour of one HTML document per page
 * (`publicHtml`, authored by hand or by an AI host over MCP), so only the
 * template registry is left. The path is kept because a dozen modules import
 * from it.
 */

/**
 * Full-page HTML documents served from `/public/personal-branding/templates/`.
 * Legacy theme ids (linktree/bento/magazine) are still accepted by the Convex
 * validator for backward read-compat; the renderer maps them to template-v2.
 */
export const TEMPLATE_THEMES = [
  "template-v1",
  "template-v2",
  "template-v3",
  "starter",
] as const;
export type TemplateTheme = (typeof TEMPLATE_THEMES)[number];
export type PersonalBrandingTheme = TemplateTheme;

export const TEMPLATE_URLS: Record<TemplateTheme, string> = {
  "template-v1": "/personal-branding/templates/v1.html",
  "template-v2": "/personal-branding/templates/v2.html",
  "template-v3": "/personal-branding/templates/v3.html",
  starter: "/personal-branding/templates/starter.html",
};

export const THEME_LABELS: Record<
  PersonalBrandingTheme,
  { label: string; tagline: string }
> = {
  starter: {
    label: "Starter",
    tagline: "Bersih, satu kolom, ringan — dan menampilkan semua data kamu.",
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
