"use client";

import { GripVertical, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  ResponsiveSelect, ResponsiveSelectContent, ResponsiveSelectItem, ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { SectionCard } from "../SectionCard";
import type { CVData } from "../../../types";

interface DragHandlers {
  onDragStart: (id: string) => (e: React.DragEvent) => void;
  onDragOver: (id: string) => (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  skillDrag: DragHandlers;
  addSkill: () => void;
  updateSkill: (id: string, field: string, value: string | number) => void;
  removeSkill: (id: string) => void;
}

export function SkillsSection({
  cvData, isOpen, onToggle, skillDrag, addSkill, updateSkill, removeSkill,
}: Props) {
  return (
    <SectionCard
      title="Skill"
      icon={Sparkles}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={addSkill}
      addLabel="Tambah Skill"
    >
      <div className="space-y-3">
        {cvData.skills.map((skill) => (
          <div
            key={skill.id}
            draggable
            onDragStart={skillDrag.onDragStart(skill.id)}
            onDragOver={skillDrag.onDragOver(skill.id)}
            onDragEnd={skillDrag.onDragEnd}
            className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/40"
          >
            <span className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Drag handle">
              <GripVertical className="w-4 h-4" />
            </span>
            <div className="flex-1 grid sm:grid-cols-3 gap-3">
              <Input
                placeholder="Nama skill (contoh: JavaScript)"
                value={skill.name}
                onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
              />
              <ResponsiveSelect
                value={skill.category}
                onValueChange={(v) => updateSkill(skill.id, 'category', v)}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Kategori skill">
                  <ResponsiveSelectItem value="technical">Teknis</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="soft">Soft Skill</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="language">Bahasa</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="tool">Tool</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
              <ResponsiveSelect
                value={String(skill.proficiency)}
                onValueChange={(v) => updateSkill(skill.id, 'proficiency', parseInt(v))}
              >
                <ResponsiveSelectTrigger />
                <ResponsiveSelectContent drawerTitle="Tingkat keahlian">
                  <ResponsiveSelectItem value="1">Pemula</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="2">Dasar</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="3">Menengah</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="4">Mahir</ResponsiveSelectItem>
                  <ResponsiveSelectItem value="5">Ahli</ResponsiveSelectItem>
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSkill(skill.id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {cvData.skills.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Belum ada skill. Klik &quot;Tambah Skill&quot; untuk memulai.</p>
        )}
      </div>
    </SectionCard>
  );
}
