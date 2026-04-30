"use client";

import { type RefObject } from "react";
import { ChevronLeft, ChevronRight, Download, Languages, Undo2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";
import { CV_TEMPLATES } from "../../constants";
import type { CVData, CVTemplateId } from "../../types";
import { TRANSLATE_LANGUAGES, type CVLangCode } from "../../hooks/useCVTranslate";
import { ScaledCVPreview } from "../templates/ScaledCVPreview";
import { TemplateThumb } from "./TemplatePicker";

interface Props {
  previewOpen: boolean;
  setPreviewOpen: (open: boolean) => void;
  renderCV: CVData;
  photoUrl: string;
  cvPreviewRef: RefObject<HTMLDivElement | null>;
  currentTemplateIdx: number;
  templateIds: CVTemplateId[];
  swipeStartXRef: RefObject<number | null>;
  swipeDx: number;
  onSwipeStart: (e: React.PointerEvent) => void;
  onSwipeMove: (e: React.PointerEvent) => void;
  onSwipeEnd: () => void;
  cycleTemplate: (dir: 1 | -1) => void;
  updatePref: <K extends keyof CVData['displayPrefs']>(
    key: K, value: CVData['displayPrefs'][K],
  ) => void;
  onExportPDF: () => void;
  isExporting: boolean;
  translate: (lang: CVLangCode) => void;
  revertTranslation: () => void;
  activeLang: string | null;
  isTranslating: boolean;
}

export function CVPreviewDialog({
  previewOpen, setPreviewOpen, renderCV, photoUrl, cvPreviewRef,
  currentTemplateIdx, templateIds, swipeStartXRef, swipeDx,
  onSwipeStart, onSwipeMove, onSwipeEnd, cycleTemplate, updatePref,
  onExportPDF, isExporting, translate, revertTranslation, activeLang, isTranslating,
}: Props) {
  return (
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent
        size="content"
        className="max-h-[95vh] overflow-y-auto"
        drawerClassName="max-h-[95vh]"
      >
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <DialogTitle className="flex items-center gap-2">
              Pratinjau CV
              {activeLang && (
                <Badge variant="secondary" className="bg-brand-muted text-brand-muted-foreground">
                  {activeLang.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled={isTranslating}>
                    <Languages className="w-4 h-4" />
                    {isTranslating ? 'Menerjemahkan...' : 'Terjemahkan'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Pilih bahasa tujuan</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {TRANSLATE_LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                      key={lang.id}
                      onClick={() => translate(lang.id as CVLangCode)}
                      disabled={isTranslating}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="font-medium">{lang.label}</span>
                      {lang.note && (
                        <span className="text-xs text-muted-foreground">{lang.note}</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {activeLang && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={revertTranslation} className="gap-2">
                        <Undo2 className="w-4 h-4" />
                        Kembali ke bahasa asli
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" variant="outline" size="sm" onClick={onExportPDF} disabled={isExporting} className="gap-2">
                <Download className="w-4 h-4" />
                {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs">
            Tekan <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">Ctrl</kbd>+
            <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">P</kbd> untuk print-to-PDF native browser.
          </DialogDescription>
        </DialogHeader>
        {/* Layout (top→bottom): preview + overlay arrows + swipe, then
            thumbnail strip with name/dot pager. Translate & export sit
            in the dialog header above. Three discoverable ways to change
            template: tap an overlay arrow, swipe the preview, or tap a
            thumb below. ←/→ keys on desktop too. */}
        <div className="space-y-3">
          <div className="relative">
            <div
              onPointerDown={onSwipeStart}
              onPointerMove={onSwipeMove}
              onPointerUp={onSwipeEnd}
              onPointerCancel={onSwipeEnd}
              style={{
                transform: swipeDx
                  ? `translateX(${Math.max(-120, Math.min(120, swipeDx))}px)`
                  : undefined,
                transition:
                  swipeStartXRef.current === null
                    ? 'transform 220ms cubic-bezier(0.2,0.8,0.3,1)'
                    : 'none',
                touchAction: 'pan-y',
              }}
            >
              <ScaledCVPreview ref={cvPreviewRef} cv={renderCV} photoUrl={photoUrl} />
            </div>
            <button
              type="button"
              aria-label="Template sebelumnya"
              onClick={() => cycleTemplate(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/85 shadow-md backdrop-blur border border-border hover:bg-background hover:scale-105 transition-transform motion-safe:animate-swipe-hint-left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Template berikutnya"
              onClick={() => cycleTemplate(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/85 shadow-md backdrop-blur border border-border hover:bg-background hover:scale-105 transition-transform motion-safe:animate-swipe-hint-right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-medium truncate">
              {CV_TEMPLATES[currentTemplateIdx]?.name}
            </p>
            <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
              {templateIds.map((id, i) => (
                <span
                  key={id}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === currentTemplateIdx ? 'w-5 bg-brand' : 'w-1.5 bg-border',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {CV_TEMPLATES.map((tmpl, i) => {
              const active = i === currentTemplateIdx;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => updatePref('templateId', tmpl.id as CVTemplateId)}
                  className={cn(
                    'shrink-0 snap-start w-32 sm:w-40 rounded-md border p-2 text-left transition-all',
                    active
                      ? 'border-brand ring-2 ring-brand/40 bg-brand-muted/30'
                      : 'border-border hover:border-brand/40',
                  )}
                  aria-pressed={active}
                >
                  <div className="w-full">
                    <TemplateThumb id={tmpl.id as CVTemplateId} />
                  </div>
                  <p className="mt-1 text-[11px] font-medium truncate">{tmpl.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
