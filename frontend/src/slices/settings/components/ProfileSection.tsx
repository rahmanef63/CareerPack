"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, UserRound, X } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoProfileOverlay } from "@/shared/hooks/useDemoOverlay";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { FileUpload } from "@/shared/components/files/FileUpload";

interface ProfileState {
  fullName: string;
  phone: string;
  location: string;
  targetRole: string;
  experienceLevel: string;
  bio: string;
  skills: string[];
  interests: string[];
}

const EMPTY_PROFILE: ProfileState = {
  fullName: "",
  phone: "",
  location: "",
  targetRole: "",
  experienceLevel: "",
  bio: "",
  skills: [],
  interests: [],
};

const EXPERIENCE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "entry", label: "Entry (0-2 thn)" },
  { value: "mid", label: "Menengah (2-5 thn)" },
  { value: "senior", label: "Senior (5+ thn)" },
  { value: "lead", label: "Lead / Principal" },
];

export function ProfileSection() {
  const { state: authState } = useAuth();
  const isAuthenticated = authState.isAuthenticated;
  const isDemo = authState.isDemo;

  const currentUser = useQuery(
    api.profile.queries.getCurrentUser,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const saveProfile = useMutation(api.profile.mutations.createOrUpdateProfile);
  const updateAvatar = useMutation(api.profile.mutations.updateAvatar);

  const demoProfile = useDemoProfileOverlay();

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const hasProfile = isDemo ? true : !!currentUser?.profile;
  const avatarUrl = isDemo ? null : currentUser?.avatarUrl ?? null;

  // Re-hydrate whenever the upstream profile content changes. One-shot
  // boolean missed the QuickFill case where Convex patches the profile
  // while this form is open. We key on a fingerprint of the meaningful
  // fields — stable while the user types locally (Convex copy hasn't
  // changed), updates when the server actually patches.
  useEffect(() => {
    if (isDemo) {
      if (hydratedFrom !== "demo") {
        setProfile(demoProfile.profile);
        setHydratedFrom("demo");
      }
      return;
    }
    if (currentUser?.profile) {
      const p = currentUser.profile;
      const fingerprint = [
        p.fullName ?? "",
        p.targetRole ?? "",
        p.location ?? "",
        p.experienceLevel ?? "",
        p.bio ?? "",
        (p.skills ?? []).join(","),
        (p.interests ?? []).join(","),
      ].join("|");
      if (hydratedFrom === fingerprint) return;
      setProfile({
        fullName: p.fullName ?? "",
        phone: p.phone ?? "",
        location: p.location ?? "",
        targetRole: p.targetRole ?? "",
        experienceLevel: p.experienceLevel ?? "",
        bio: p.bio ?? "",
        skills: p.skills ?? [],
        interests: p.interests ?? [],
      });
      setHydratedFrom(fingerprint);
    }
  }, [currentUser, hydratedFrom, isDemo, demoProfile.profile]);

  const setField = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const addChip = (kind: "skills" | "interests", raw: string) => {
    const v = raw.trim();
    if (!v) return;
    setProfile((prev) =>
      prev[kind].includes(v) ? prev : { ...prev, [kind]: [...prev[kind], v] },
    );
  };

  const removeChip = (kind: "skills" | "interests", v: string) => {
    setProfile((prev) => ({ ...prev, [kind]: prev[kind].filter((x) => x !== v) }));
  };

  const handleSave = async () => {
    if (!profile.fullName.trim()) {
      notify.validation("Nama Lengkap wajib diisi");
      return;
    }
    if (!profile.location.trim()) {
      notify.validation("Lokasi wajib diisi");
      return;
    }
    if (!profile.targetRole.trim()) {
      notify.validation("Target Role wajib diisi");
      return;
    }
    if (!profile.experienceLevel.trim()) {
      notify.validation("Level Pengalaman wajib diisi");
      return;
    }
    setSaving(true);
    try {
      if (isDemo) {
        await demoProfile.save({
          ...profile,
          fullName: profile.fullName.trim(),
          phone: profile.phone.trim(),
          location: profile.location.trim(),
          targetRole: profile.targetRole.trim(),
          bio: profile.bio.trim(),
        });
      } else {
        await saveProfile({
          fullName: profile.fullName.trim(),
          phone: profile.phone.trim() || undefined,
          location: profile.location.trim(),
          targetRole: profile.targetRole.trim(),
          experienceLevel: profile.experienceLevel,
          bio: profile.bio.trim() || undefined,
          skills: profile.skills,
          interests: profile.interests,
        });
        notify.success("Profil tersimpan");
      }
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploaded = async (result: { storageId: string }) => {
    try {
      await updateAvatar({ storageId: result.storageId });
      notify.success("Foto profil diperbarui");
    } catch (err) {
      notify.fromError(err, "Gagal memperbarui foto");
    }
  };

  const handleAvatarClear = async () => {
    try {
      await updateAvatar({ storageId: undefined });
      notify.success("Foto profil dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal menghapus foto");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="w-4 h-4 text-brand" /> Profil Saya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar — shown only after profile exists so the mutation
            has a row to patch. New users see a hint instead. */}
        <div className="space-y-2">
          <Label>Foto Profil</Label>
          {hasProfile ? (
            avatarUrl ? (
              <div className="flex items-start gap-3">
                <Image
                  src={avatarUrl}
                  alt="Foto profil"
                  width={80}
                  height={80}
                  unoptimized
                  className="w-20 h-20 rounded-full object-cover border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    Foto sekarang dipakai di sidebar dan publik (jika diaktifkan).
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAvatarClear}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Hapus foto
                  </Button>
                </div>
              </div>
            ) : (
              <FileUpload
                label=""
                accept="image/*"
                crop={{ aspect: 1 }}
                hint="Pilih gambar (JPG/PNG/WebP, maks 10 MB). Otomatis dipotong persegi + dikonversi ke WebP."
                onUploaded={handleAvatarUploaded}
              />
            )
          ) : (
            <p className="text-xs text-muted-foreground">
              Simpan profil dulu sebelum mengunggah foto.
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="profile-fullName">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-fullName"
              placeholder="Budi Santoso"
              value={profile.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-phone">Telepon</Label>
            <Input
              id="profile-phone"
              placeholder="+62 812 3456 7890"
              value={profile.phone}
              onChange={(e) => setField("phone", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-location">
              Lokasi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-location"
              placeholder="Jakarta, Indonesia"
              value={profile.location}
              onChange={(e) => setField("location", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-targetRole">
              Target Role <span className="text-destructive">*</span>
            </Label>
            <Input
              id="profile-targetRole"
              placeholder="Frontend Engineer"
              value={profile.targetRole}
              onChange={(e) => setField("targetRole", e.target.value)}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="profile-experienceLevel">
              Level Pengalaman <span className="text-destructive">*</span>
            </Label>
            <ResponsiveSelect
              value={profile.experienceLevel || undefined}
              onValueChange={(v) => setField("experienceLevel", v)}
            >
              <ResponsiveSelectTrigger
                id="profile-experienceLevel"
                placeholder="— Pilih level —"
              />
              <ResponsiveSelectContent drawerTitle="Level pengalaman">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <ResponsiveSelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              placeholder="Ceritakan latar belakang & minat profesional Anda..."
              value={profile.bio}
              onChange={(e) => setField("bio", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <ChipInput
          label="Skill"
          placeholder="Tambah skill (contoh: TypeScript)"
          items={profile.skills}
          value={skillInput}
          onChange={setSkillInput}
          onAdd={() => {
            addChip("skills", skillInput);
            setSkillInput("");
          }}
          onRemove={(v) => removeChip("skills", v)}
        />

        <ChipInput
          label="Minat"
          placeholder="Tambah minat (contoh: Open Source)"
          items={profile.interests}
          value={interestInput}
          onChange={setInterestInput}
          onAdd={() => {
            addChip("interests", interestInput);
            setInterestInput("");
          }}
          onRemove={(v) => removeChip("interests", v)}
        />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ChipInputProps {
  label: string;
  placeholder: string;
  items: string[];
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
}

function ChipInput({
  label,
  placeholder,
  items,
  value,
  onChange,
  onAdd,
  onRemove,
}: ChipInputProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="icon" onClick={onAdd} aria-label={`Tambah ${label}`}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1 pr-1">
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="rounded-sm hover:bg-background/60 p-0.5"
                aria-label={`Hapus ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
