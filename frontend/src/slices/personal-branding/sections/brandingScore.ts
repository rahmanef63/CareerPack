import type { BrandingPayload } from "../themes";

export type Severity = "required" | "recommended" | "optional";

export interface ScoreRow {
  /** Stable key for telemetry / tests. */
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  source: string;
  severity: Severity;
  earned: number;
  weight: number;
  /** Coach-style suggestion when not optimal. */
  hint?: string;
  /** Where the user should go to fix this row. Either an in-page
   *  anchor (e.g. `#pb-section-identity`) when the field lives on the
   *  Personal Branding form, or a dashboard route (e.g.
   *  `/dashboard/cv`) when the source data lives elsewhere. */
  actionHref?: string;
  /** Friendly call-to-action label paired with `actionHref`. */
  actionLabel?: string;
}

export interface BrandingScore {
  rows: ReadonlyArray<ScoreRow>;
  earned: number;
  weight: number;
  /** 0-100, rounded. */
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  /** Required-tier rows that did not earn full weight. */
  requiredMissing: ReadonlyArray<ScoreRow>;
}

/**
 * Where each row's data lives. In-page anchors point at an `id` on
 * the relevant section card in PersonalBrandingView (added by
 * `pb-section-<key>` ids). External routes deep-link to the slice
 * that owns the source data (Settings → ProfileSection, CV editor,
 * Portfolio).
 */
const ACTION_BY_KEY: Record<
  string,
  { href: string; label: string } | undefined
> = {
  name: { href: "/dashboard/settings", label: "Buka Profil" },
  headline: { href: "#pb-section-identity", label: "Isi headline" },
  "target-role": { href: "/dashboard/settings", label: "Atur target role" },
  avatar: { href: "/dashboard/settings", label: "Upload foto" },
  bio: { href: "/dashboard/settings", label: "Tulis bio" },
  summary: { href: "/dashboard/cv", label: "Edit summary CV" },
  location: { href: "/dashboard/settings", label: "Set lokasi" },
  skills: { href: "/dashboard/cv", label: "Tambah skill" },
  experience: { href: "/dashboard/cv", label: "Tambah pengalaman" },
  achievements: { href: "/dashboard/cv", label: "Edit achievements" },
  projects: { href: "/dashboard/portfolio", label: "Tambah proyek" },
  "project-cover": { href: "/dashboard/portfolio", label: "Upload cover" },
  education: { href: "/dashboard/cv", label: "Tambah pendidikan" },
  certifications: { href: "/dashboard/cv", label: "Tambah sertifikasi" },
  languages: { href: "/dashboard/cv", label: "Tambah bahasa" },
  "contact-email": { href: "#pb-section-contact", label: "Isi email" },
  "contact-linkedin": { href: "#pb-section-contact", label: "Isi LinkedIn" },
  "contact-portfolio": { href: "#pb-section-contact", label: "Isi Portfolio" },
};

/**
 * Pure function — same input → same score. Extracted from
 * BrandingValidationCard so we can unit-test the scoring math
 * independent of React rendering.
 */
export function scoreBranding(branding: BrandingPayload): BrandingScore {
  const id = branding.identity;
  const has = branding.has;

  const projectsWithImage = branding.projects.filter(
    (p) => Boolean(p.coverUrl) || Boolean(p.coverEmoji),
  ).length;
  const projectsCount = branding.projects.length;

  function listScore(count: number, ideal: number, weight: number): number {
    if (count <= 0) return 0;
    if (count >= ideal) return weight;
    return Math.round((count / ideal) * weight);
  }

  const rows: ScoreRow[] = [
    {
      key: "name",
      label: "Nama lengkap",
      ok: id.name.trim().length > 0,
      detail: id.name.trim() || "kosong",
      source: "Profil → Nama lengkap",
      severity: "required",
      weight: 10,
      earned: id.name.trim().length > 0 ? 10 : 0,
      hint: id.name.trim() ? undefined : "Wajib — tanpa ini hero kosong",
    },
    {
      key: "headline",
      label: "Headline",
      ok: id.headline.trim().length >= 30,
      detail: id.headline.trim()
        ? `${id.headline.length} karakter`
        : "kosong",
      source: "Personal Branding → Headline",
      severity: "required",
      weight: 10,
      earned:
        id.headline.length === 0
          ? 0
          : id.headline.length >= 60
            ? 10
            : id.headline.length >= 30
              ? 7
              : 4,
      hint:
        id.headline.length < 30
          ? "Min 30 karakter — jelaskan value proposition + role target"
          : undefined,
    },
    {
      key: "target-role",
      label: "Target role",
      ok: id.targetRole.trim().length > 0,
      detail: id.targetRole.trim() || "kosong / toggle off",
      source: "Profil → Target role + toggle",
      severity: "required",
      weight: 6,
      earned: id.targetRole.trim().length > 0 ? 6 : 0,
      hint: id.targetRole.trim()
        ? undefined
        : "Aktifkan toggle 'Tampilkan target role' + isi di Profil",
    },
    {
      key: "avatar",
      label: "Avatar / foto",
      ok: Boolean(id.avatarUrl),
      detail: id.avatarUrl ? "terupload" : "belum upload / toggle off",
      source: "Profil → Avatar + toggle",
      severity: "recommended",
      weight: 8,
      earned: id.avatarUrl ? 8 : 0,
      hint: id.avatarUrl
        ? undefined
        : "Foto profesional 1:1 atau 4:5 — meningkatkan trust 2-3x",
    },
    {
      key: "bio",
      label: "Bio singkat",
      ok: branding.about.bio.trim().length >= 80,
      detail: branding.about.bio.trim()
        ? `${branding.about.bio.length} karakter`
        : "kosong / toggle off",
      source: "Profil → Bio + toggle",
      severity: "recommended",
      weight: 5,
      earned:
        branding.about.bio.length === 0
          ? 0
          : branding.about.bio.length >= 200
            ? 5
            : branding.about.bio.length >= 80
              ? 3
              : 1,
      hint:
        branding.about.bio.length < 80
          ? "Idealnya 200-400 karakter, ceritakan sudut pandang unik"
          : undefined,
    },
    {
      key: "summary",
      label: "Summary CV",
      ok: branding.about.summary.trim().length >= 80,
      detail: branding.about.summary.trim()
        ? `${branding.about.summary.length} karakter`
        : "kosong",
      source: "CV → Personal info → Summary",
      severity: "recommended",
      weight: 4,
      earned:
        branding.about.summary.length === 0
          ? 0
          : branding.about.summary.length >= 150
            ? 4
            : 2,
      hint:
        branding.about.summary.length < 80
          ? "Minimal 80 karakter — tampil di seksi About"
          : undefined,
    },
    {
      key: "location",
      label: "Lokasi",
      ok: id.location.trim().length > 0,
      detail: id.location.trim() || "kosong",
      source: "Profil → Lokasi",
      severity: "optional",
      weight: 2,
      earned: id.location.trim().length > 0 ? 2 : 0,
      hint: id.location.trim()
        ? undefined
        : "Kota/negara — recruiter sering filter berdasarkan lokasi",
    },
    {
      key: "skills",
      label: "Skills",
      ok: branding.skills.length >= 5,
      detail: has.skills ? `${branding.skills.length} skill` : "belum ada",
      source: "CV → Skills + Profil + toggle",
      severity: "recommended",
      weight: 8,
      earned: listScore(branding.skills.length, 8, 8),
      hint:
        branding.skills.length < 5
          ? "Minimal 5 skill, ideal 8+ — gabung dari CV + skill profil"
          : branding.skills.length < 8
            ? "Tambah lagi sampai 8+ untuk tampilan grid yang penuh"
            : undefined,
    },
    {
      key: "experience",
      label: "Pengalaman",
      ok: branding.experience.length >= 2,
      detail: has.experience
        ? `${branding.experience.length} entri`
        : "belum ada",
      source: "CV → Experience",
      severity: "required",
      weight: 12,
      earned: listScore(branding.experience.length, 3, 12),
      hint:
        branding.experience.length === 0
          ? "Wajib min 1 — visitor menilai dari rentang karir"
          : branding.experience.length < 3
            ? "Idealnya 3 pengalaman, masing-masing dengan achievements"
            : undefined,
    },
    {
      key: "achievements",
      label: "Achievements per pengalaman",
      ok:
        branding.experience.length === 0
          ? false
          : branding.experience.every((e) => e.achievements.length >= 2),
      detail:
        branding.experience.length === 0
          ? "—"
          : `${branding.experience.filter((e) => e.achievements.length >= 2).length}/${branding.experience.length} entri ≥2 bullet`,
      source: "CV → Experience → Achievements",
      severity: "recommended",
      weight: 5,
      earned:
        branding.experience.length === 0
          ? 0
          : Math.round(
              (branding.experience.filter((e) => e.achievements.length >= 2)
                .length /
                branding.experience.length) *
                5,
            ),
      hint:
        branding.experience.length === 0
          ? undefined
          : branding.experience.some((e) => e.achievements.length < 2)
            ? "Setiap role idealnya ada 2-4 bullet achievement (kuantitatif)"
            : undefined,
    },
    {
      key: "projects",
      label: "Proyek / portofolio",
      ok: projectsCount >= 3,
      detail: has.projects ? `${projectsCount} proyek` : "belum ada",
      source: "Portofolio + CV → Projects",
      severity: "required",
      weight: 12,
      earned: listScore(projectsCount, 3, 12),
      hint:
        projectsCount === 0
          ? "Wajib min 3 — visitor cari bukti kerja, bukan klaim"
          : projectsCount < 3
            ? `Tambah ${3 - projectsCount} proyek lagi untuk minimum yang direkomendasikan`
            : undefined,
    },
    {
      key: "project-cover",
      label: "Cover gambar proyek",
      ok: projectsCount > 0 && projectsWithImage >= Math.min(3, projectsCount),
      detail:
        projectsCount === 0
          ? "—"
          : `${projectsWithImage}/${projectsCount} ada cover`,
      source: "Portofolio → Cover (upload gambar atau emoji)",
      severity: "recommended",
      weight: 6,
      earned:
        projectsCount === 0
          ? 0
          : Math.round((projectsWithImage / projectsCount) * 6),
      hint:
        projectsCount === 0
          ? undefined
          : projectsWithImage < projectsCount
            ? "Upload cover image (lebih kuat) atau emoji untuk setiap proyek"
            : undefined,
    },
    {
      key: "education",
      label: "Pendidikan",
      ok: branding.education.length >= 1,
      detail: has.education
        ? `${branding.education.length} entri`
        : "belum ada",
      source: "CV → Education",
      severity: "optional",
      weight: 3,
      earned: branding.education.length > 0 ? 3 : 0,
      hint:
        branding.education.length === 0
          ? "Min 1 entri — terutama untuk fresh grad / career switch"
          : undefined,
    },
    {
      key: "certifications",
      label: "Sertifikasi",
      ok: branding.certifications.length >= 1,
      detail: has.certifications
        ? `${branding.certifications.length} entri`
        : "belum ada",
      source: "CV → Certifications",
      severity: "optional",
      weight: 3,
      earned: listScore(branding.certifications.length, 2, 3),
      hint:
        branding.certifications.length === 0
          ? "Tambah sertifikasi industri (AWS, GCP, Scrum, etc.)"
          : undefined,
    },
    {
      key: "languages",
      label: "Bahasa",
      ok: branding.languages.length >= 1,
      detail: has.languages
        ? `${branding.languages.length} entri`
        : "belum ada",
      source: "CV → Languages",
      severity: "optional",
      weight: 2,
      earned: branding.languages.length > 0 ? 2 : 0,
      hint:
        branding.languages.length === 0
          ? "Min 1 bahasa — penting untuk role yang serve cross-border"
          : undefined,
    },
    {
      key: "contact-email",
      label: "Email kontak",
      ok: id.contact.email.trim().length > 0,
      detail: id.contact.email.trim() || "belum",
      source: "Personal Branding → Email kontak",
      severity: "required",
      weight: 4,
      earned: id.contact.email.trim().length > 0 ? 4 : 0,
      hint: id.contact.email.trim()
        ? undefined
        : "Tanpa email, visitor tidak bisa kontak balik",
    },
    {
      key: "contact-linkedin",
      label: "LinkedIn",
      ok: id.contact.linkedin.trim().length > 0,
      detail: id.contact.linkedin.trim() ? "tersedia" : "belum",
      source: "Personal Branding → LinkedIn URL",
      severity: "recommended",
      weight: 4,
      earned: id.contact.linkedin.trim().length > 0 ? 4 : 0,
      hint: id.contact.linkedin.trim()
        ? undefined
        : "URL LinkedIn — recruiter cek profil ini 90% dari waktu",
    },
    {
      key: "contact-portfolio",
      label: "Portfolio URL",
      ok: id.contact.portfolio.trim().length > 0,
      detail: id.contact.portfolio.trim() ? "tersedia" : "belum",
      source: "Personal Branding → Portfolio URL",
      severity: "optional",
      weight: 2,
      earned: id.contact.portfolio.trim().length > 0 ? 2 : 0,
    },
  ];

  for (const r of rows) {
    const a = ACTION_BY_KEY[r.key];
    if (a) {
      r.actionHref = a.href;
      r.actionLabel = a.label;
    }
  }
  const earned = rows.reduce((s, r) => s + r.earned, 0);
  const weight = rows.reduce((s, r) => s + r.weight, 0);
  const score = Math.round((earned / weight) * 100);
  const grade: BrandingScore["grade"] =
    score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "E";
  const requiredMissing = rows.filter(
    (r) => r.severity === "required" && r.earned < r.weight,
  );

  return { rows, earned, weight, score, grade, requiredMissing };
}
