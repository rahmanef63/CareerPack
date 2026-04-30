"use client";

import { Briefcase, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { SwipeToDelete } from "@/shared/components/interactions/MicroInteractions";
import { InlineAISuggestChip } from "../../InlineAISuggestChip";
import { SectionCard } from "../SectionCard";
import type { CVData, Experience } from "../../../types";

interface DragHandlers {
  onDragStart: (id: string) => (e: React.DragEvent) => void;
  onDragOver: (id: string) => (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  expDrag: DragHandlers;
  addExperience: () => void;
  updateExperience: (id: string, field: keyof Experience | string, value: string) => void;
  removeExperience: (id: string) => void;
  aiSuggestExperienceDesc: (id: string) => void;
}

export function ExperienceSection({
  cvData, isOpen, onToggle, expDrag,
  addExperience, updateExperience, removeExperience, aiSuggestExperienceDesc,
}: Props) {
  return (
    <SectionCard
      title="Pengalaman Kerja"
      icon={Briefcase}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={addExperience}
      addLabel="Tambah Pekerjaan"
    >
      <div className="space-y-3">
        {cvData.experience.map((exp, idx) => (
          <SwipeToDelete key={exp.id} onDelete={() => removeExperience(exp.id)}>
            <div
              draggable
              onDragStart={expDrag.onDragStart(exp.id)}
              onDragOver={expDrag.onDragOver(exp.id)}
              onDragEnd={expDrag.onDragEnd}
              className="p-4 border border-border rounded-lg bg-muted/40"
            >
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Drag handle">
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <h4 className="font-medium text-foreground truncate">Pengalaman #{idx + 1}</h4>
                </div>
                <div className="flex items-center gap-1">
                  <InlineAISuggestChip label="AI" onClick={() => aiSuggestExperienceDesc(exp.id)} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(exp.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Perusahaan</Label>
                  <Input placeholder="Nama Perusahaan" value={exp.company}
                    onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan</Label>
                  <Input placeholder="Posisi Pekerjaan" value={exp.position}
                    onChange={(e) => updateExperience(exp.id, 'position', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input type="month" value={exp.startDate}
                    onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input type="month" value={exp.endDate}
                    onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    placeholder="Jelaskan tanggung jawab dan pencapaian Anda..."
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </SwipeToDelete>
        ))}
        {cvData.experience.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Belum ada pengalaman. Klik &quot;Tambah Pekerjaan&quot; untuk memulai. <span className="text-xs italic">(Tip: swipe kiri untuk hapus, drag untuk urutkan)</span></p>
        )}
      </div>
    </SectionCard>
  );
}
