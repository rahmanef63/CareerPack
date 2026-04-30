"use client";

import * as React from "react";
import {
  TEMPLATE_URLS,
  TEMPLATE_THEMES,
  type PersonalBrandingTheme,
  type TemplateTheme,
} from "../blocks/types";
import type { Mode } from "../form/types";
import { MANUAL_TEMPLATE_URL, type ProfileShape } from "./types";
import { TemplateLayout } from "./TemplateLayout";
import { BrandFooter } from "./BrandFooter";

export { MANUAL_TEMPLATE_URL } from "./types";
export type { BrandingPayload, ProfileShape } from "./types";

/**
 * Public-page renderer dispatcher. Only template-v1/v2/v3 are
 * supported. Legacy themes (linktree/bento/magazine) from existing
 * profiles fall back to template-v2 at render time — schema validator
 * still accepts them for backward read-compatibility.
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
  const mode: Mode = profile.mode ?? "auto";
  // Manual mode forces the canvas template — the v1/v2/v3 templates
  // are CV-driven hero pages and don't host user-arranged blocks.
  const templateKey = mode === "custom" ? "template-manual" : theme;
  const templateUrl =
    mode === "custom" ? MANUAL_TEMPLATE_URL : TEMPLATE_URLS[theme];
  return (
    <div className="bg-background text-foreground" style={accentVar}>
      <TemplateLayout
        templateKey={templateKey}
        templateUrl={templateUrl}
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
