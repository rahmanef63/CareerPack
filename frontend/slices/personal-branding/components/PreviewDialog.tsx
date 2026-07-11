"use client";

import { useEffect, useState } from "react";
import { Eye, FileImage, Monitor, Smartphone, Tablet } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { PersonalBrandingPage } from "../themes";
import type { FormState } from "../form/types";
import { usePreviewProfile } from "../form/usePreviewProfile";

export interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  state: FormState;
  slugTrimmed: string;
}

type PreviewMode = "mine" | "template";
type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTH: Record<Viewport, number | null> = {
  desktop: null, // full
  tablet: 820, // ~iPad portrait
  mobile: 390, // ~iPhone 14
};

/**
 * Live preview — two tabs:
 *   - **Data Saya** (default): hydrate template with real CV + Profile
 *     + Portfolio data. WYSIWYG of what visitors will see.
 *   - **Template**: render the template's baked editorial mock
 *     (testimonials, fake metrics, lorem ipsum) so the user can
 *     evaluate the design itself before committing data.
 *
 * Branding payload is built via the shared `usePreviewBranding` hook
 * so it stays in lock-step with the validation card on the parent
 * page (single source of truth for what the iframe sees).
 */
export function PreviewDialog({
  open,
  onOpenChange,
  state,
  slugTrimmed,
}: PreviewDialogProps) {
  const previewProfile = usePreviewProfile(state, slugTrimmed);
  const [mode, setMode] = useState<PreviewMode>("mine");
  const [viewport, setViewport] = useState<Viewport>("desktop");

  // Defensive cleanup: vaul's drawer occasionally leaves
  // `pointer-events: none` on body when toggled rapidly. Force-clear
  // on close so the dashboard stays scrollable. (D11)
  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }, 250);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        size="content"
        className="max-h-[95dvh] overflow-y-auto p-0"
        drawerClassName="max-h-[95dvh]"
        aria-describedby={undefined}
      >
        <ResponsiveDialogHeader className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <ResponsiveDialogTitle>Preview halaman publik</ResponsiveDialogTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={viewport}
              onValueChange={(v) => setViewport(v as Viewport)}
            >
              <TabsList variant="pills">
                <TabsTrigger
                  value="desktop"
                  className="gap-1.5 text-xs"
                  aria-label="Tampilan desktop"
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </TabsTrigger>
                <TabsTrigger
                  value="tablet"
                  className="gap-1.5 text-xs"
                  aria-label="Tampilan tablet"
                >
                  <Tablet className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mobile"
                  className="gap-1.5 text-xs"
                  aria-label="Tampilan mobile"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as PreviewMode)}
            >
              <TabsList variant="pills">
                <TabsTrigger value="mine" className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Data Saya</span>
                </TabsTrigger>
                <TabsTrigger value="template" className="gap-1.5 text-xs">
                  <FileImage className="h-3.5 w-3.5" />
                  <span>Template</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </ResponsiveDialogHeader>
        <div className="bg-muted/20">
          {mode === "template" && (
            <p className="border-b border-border bg-amber-50/40 px-4 py-2 text-[11px] text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
              💡 Mode <strong>Template</strong> — menampilkan konten contoh
              template (testimoni, metrik, lorem ipsum). Pakai untuk menilai
              desain sebelum mengisi data.
            </p>
          )}
          <div className="flex justify-center py-4 sm:py-6">
            <div
              className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-[max-width] duration-200"
              style={{
                maxWidth: VIEWPORT_WIDTH[viewport]
                  ? `${VIEWPORT_WIDTH[viewport]}px`
                  : "100%",
              }}
            >
              <PersonalBrandingPage
                profile={previewProfile}
                brand={false}
                showBranding={mode === "mine"}
              />
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
