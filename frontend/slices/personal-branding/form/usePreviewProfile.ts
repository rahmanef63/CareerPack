"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { FormState } from "./types";
import { usePreviewBranding } from "./usePreviewBranding";

/**
 * Assemble the `profile` payload that `PersonalBrandingPage` renders in the
 * editor's live previews — the same shape the public route builds, so the
 * split view and the modal preview can't drift from each other or from the
 * published page.
 *
 * It used to also run `buildAutoBlocks` here to fill a `blocks` field. Nothing
 * read it: the renderer only consumes `branding`. That ran on every keystroke,
 * and it picked the user's CV by a different rule ("richest") than the server
 * uses ("newest"), so the preview could be built from a different document
 * than the live page. Both are gone.
 */
export function usePreviewProfile(state: FormState, slugTrimmed: string) {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const previewData = usePreviewBranding(state);

  return useMemo(
    () => ({
      slug: slugTrimmed || "preview",
      displayName: me?.profile?.fullName || me?.name || "Nama Anda",
      theme: state.theme,
      accent: null,
      html: state.html || null,
      branding: previewData?.branding,
    }),
    [state.theme, state.html, slugTrimmed, me, previewData],
  );
}
