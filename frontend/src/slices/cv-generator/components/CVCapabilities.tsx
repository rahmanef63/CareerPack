"use client";

import { useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface CreateCVPayload {
  title: string;
  template: string;
}

interface AddExperiencePayload {
  cvId?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface AddSkillsPayload {
  cvId?: string;
  skills: string[];
  category?: string;
}

interface UpdateSummaryPayload {
  cvId?: string;
  summary: string;
}

interface DeleteCVPayload {
  cvId: string;
}

interface ImportFromTextPayload {
  text: string;
}

const VALID_TEMPLATES = new Set(["modern", "classic", "minimal"]);

/**
 * CV capability binder — wires manifest skills to backend mutations.
 * `cv.import-from-text` chains parseImportText action → quickFill
 * mutation, mirroring the manual "Isi Cepat dengan AI" UX flow but
 * driven by the agent.
 */
export function CVCapabilities() {
  const createCV = useMutation(api.cv.mutations.createCV);
  const appendExperience = useMutation(api.cv.mutations.appendExperience);
  const appendSkills = useMutation(api.cv.mutations.appendSkills);
  const setSummary = useMutation(api.cv.mutations.setSummary);
  const deleteCV = useMutation(api.cv.mutations.deleteCV);
  const parseImportText = useAction(api.ai.actions.parseImportText);
  const quickFill = useMutation(api.onboarding.mutations.quickFill);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<CreateCVPayload>("cv.create", async (a) => {
        const title = String(a.payload.title ?? "").trim();
        const rawTemplate = String(a.payload.template ?? "modern").toLowerCase();
        const template = VALID_TEMPLATES.has(rawTemplate) ? rawTemplate : "modern";
        if (!title) {
          notify.validation("Judul CV wajib");
          return;
        }
        try {
          await createCV({ title, template });
          notify.success(`CV "${title}" dibuat`);
        } catch (err) {
          notify.fromError(err, "Gagal buat CV");
        }
      }),
    );

    unsubs.push(
      subscribe<AddExperiencePayload>("cv.add-experience", async (a) => {
        const p = a.payload;
        const company = String(p.company ?? "").trim();
        const position = String(p.position ?? "").trim();
        const startDate = String(p.startDate ?? "").trim();
        if (!company || !position || !startDate) {
          notify.validation("Company, position, startDate wajib");
          return;
        }
        try {
          await appendExperience({
            cvId: p.cvId ? (p.cvId as Id<"cvs">) : undefined,
            company,
            position,
            startDate,
            endDate: p.endDate ? String(p.endDate).trim() : undefined,
            current: p.current === true,
            description: p.description ? String(p.description).trim() : undefined,
          });
          notify.success(`Pengalaman "${position} @ ${company}" ditambahkan`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah pengalaman");
        }
      }),
    );

    unsubs.push(
      subscribe<AddSkillsPayload>("cv.add-skills", async (a) => {
        const p = a.payload;
        const skills = Array.isArray(p.skills)
          ? p.skills.map((s) => String(s).trim()).filter(Boolean)
          : [];
        if (skills.length === 0) {
          notify.validation("Skill kosong");
          return;
        }
        try {
          const r = await appendSkills({
            cvId: p.cvId ? (p.cvId as Id<"cvs">) : undefined,
            skills,
            category: p.category ? String(p.category).trim() : undefined,
          });
          notify.success(`${r.added} skill ditambahkan`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah skill");
        }
      }),
    );

    unsubs.push(
      subscribe<UpdateSummaryPayload>("cv.update-summary", async (a) => {
        const summary = String(a.payload.summary ?? "").trim();
        if (!summary) {
          notify.validation("Ringkasan kosong");
          return;
        }
        try {
          await setSummary({
            cvId: a.payload.cvId ? (a.payload.cvId as Id<"cvs">) : undefined,
            summary,
          });
          notify.success("Ringkasan CV diperbarui");
        } catch (err) {
          notify.fromError(err, "Gagal update ringkasan");
        }
      }),
    );

    unsubs.push(
      subscribe<DeleteCVPayload>("cv.delete", async (a) => {
        const cvId = String(a.payload.cvId ?? "").trim();
        if (!cvId) {
          notify.validation("cvId wajib");
          return;
        }
        try {
          await deleteCV({ cvId: cvId as Id<"cvs"> });
          notify.success("CV dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus CV");
        }
      }),
    );

    unsubs.push(
      subscribe<ImportFromTextPayload>("cv.import-from-text", async (a) => {
        const text = String(a.payload.text ?? "").trim();
        if (text.length < 40) {
          notify.validation("Teks terlalu pendek (min 40 karakter)");
          return;
        }
        try {
          notify.info("Memparsing teks…");
          const payload = await parseImportText({ text });
          const result = await quickFill({ payload, scope: "all" });
          const parts: string[] = [];
          if (result.profile) parts.push("profil");
          if (result.cv) parts.push("CV");
          if (result.portfolio.added > 0)
            parts.push(`${result.portfolio.added} portofolio`);
          if (result.goals.added > 0) parts.push(`${result.goals.added} goal`);
          if (result.applications.added > 0)
            parts.push(`${result.applications.added} lamaran`);
          if (result.contacts.added > 0)
            parts.push(`${result.contacts.added} kontak`);
          notify.success(
            parts.length > 0
              ? `Isi cepat selesai: ${parts.join(", ")}`
              : "Tidak ada data yang bisa diekstrak",
          );
          if (result.warnings.length > 0) {
            notify.info(result.warnings.slice(0, 2).join(" · "));
          }
        } catch (err) {
          notify.fromError(err, "Gagal isi cepat dari teks");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [
    createCV,
    appendExperience,
    appendSkills,
    setSummary,
    deleteCV,
    parseImportText,
    quickFill,
  ]);

  return null;
}
