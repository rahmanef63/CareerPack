"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import {
  LEVEL_COLOR, LEVEL_LABEL, STATUS_COLOR, STATUS_LABEL,
} from "./constants";
import type { RoadmapRow, SkillShape } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRoadmap: RoadmapRow | null;
  careerPathEditing: boolean;
  setCareerPathEditing: (v: boolean) => void;
  careerPathDraft: string;
  setCareerPathDraft: (v: string) => void;
  busy: boolean;
  onSaveCareerPath: () => void;
  onAddSkill: () => void;
  onEditSkill: (skill: SkillShape) => void;
  onDeleteSkill: (args: {
    roadmapId: Id<"skillRoadmaps">; skillId: string; name: string;
  }) => void;
}

export function RoadmapSkillsSheet({
  open, onOpenChange, selectedRoadmap, careerPathEditing, setCareerPathEditing,
  careerPathDraft, setCareerPathDraft, busy, onSaveCareerPath,
  onAddSkill, onEditSkill, onDeleteSkill,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {careerPathEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={careerPathDraft}
                    onChange={(e) => setCareerPathDraft(e.target.value)}
                    className="h-8 font-semibold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveCareerPath();
                      if (e.key === "Escape") setCareerPathEditing(false);
                    }}
                  />
                  <Button size="sm" onClick={onSaveCareerPath} disabled={busy}>
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCareerPathEditing(false)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <SheetTitle className="flex items-center gap-2 text-base leading-snug">
                  <span className="truncate">{selectedRoadmap?.careerPath ?? "—"}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => {
                      setCareerPathDraft(selectedRoadmap?.careerPath ?? "");
                      setCareerPathEditing(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </SheetTitle>
              )}
              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                {selectedRoadmap?.userEmail || "(anonim)"}
              </p>
            </div>
          </div>

          {selectedRoadmap && (
            <div className="flex items-center gap-3 mt-2">
              <Progress value={selectedRoadmap.progress} className="h-1.5 flex-1" />
              <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                {selectedRoadmap.progress}%
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {selectedRoadmap.skillsCount} skill
              </span>
            </div>
          )}
        </SheetHeader>

        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
          <span className="text-sm font-medium">Skills</span>
          <Button size="sm" onClick={onAddSkill} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Tambah Skill
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 py-3 space-y-2">
            {!selectedRoadmap && (
              <p className="text-sm text-muted-foreground text-center py-8">Memuat…</p>
            )}
            {selectedRoadmap && selectedRoadmap.skills.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Belum ada skill. Klik &quot;Tambah Skill&quot; untuk mulai.
              </p>
            )}
            {selectedRoadmap &&
              [...selectedRoadmap.skills]
                .sort((a, b) => a.priority - b.priority)
                .map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                  >
                    <span className="text-xs tabular-nums text-muted-foreground w-6 shrink-0 text-center font-mono">
                      {skill.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{skill.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{skill.category}</span>
                        <Badge className={cn("border-transparent text-[10px] px-1.5 py-0", LEVEL_COLOR[skill.level] ?? "")}>
                          {LEVEL_LABEL[skill.level] ?? skill.level}
                        </Badge>
                        <Badge className={cn("border-transparent text-[10px] px-1.5 py-0", STATUS_COLOR[skill.status] ?? "")}>
                          {STATUS_LABEL[skill.status] ?? skill.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{skill.estimatedHours}j</span>
                        {skill.resources.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {skill.resources.length} resource
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEditSkill(skill)}
                        aria-label={`Edit ${skill.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteSkill({
                          roadmapId: selectedRoadmap._id,
                          skillId: skill.id,
                          name: skill.name,
                        })}
                        aria-label={`Hapus ${skill.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
