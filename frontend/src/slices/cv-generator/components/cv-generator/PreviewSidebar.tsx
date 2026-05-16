"use client";

import {
  AlertCircle,
  Check,
  CloudUpload,
  Download,
  Eye,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ProgressWalker } from "@/shared/components/stats/ProgressWalker";
import { CVScoreBadge, computeScore } from "../CVScoreBadge";
import { ScaledCVPreview } from "../templates/ScaledCVPreview";
import { PreviewToolbar } from "./PreviewToolbar";
import type { PreviewLayout } from "../../hooks/usePreviewControls";
import type { AutosaveStatus } from "../../hooks/useAutosave";
import type { CVData } from "../../types";

interface Props {
  cvData: CVData;
  renderCV: CVData;
  photoUrl: string;
  isSaving: boolean;
  isExporting: boolean;
  onPreviewOpen: () => void;
  onSave: () => void;
  onExportClick: () => void;
  autosaveStatus: AutosaveStatus;
  autosaveLastAt: number | null;
  dirty: boolean;
  layout: PreviewLayout;
  onLayoutChange: (layout: PreviewLayout) => void;
}

export function PreviewSidebar({
  cvData,
  renderCV,
  photoUrl,
  isSaving,
  isExporting,
  onPreviewOpen,
  onSave,
  onExportClick,
  autosaveStatus,
  autosaveLastAt,
  dirty,
  layout,
  onLayoutChange,
}: Props) {
  const score = computeScore(cvData);
  return (
    <div className="min-w-0 lg:col-span-1">
      <div className="sticky top-24 space-y-4">
        <Card className="hidden border-border lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand" />
                Lihat CV
              </span>
              <AutosaveBadge
                status={autosaveStatus}
                lastSavedAt={autosaveLastAt}
                dirty={dirty}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            <PreviewToolbar
              layout={layout}
              onLayoutChange={onLayoutChange}
              onFullscreen={onPreviewOpen}
              className="text-xs"
            />
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <ScaledCVPreview
                cv={renderCV}
                photoUrl={photoUrl}
                compact
                layout={layout}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand" />
              Skor & Aksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Kelengkapan</span>
                  <span className="text-sm font-semibold text-brand tabular-nums">
                    {score}%
                  </span>
                </div>
                <ProgressWalker value={score} label="Kelengkapan CV" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Info Pribadi</span>
                  {cvData.profile.name ? (
                    <Badge variant="secondary" className="bg-success/20 text-success">Lengkap</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-warning/20 text-warning">Belum Lengkap</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pengalaman</span>
                  <Badge variant="secondary" className="bg-muted">{cvData.experience.length} item</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pendidikan</span>
                  <Badge variant="secondary" className="bg-muted">{cvData.education.length} item</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Skill</span>
                  <Badge variant="secondary" className="bg-muted">{cvData.skills.length} item</Badge>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full bg-brand hover:bg-brand" onClick={onPreviewOpen}>
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat CV
                </Button>
                <Button className="w-full" variant="outline" onClick={onSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Menyimpan...' : 'Simpan CV'}
                </Button>
                <Button variant="outline" className="w-full" onClick={onExportClick} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Mengekspor...' : 'Unduh PDF'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <CVScoreBadge cvData={cvData} />
      </div>
    </div>
  );
}

function AutosaveBadge({
  status,
  lastSavedAt,
  dirty,
}: {
  status: AutosaveStatus;
  lastSavedAt: number | null;
  dirty: boolean;
}) {
  if (status === "saving") {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-normal">
        <Loader2 className="h-3 w-3 animate-spin" />
        Menyimpan…
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1 text-[10px] font-normal">
        <AlertCircle className="h-3 w-3" />
        Gagal autosave
      </Badge>
    );
  }
  if (dirty) {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-[10px] font-normal text-amber-700 border-amber-400/60 dark:text-amber-300"
      >
        <CloudUpload className="h-3 w-3" />
        Belum disimpan
      </Badge>
    );
  }
  if (status === "saved" || lastSavedAt) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] font-normal text-emerald-700 border-emerald-400/60 dark:text-emerald-300">
        <Check className="h-3 w-3" />
        {lastSavedAt ? `Tersimpan ${timeAgo(lastSavedAt)}` : "Tersimpan"}
      </Badge>
    );
  }
  return null;
}

function timeAgo(ts: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (secs < 5) return "baru saja";
  if (secs < 60) return `${secs}d lalu`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}j lalu`;
}
