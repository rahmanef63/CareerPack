"use client";

import { Award, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { SectionCard } from "../SectionCard";
import type { CVData, Certification } from "../../../types";

interface Props {
  cvData: CVData;
  isOpen: boolean;
  onToggle: () => void;
  addCertification: () => void;
  updateCertification: (id: string, field: keyof Certification | string, value: string) => void;
  removeCertification: (id: string) => void;
}

export function CertificationsSection({
  cvData, isOpen, onToggle, addCertification, updateCertification, removeCertification,
}: Props) {
  return (
    <SectionCard
      title="Sertifikasi"
      icon={Award}
      isOpen={isOpen}
      onToggle={onToggle}
      onAdd={addCertification}
      addLabel="Tambah Sertifikasi"
    >
      <div className="space-y-4">
        {cvData.certifications.map((cert, idx) => (
          <div key={cert.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-foreground">Sertifikasi #{idx + 1}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCertification(cert.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Sertifikasi</Label>
                <Input placeholder="AWS Certified Developer" value={cert.name}
                  onChange={(e) => updateCertification(cert.id, 'name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Organisasi Penerbit</Label>
                <Input placeholder="Amazon Web Services" value={cert.issuer}
                  onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Diperoleh</Label>
                <Input type="month" value={cert.date}
                  onChange={(e) => updateCertification(cert.id, 'date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Kadaluarsa (Opsional)</Label>
                <Input type="month" value={cert.expiryDate || ''}
                  onChange={(e) => updateCertification(cert.id, 'expiryDate', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {cvData.certifications.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Belum ada sertifikasi. Klik &quot;Tambah Sertifikasi&quot; untuk memulai.</p>
        )}
      </div>
    </SectionCard>
  );
}
