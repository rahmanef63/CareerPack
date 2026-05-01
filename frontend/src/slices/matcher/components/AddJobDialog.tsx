"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Loader2, Plus, Wand2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { notify } from "@/shared/lib/notify";

interface ParsedJob {
  title?: unknown;
  company?: unknown;
  location?: unknown;
  workMode?: unknown;
  employmentType?: unknown;
  seniority?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  currency?: unknown;
  description?: unknown;
  requiredSkills?: unknown;
  applyUrl?: unknown;
}

interface FormState {
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  seniority: string;
  description: string;
  skillsCsv: string;
  applyUrl: string;
  salaryMin: string;
  salaryMax: string;
  currency: string;
}

const EMPTY: FormState = {
  title: "",
  company: "",
  location: "",
  workMode: "onsite",
  employmentType: "full-time",
  seniority: "mid-level",
  description: "",
  skillsCsv: "",
  applyUrl: "",
  salaryMin: "",
  salaryMax: "",
  currency: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function AddJobDialog({ open, onOpenChange, onCreated }: Props) {
  const parseJob = useAction(api.matcher.external.parseJobFromText);
  const addJob = useMutation(api.matcher.external.addUserJob);

  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const reset = () => {
    setPasteText("");
    setParsing(false);
    setSubmitting(false);
    setForm(EMPTY);
  };

  const handleParse = async () => {
    const trimmed = pasteText.trim();
    if (trimmed.length < 80) {
      notify.error("Teks lowongan terlalu pendek — minimal 80 karakter.");
      return;
    }
    setParsing(true);
    try {
      const parsed = (await parseJob({ text: trimmed })) as ParsedJob;
      setForm(parsedToForm(parsed));
      notify.success("Lowongan ter-parse — periksa lalu simpan");
    } catch (err) {
      notify.fromError(err, "Gagal parse lowongan");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (form.title.trim().length < 2 || form.company.trim().length < 1) {
      notify.error("Judul dan perusahaan wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await addJob({
        title: form.title,
        company: form.company,
        location: form.location || "—",
        workMode: form.workMode,
        employmentType: form.employmentType,
        seniority: form.seniority,
        description: form.description,
        requiredSkills: form.skillsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 30),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        currency: form.currency || undefined,
        applyUrl: form.applyUrl || undefined,
      });
      notify.success("Lowongan ditambahkan", {
        description: `${form.title} · ${form.company}`,
      });
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan lowongan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <ResponsiveDialogContent className="sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Tambah Lowongan</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Tempel deskripsi lowongan dari LinkedIn / JobStreet / Kalibrr / sumber lain.
            AI ekstrak field-nya, kamu bisa edit sebelum simpan.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="paste">Tempel teks JD</Label>
            <Textarea
              id="paste"
              rows={5}
              placeholder="Tempel deskripsi lowongan di sini (judul + perusahaan + responsibilities + requirements)…"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              disabled={parsing || submitting}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {pasteText.length} karakter · minimal 80
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParse}
                disabled={parsing || pasteText.trim().length < 80}
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memparse…</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Parse Otomatis</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Judul *" id="title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              <Field label="Perusahaan *" id="company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
              <Field label="Lokasi" id="location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              <SelectField
                label="Mode kerja"
                id="workMode"
                value={form.workMode}
                onChange={(v) => setForm({ ...form, workMode: v })}
                options={[
                  { value: "remote", label: "Remote" },
                  { value: "hybrid", label: "Hybrid" },
                  { value: "onsite", label: "On-site" },
                ]}
              />
              <SelectField
                label="Tipe"
                id="employmentType"
                value={form.employmentType}
                onChange={(v) => setForm({ ...form, employmentType: v })}
                options={[
                  { value: "full-time", label: "Full-time" },
                  { value: "part-time", label: "Part-time" },
                  { value: "contract", label: "Contract" },
                  { value: "internship", label: "Internship" },
                ]}
              />
              <SelectField
                label="Seniority"
                id="seniority"
                value={form.seniority}
                onChange={(v) => setForm({ ...form, seniority: v })}
                options={[
                  { value: "junior", label: "Junior" },
                  { value: "mid-level", label: "Mid-level" },
                  { value: "senior", label: "Senior" },
                  { value: "lead", label: "Lead" },
                ]}
              />
              <Field label="Salary min" id="salaryMin" type="number" value={form.salaryMin} onChange={(v) => setForm({ ...form, salaryMin: v })} />
              <Field label="Salary max" id="salaryMax" type="number" value={form.salaryMax} onChange={(v) => setForm({ ...form, salaryMax: v })} />
              <Field label="Currency" id="currency" placeholder="IDR / USD" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} />
              <Field label="Apply URL" id="applyUrl" value={form.applyUrl} onChange={(v) => setForm({ ...form, applyUrl: v })} />
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="React, TypeScript, Node.js, …"
                value={form.skillsCsv}
                onChange={(e) => setForm({ ...form, skillsCsv: e.target.value })}
              />
            </div>
            <div className="mt-3 space-y-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea
                id="desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || form.title.trim().length < 2 || form.company.trim().length < 1}
            className="bg-brand hover:bg-brand"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan…</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Tambah Lowongan</span>
              </>
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, id, value, onChange, placeholder, type }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}

function SelectField({ label, id, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <ResponsiveSelect value={value} onValueChange={onChange}>
        <ResponsiveSelectTrigger id={id} />
        <ResponsiveSelectContent drawerTitle={label}>
          {options.map((o) => (
            <ResponsiveSelectItem key={o.value} value={o.value}>
              {o.label}
            </ResponsiveSelectItem>
          ))}
        </ResponsiveSelectContent>
      </ResponsiveSelect>
    </div>
  );
}

function parsedToForm(parsed: ParsedJob): FormState {
  const str = (v: unknown): string => (typeof v === "string" ? v : "");
  const num = (v: unknown): string => {
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    if (typeof v === "string" && /^\d+$/.test(v)) return v;
    return "";
  };
  const arr = (v: unknown): string =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").join(", ") : "";
  return {
    title: str(parsed.title),
    company: str(parsed.company),
    location: str(parsed.location),
    workMode: ["remote", "hybrid", "onsite"].includes(str(parsed.workMode))
      ? str(parsed.workMode)
      : "onsite",
    employmentType: ["full-time", "part-time", "contract", "internship"].includes(str(parsed.employmentType))
      ? str(parsed.employmentType)
      : "full-time",
    seniority: ["junior", "mid-level", "senior", "lead"].includes(str(parsed.seniority))
      ? str(parsed.seniority)
      : "mid-level",
    description: str(parsed.description),
    skillsCsv: arr(parsed.requiredSkills),
    applyUrl: str(parsed.applyUrl),
    salaryMin: num(parsed.salaryMin),
    salaryMax: num(parsed.salaryMax),
    currency: str(parsed.currency),
  };
}
