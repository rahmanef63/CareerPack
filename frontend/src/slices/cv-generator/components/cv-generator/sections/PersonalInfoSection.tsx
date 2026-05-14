"use client";

import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { PhotoPicker } from "@/shared/components/files/PhotoPicker";
import { InlineAISuggestChip } from "../../InlineAISuggestChip";
import type { CVData } from "../../../types";
import type { CVFormat } from "../../../constants";

interface Props {
  cvData: CVData;
  format: CVFormat;
  photoUrl: string;
  avatarStorageId?: string;
  updateProfile: (field: string, value: string) => void;
  onPhotoUploaded: (result: { storageId: string }) => void;
  onPhotoFromLibrary: (file: { storageId: string }) => void;
  onPhotoUrl: (url: string) => void;
  onPhotoClear: () => void;
  aiSuggestSummary: () => void;
}

export function PersonalInfoSection({
  cvData, format, photoUrl, avatarStorageId,
  updateProfile, onPhotoUploaded, onPhotoFromLibrary, onPhotoUrl, onPhotoClear,
  aiSuggestSummary,
}: Props) {
  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center">
            <User className="w-5 h-5 text-brand" />
          </div>
          <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {format === 'national' && (
          <div className="mb-4 space-y-1">
            <Label className="text-sm">Foto Formal</Label>
            <PhotoPicker
              previewUrl={photoUrl || undefined}
              hasStorage={!!avatarStorageId}
              onUpload={onPhotoUploaded}
              onPickFromLibrary={onPhotoFromLibrary}
              onUrl={onPhotoUrl}
              onClear={onPhotoClear}
              cropAspect={4 / 6}
              uploadHint="JPG/PNG/WebP, maks 10 MB. Dipotong rasio 4:6."
            />
            <p className="text-xs text-muted-foreground">
              Wajib untuk format Nasional. Pilih cara: paste URL gambar,
              unggah file (auto-crop 4:6 + WebP), atau pilih dari Library
              Anda.
            </p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nama Lengkap</Label>
            <Input id="profile-name" placeholder="Budi Santoso" value={cvData.profile.name}
              onChange={(e) => updateProfile('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" type="email" placeholder="budi@email.com" value={cvData.profile.email}
              onChange={(e) => updateProfile('email', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Nomor Telepon</Label>
            <Input id="profile-phone" placeholder="+62 812 3456 7890" value={cvData.profile.phone}
              onChange={(e) => updateProfile('phone', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-location">Lokasi</Label>
            <Input id="profile-location" placeholder="Jakarta, Indonesia" value={cvData.profile.location}
              onChange={(e) => updateProfile('location', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-linkedin">LinkedIn</Label>
            <Input id="profile-linkedin" placeholder="linkedin.com/in/budisantoso" value={cvData.profile.linkedin}
              onChange={(e) => updateProfile('linkedin', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-portfolio">Portfolio/Website</Label>
            <Input id="profile-portfolio" placeholder="budisantoso.com" value={cvData.profile.portfolio}
              onChange={(e) => updateProfile('portfolio', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-dob">Tanggal Lahir (opsional)</Label>
            <DatePicker
              id="profile-dob"
              value={cvData.profile.dateOfBirth || ''}
              onChange={(v) => updateProfile('dateOfBirth', v)}
              toDate={new Date()}
              placeholder="Pilih tanggal lahir"
            />
            <p className="text-xs text-muted-foreground">
              Hanya digunakan untuk menghitung usia. Tidak disimpan sebagai tanggal eksplisit di CV.
            </p>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-summary">Ringkasan Profesional</Label>
              <InlineAISuggestChip label="Saran AI" onClick={aiSuggestSummary} />
            </div>
            <Textarea
              id="profile-summary"
              placeholder="Tulis ringkasan singkat tentang latar belakang profesional dan tujuan karir Anda..."
              value={cvData.profile.summary}
              onChange={(e) => updateProfile('summary', e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
