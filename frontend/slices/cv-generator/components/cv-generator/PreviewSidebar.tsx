"use client";

import {
  AlertCircle,
  Check,
  CloudUpload,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
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
  onPreviewOpen: () => void;
  autosaveStatus: AutosaveStatus;
  autosaveLastAt: number | null;
  dirty: boolean;
  layout: PreviewLayout;
  onLayoutChange: (layout: PreviewLayout) => void;
}

/**
 * Sidebar = preview card + score card. Primary actions (Lihat / Simpan
 * / Unduh) live in the page header now — the duplicate button stack
 * that used to sit at the bottom of this column has been removed so
 * the sticky sidebar is shorter and the score card sits in the user's
 * eyeline next to the preview.
 */
export function PreviewSidebar({
  cvData,
  renderCV,
  photoUrl,
  onPreviewOpen,
  autosaveStatus,
  autosaveLastAt,
  dirty,
  layout,
  onLayoutChange,
}: Props) {
  const score = computeScore(cvData);
  const profileTone = cvData.profile.name
    ? "bg-success/20 text-success"
    : "bg-warning/20 text-warning";
  const profileLabel = cvData.profile.name ? "Lengkap" : "Belum";
  return (
    <div className="min-w-0 lg:col-span-1">
      {/* Cap sticky container to viewport height — without this, tall
          preview + score cards push past the fold and the user can't
          reach the bottom score cards without scrolling the whole page.
          Internal overflow-y-auto lets the sidebar scroll independently
          while staying pinned. */}
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                Kelengkapan CV
              </span>
              <span className="text-sm font-semibold text-brand tabular-nums">
                {score}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <ProgressWalker value={score} label="Kelengkapan CV" />
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <SidebarMetric
                label="Info Pribadi"
                badge={
                  <Badge variant="secondary" className={profileTone}>
                    {profileLabel}
                  </Badge>
                }
              />
              <SidebarMetric
                label="Pengalaman"
                badge={
                  <Badge variant="secondary" className="bg-muted">
                    {cvData.experience.length}
                  </Badge>
                }
              />
              <SidebarMetric
                label="Pendidikan"
                badge={
                  <Badge variant="secondary" className="bg-muted">
                    {cvData.education.length}
                  </Badge>
                }
              />
              <SidebarMetric
                label="Skill"
                badge={
                  <Badge variant="secondary" className="bg-muted">
                    {cvData.skills.length}
                  </Badge>
                }
              />
            </div>
          </CardContent>
        </Card>

        <CVScoreBadge cvData={cvData} />
      </div>
    </div>
  );
}

function SidebarMetric({
  label,
  badge,
}: {
  label: string;
  badge: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <span className="truncate text-muted-foreground">{label}</span>
      {badge}
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
