"use client";

import { Eye } from "lucide-react";
import { PersonalBrandingPage } from "../themes";
import type { FormState } from "../form/types";
import { usePreviewProfile } from "../form/usePreviewProfile";

export interface MiniPreviewFrameProps {
  state: FormState;
  slugTrimmed: string;
}

/**
 * Side-by-side live-preview for the Otomatis tab desktop layout.
 * Mirrors PreviewDialog's data assembly minus the viewport / template
 * mock toggles — desktop split-view is always "Data Saya, natural
 * width". Mobile users still get the modal Preview button.
 */
export function MiniPreviewFrame({ state, slugTrimmed }: MiniPreviewFrameProps) {
  const previewProfile = usePreviewProfile(state, slugTrimmed);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3 w-3" />
          Pratinjau langsung
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Live
        </span>
      </div>
      <div className="max-h-[calc(100vh-14rem)] overflow-auto bg-muted/10">
        <PersonalBrandingPage
          profile={previewProfile}
          brand={false}
          showBranding
        />
      </div>
    </div>
  );
}
