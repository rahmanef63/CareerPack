"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, X } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { QuickFillButton } from "@/shared/components/onboarding";
import { cn } from "@/shared/lib/utils";
import { notify } from "@/shared/lib/notify";

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LEVELS = [
  { value: "junior", label: "Junior (0-2 tahun)" },
  { value: "mid-level", label: "Mid-level (2-5 tahun)" },
  { value: "senior", label: "Senior (5+ tahun)" },
  { value: "lead", label: "Lead / Principal" },
];

/**
 * 4-step quick-start wizard. Captures the highest-weight profile fields
 * (basics → target role → skills → CV import) so a fresh user lands on
 * a ProfileCompletenessCard already at ~70% within a minute. Hands off
 * to QuickFill for CV import — leverages the existing AI extractor
 * instead of duplicating its UI.
 */
export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const save = useMutation(api.profile.mutations.createOrUpdateProfile);

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("mid-level");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Hydrate from profile on first render.
  if (open && me?.profile && step === 0 && fullName === "" && me.profile.fullName) {
    setFullName(me.profile.fullName);
    setTargetRole(me.profile.targetRole ?? "");
    setLocation(me.profile.location ?? "");
    setLevel(me.profile.experienceLevel ?? "mid-level");
    setSkills(me.profile.skills ?? []);
  }

  const reset = () => {
    setStep(0);
  };

  const handleAddSkill = () => {
    const v = skillsInput.trim();
    if (!v) return;
    if (skills.includes(v)) return;
    if (skills.length >= 12) {
      notify.error("Maksimum 12 skill dulu — bisa tambah lebih banyak nanti");
      return;
    }
    setSkills([...skills, v]);
    setSkillsInput("");
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const handleSave = async (advance: boolean) => {
    setSaving(true);
    try {
      await save({
        fullName: fullName.trim() || "Anonymous",
        location: location.trim() || "—",
        targetRole: targetRole.trim() || "—",
        experienceLevel: level,
        skills,
        interests: me?.profile?.interests ?? [],
        bio: me?.profile?.bio,
      });
      if (advance) setStep((s) => s + 1);
      else notify.success("Tersimpan");
    } catch (err) {
      notify.fromError(err, "Gagal simpan");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const handleFinish = () => {
    notify.success("Setup selesai — selamat menggunakan CareerPack 🎉");
    handleClose();
  };

  const totalSteps = 4;
  const canNext0 = fullName.trim().length >= 2 && location.trim().length >= 2;
  const canNext1 = targetRole.trim().length >= 3;

  return (
    <ResponsiveDialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
      <ResponsiveDialogContent size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            Setup Cepat — 60 detik
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Empat langkah untuk personalisasi rekomendasi lowongan + ATS scan.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < step
                  ? "bg-brand"
                  : i === step
                    ? "bg-brand/60"
                    : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="min-h-[260px] py-2">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">1. Kenalan dulu</h3>
              <div className="space-y-2">
                <Label htmlFor="ow-name">Nama lengkap *</Label>
                <Input
                  id="ow-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="contoh: Rizky Pratama"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ow-loc">Kota / negara *</Label>
                <Input
                  id="ow-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Jakarta, Indonesia"
                />
                <p className="text-xs text-muted-foreground">
                  Dipakai untuk filter lowongan lokal vs remote.
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">2. Karir yang kamu kejar</h3>
              <div className="space-y-2">
                <Label htmlFor="ow-role">Target role *</Label>
                <Input
                  id="ow-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Frontend Engineer / Product Designer / …"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ow-level">Level pengalaman</Label>
                <ResponsiveSelect value={level} onValueChange={setLevel}>
                  <ResponsiveSelectTrigger id="ow-level" />
                  <ResponsiveSelectContent drawerTitle="Level pengalaman">
                    {LEVELS.map((o) => (
                      <ResponsiveSelectItem key={o.value} value={o.value}>
                        {o.label}
                      </ResponsiveSelectItem>
                    ))}
                  </ResponsiveSelectContent>
                </ResponsiveSelect>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">3. Skill teknis</h3>
              <p className="text-xs text-muted-foreground">
                Minimum 3 skill. Matcher ATS pakai ini untuk hitung % cocok.
              </p>
              <div className="flex gap-2">
                <Input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="React, TypeScript, Figma, …"
                />
                <Button type="button" variant="outline" onClick={handleAddSkill}>
                  Tambah
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1.5 pr-1">
                      {s}
                      <button
                        type="button"
                        aria-label={`Hapus ${s}`}
                        onClick={() => handleRemoveSkill(s)}
                        className="rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{skills.length} dari minimum 3</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">4. Import CV (opsional)</h3>
              <p className="text-sm text-muted-foreground">
                Punya CV existing? Paste teks atau upload PDF — AI ekstrak otomatis ke
                pengalaman, pendidikan, projects.
              </p>
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-brand" />
                <p className="mb-3 text-sm font-medium">Quick Fill — auto-import</p>
                <QuickFillButton variant="default" size="sm" className="bg-brand hover:bg-brand" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Bisa di-skip dan dilakukan nanti dari menu Quick Fill.
                </p>
              </div>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              className="gap-2"
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          )}
          {step === 0 && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={saving}
              className="text-muted-foreground"
            >
              Lewati
            </Button>
          )}
          {step < totalSteps - 1 ? (
            <Button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || (step === 0 && !canNext0) || (step === 1 && !canNext1)}
              className="gap-2 bg-brand hover:bg-brand"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan…</span>
                </>
              ) : (
                <>
                  <span>Lanjut</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleFinish} className="gap-2 bg-brand hover:bg-brand">
              <Check className="h-4 w-4" />
              Selesai
            </Button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
