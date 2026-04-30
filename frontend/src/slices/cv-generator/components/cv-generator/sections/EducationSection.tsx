"use client";

import { GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SectionCard } from "../SectionCard";
import type { CVData, Education } from "../../../types";

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  addEducation: () => void;
  updateEducation: (id: string, field: keyof Education | string, value: string) => void;
  removeEducation: (id: string) => void;
}

export function EducationSection({
  cvData, isOpen, onToggle, addEducation, updateEducation, removeEducation,
}: Props) {
  return (
    <SectionCard
      title="Pendidikan"
      icon={GraduationCap}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={addEducation}
      addLabel="Tambah Pendidikan"
    >
      <div className="space-y-6">
        {cvData.education.map((edu, idx) => (
          <div key={edu.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-foreground">Pendidikan #{idx + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeEducation(edu.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Institusi</Label>
                <Input placeholder="Nama Universitas/Sekolah" value={edu.institution}
                  onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gelar</Label>
                <Input placeholder="S1, S2, D3, dll" value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Bidang Studi</Label>
                <Input placeholder="Teknik Informatika" value={edu.fieldOfStudy}
                  onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>IPK (Opsional)</Label>
                <Input placeholder="3.5/4.0" value={edu.gpa || ''}
                  onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="month" value={edu.startDate}
                  onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Input type="month" value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {cvData.education.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Belum ada pendidikan. Klik &quot;Tambah Pendidikan&quot; untuk memulai.</p>
        )}
      </div>
    </SectionCard>
  );
}
