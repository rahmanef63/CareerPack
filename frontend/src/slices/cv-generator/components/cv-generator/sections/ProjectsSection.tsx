"use client";

import { Folder, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { SectionCard } from "../SectionCard";
import type { CVData, Project } from "../../../types";

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  addProject: () => void;
  updateProject: (id: string, field: keyof Project | string, value: string) => void;
  removeProject: (id: string) => void;
}

export function ProjectsSection({
  cvData, isOpen, onToggle, addProject, updateProject, removeProject,
}: Props) {
  return (
    <SectionCard
      title="Proyek"
      icon={Folder}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={addProject}
      addLabel="Tambah Proyek"
    >
      <div className="space-y-4">
        {cvData.projects.map((proj, idx) => (
          <div key={proj.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-foreground">Proyek #{idx + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProject(proj.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Proyek</Label>
                <Input placeholder="Website E-commerce" value={proj.name}
                  onChange={(e) => updateProject(proj.id, 'name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  placeholder="Jelaskan proyek Anda, peran Anda, dan teknologi yang digunakan..."
                  value={proj.description}
                  onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Link Proyek (Opsional)</Label>
                <Input placeholder="https://github.com/username/project" value={proj.link || ''}
                  onChange={(e) => updateProject(proj.id, 'link', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {cvData.projects.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Belum ada proyek. Klik &quot;Tambah Proyek&quot; untuk memulai.</p>
        )}
      </div>
    </SectionCard>
  );
}
