"use client";

import { Eye, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import type { SubmitOptions } from "../form/types";

export interface MobileActionBarProps {
  saving: boolean;
  canEnable: boolean;
  onPreview: () => void;
  onPublish: (opts?: SubmitOptions) => Promise<void>;
}

/**
 * Mobile-only fixed action bar — Preview + Publikasikan side-by-side
 * always reachable while the user scrolls the long form. Sits just
 * above the dashboard's BottomNav using its CSS vars (`--nav-height`
 * + `--safe-bottom`) so the two bars stack cleanly on iOS notch.
 *
 * Hidden on `lg:` because the desktop layout pins a live preview
 * pane on the right and the page header keeps its action buttons
 * visible without sticky tricks.
 */
export function MobileActionBar({
  saving,
  canEnable,
  onPreview,
  onPublish,
}: MobileActionBarProps) {
  return (
    <>
      {/* Reserve space at the bottom of the page so content doesn't
          slide under the fixed bar — desktop ignores it. */}
      <div aria-hidden className="h-16 lg:hidden" />
      <div
        className="fixed inset-x-0 z-30 border-t border-border bg-background/95 shadow-[0_-4px_12px_rgb(0_0_0/0.04)] backdrop-blur lg:hidden"
        style={{
          bottom: "calc(var(--nav-height, 4rem) + var(--safe-bottom, 0px))",
        }}
      >
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={onPreview}
            className="flex-1 gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            onClick={() => onPublish({ activate: true })}
            disabled={saving || !canEnable}
            className="flex-1 gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {saving ? "Menyimpan…" : "Publikasikan"}
          </Button>
        </div>
      </div>
    </>
  );
}
