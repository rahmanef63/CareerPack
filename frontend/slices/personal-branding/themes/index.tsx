"use client";

import * as React from "react";
import {
  TEMPLATE_URLS,
  TEMPLATE_THEMES,
  type PersonalBrandingTheme,
  type TemplateTheme,
} from "../blocks/types";
import type { ProfileShape } from "./types";
import { TemplateLayout } from "./TemplateLayout";
import { BrandFooter } from "./BrandFooter";

export type { BrandingPayload } from "./types";

/**
 * Public-page renderer.
 *
 * Two sources for the document, one render path: the user's own
 * `profile.html` when they have custom HTML, otherwise the built-in template
 * file for their theme. Either way TemplateLayout splices the same
 * `__cp_data` payload + hydrator in, so the markup stays bound to live data.
 *
 * Legacy themes (linktree/bento/magazine) from existing profiles fall back to
 * template-v2 — the schema validator still accepts them for read-compat.
 */
export function PersonalBrandingPage({
  profile,
  brand = true,
  showBranding = true,
  enableFloatingNav = false,
}: {
  profile: ProfileShape;
  brand?: boolean;
  /** When false, render the template with its baked mock content +
   *  fluff sections (no `__cp_data` injection). Used by Preview's
   *  "Tampilkan Template" tab. */
  showBranding?: boolean;
  /** When true, the parent renders a viewport-fixed mobile nav at the
   *  bottom of the screen, populated from the iframe's hidden
   *  `.floating-nav`. Editor previews leave this off — the public
   *  page route turns it on. */
  enableFloatingNav?: boolean;
}) {
  const accentVar = profile.accent
    ? ({ "--branding-accent": profile.accent } as React.CSSProperties)
    : undefined;
  const theme = normalizeTheme(profile.theme);
  // `showBranding: false` is Preview's "Tampilkan Template" tab — it asks for
  // the template with its own mock content, so a custom document must not
  // hijack it (unhydrated, it would render the AI's placeholder copy).
  const customHtml =
    showBranding && profile.html?.trim() ? profile.html : undefined;
  return (
    <div className="bg-background text-foreground" style={accentVar}>
      <TemplateLayout
        // Custom HTML is keyed by length so swapping documents remounts the
        // iframe, the way switching templates does.
        templateKey={customHtml ? `custom-${customHtml.length}` : theme}
        templateUrl={TEMPLATE_URLS[theme]}
        templateHtml={customHtml}
        displayName={profile.displayName}
        branding={showBranding ? profile.branding : undefined}
        enableFloatingNav={enableFloatingNav}
      />
      {brand && <BrandFooter slug={profile.slug} displayName={profile.displayName} />}
    </div>
  );
}

function normalizeTheme(t: PersonalBrandingTheme): TemplateTheme {
  return (TEMPLATE_THEMES as readonly string[]).includes(t)
    ? (t as TemplateTheme)
    : "template-v2";
}
