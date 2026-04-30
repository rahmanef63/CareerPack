"use client";

import { Download, Eye, FileText, Save } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ProgressWalker } from "@/shared/components/stats/ProgressWalker";
import { CVScoreBadge, computeScore } from "../CVScoreBadge";
import { ScaledCVPreview } from "../templates/ScaledCVPreview";
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
}

export function PreviewSidebar({
  cvData, renderCV, photoUrl, isSaving, isExporting,
  onPreviewOpen, onSave, onExportClick,
}: Props) {
  const score = computeScore(cvData);
  return (
    <div className="min-w-0 lg:col-span-1">
      <div className="sticky top-24 space-y-4">
        <Card className="hidden border-border lg:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand" />
              Pratinjau Hidup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              <ScaledCVPreview cv={renderCV} photoUrl={photoUrl} />
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
