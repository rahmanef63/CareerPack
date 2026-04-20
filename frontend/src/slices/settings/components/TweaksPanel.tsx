"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Type,
  LayoutPanelTop,
  Sun,
  Moon,
  Monitor,
  UserRound,
  Plus,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import {
  useUIPrefs,
  type AIButtonStyle,
  type FontScale,
  type NavStyle,
} from "@/shared/hooks/useUIPrefs";

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
}

/**
 * Segmented control berbasis shadcn `ToggleGroup` (type="single"),
 * sehingga a11y (role=radiogroup, arrow-key nav) otomatis.
 */
function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={ariaLabel}
      variant="outline"
      className="w-full"
    >
      {options.map((opt) => (
        <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1">
          {opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const AI_STYLE_OPTIONS: ReadonlyArray<SegmentedOption<AIButtonStyle>> = [
  { value: "solid", label: "Polos" },
  { value: "gradient", label: "Gradien" },
  { value: "glow", label: "Berpendar" },
];

const FONT_OPTIONS: ReadonlyArray<SegmentedOption<FontScale>> = [
  { value: "compact", label: "Kecil" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Besar" },
];

const NAV_OPTIONS: ReadonlyArray<SegmentedOption<NavStyle>> = [
  { value: "flat", label: "Datar" },
  { value: "floating", label: "Melayang" },
  { value: "notched", label: "Lekukan" },
];

export function TweaksPanel() {
  const prefs = useUIPrefs();
  const { theme, setTheme } = useTheme();
  const themeMode: ThemeMode =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Penyesuaian Tampilan</h1>
        <p className="text-sm text-muted-foreground">
          Personalisasi tampilan aplikasi sesuai selera Anda. Perubahan langsung tersimpan.
        </p>
      </header>

      <ProfileCard />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-4 h-4 text-brand dark:hidden" />
            <Moon className="w-4 h-4 text-brand hidden dark:inline" />
            Mode Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ToggleGroup
            type="single"
            value={themeMode}
            onValueChange={(next) => {
              if (next) setTheme(next);
            }}
            aria-label="Mode tampilan"
            variant="outline"
            className="w-full"
          >
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="flex-1 gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground mt-2">
            Pilih <strong>Sistem</strong> agar mengikuti preferensi perangkat Anda.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" /> Gaya Tombol AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<AIButtonStyle>
            value={prefs.aiButtonStyle}
            onChange={prefs.setAIButtonStyle}
            options={AI_STYLE_OPTIONS}
            ariaLabel="Gaya tombol AI"
          />
          <PreviewFab style={prefs.aiButtonStyle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4 text-brand" /> Ukuran Huruf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<FontScale>
            value={prefs.fontScale}
            onChange={prefs.setFontScale}
            options={FONT_OPTIONS}
            ariaLabel="Ukuran huruf"
          />
          <p className="text-sm text-muted-foreground">
            Contoh:{" "}
            <span className="font-medium text-foreground">
              Halo, ini ukuran huruf Anda saat ini.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutPanelTop className="w-4 h-4 text-brand" /> Gaya Bar Navigasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Segmented<NavStyle>
            value={prefs.navStyle}
            onChange={prefs.setNavStyle}
            options={NAV_OPTIONS}
            ariaLabel="Gaya bar navigasi"
          />
          <p className="text-xs text-muted-foreground">
            Lihat ke bar navigasi di bawah — perubahan langsung terlihat.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={prefs.reset}>
          Kembalikan ke Bawaan
        </Button>
      </div>
    </div>
  );
}

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

function ProfileCard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const saveProfile = useMutation(api.users.createOrUpdateProfile);

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  useEffect(() => {
    if (!hydrated && currentUser?.profile) {
      const p = currentUser.profile;
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
      setHydrated(true);
    }
  }, [currentUser, hydrated]);

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
      toast.error("Nama Lengkap wajib diisi");
      return;
    }
    if (!profile.location.trim()) {
      toast.error("Lokasi wajib diisi");
      return;
    }
    if (!profile.targetRole.trim()) {
      toast.error("Target Role wajib diisi");
      return;
    }
    if (!profile.experienceLevel.trim()) {
      toast.error("Level Pengalaman wajib diisi");
      return;
    }
    setSaving(true);
    try {
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
      toast.success("Profil tersimpan");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan profil";
      toast.error(msg);
    } finally {
      setSaving(false);
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
            <select
              id="profile-experienceLevel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={profile.experienceLevel}
              onChange={(e) => setField("experienceLevel", e.target.value)}
            >
              <option value="">— Pilih level —</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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

function PreviewFab({ style }: { style: AIButtonStyle }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
      <div data-ai-btn={style} className="relative">
        <div className="ai-fab-bg w-12 h-12 rounded-full flex items-center justify-center text-brand-foreground">
          <Sparkles className="w-6 h-6 relative z-10" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pratinjau tombol AI</p>
    </div>
  );
}
