/**
 * Auto-mode block generator.
 *
 * Given a user's existing data (profile + first CV + portfolio items)
 * and a set of opt-in toggles, builds a Block[] that renders into a
 * complete Linktree-style page through the same theme dispatcher the
 * Custom mode uses.
 *
 * Designed for non-technical users: zero block authoring, page stays
 * in sync with their CV / Portfolio because we rebuild on every read.
 *
 * Imported by:
 * - convex/profile/queries.ts → getBySlug (server branch when publicMode === "auto")
 * - frontend/src/slices/personal-branding/auto/* → preview + builder
 */

import type { Block } from "./blocks";

export interface AutoToggles {
  showExperience: boolean;
  showEducation: boolean;
  showCertifications: boolean;
  showProjects: boolean;
  showSocial: boolean;
  showLanguages: boolean;
}

/** Slim profile shape — only the fields we read from `userProfiles`. */
export interface AutoProfileInput {
  bio?: string;
  skills?: readonly string[];
  publicBioShow?: boolean;
  publicSkillsShow?: boolean;
  publicLinkedinUrl?: string;
  publicPortfolioUrl?: string;
  publicContactEmail?: string;
}

/** Slim CV shape — first/default CV's relevant fields. */
export interface AutoCVInput {
  experience?: ReadonlyArray<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
  }>;
  education?: ReadonlyArray<{
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  certifications?: ReadonlyArray<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
  projects?: ReadonlyArray<{
    name: string;
    description?: string;
    link?: string;
    technologies?: readonly string[];
  }>;
}

export interface AutoPortfolioItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  link?: string;
  date?: string;
  featured?: boolean;
  coverEmoji?: string;
  coverUrl?: string | null;
}

/** Stable id for auto-generated blocks. Combines section name +
 *  subindex so the renderer can React-key reliably across rebuilds. */
function aid(section: string, suffix: string | number = ""): string {
  return suffix === "" ? `auto-${section}` : `auto-${section}-${suffix}`;
}

function fmtMonth(s?: string): string {
  if (!s) return "";
  // Accept YYYY-MM or YYYY-MM-DD; render as "Mon YYYY".
  const [y, m] = s.split("-");
  if (!y) return s;
  if (!m) return y;
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const i = parseInt(m, 10) - 1;
  return `${months[i] ?? m} ${y}`;
}

export function buildAutoBlocks(input: {
  profile: AutoProfileInput;
  cv: AutoCVInput | null;
  portfolio: ReadonlyArray<AutoPortfolioItem>;
  toggles: AutoToggles;
  publicPortfolioShow: boolean;
}): Block[] {
  const { profile, cv, portfolio, toggles, publicPortfolioShow } = input;
  const blocks: Block[] = [];

  // ---- Tentang (bio) ------------------------------------------------
  if (profile.publicBioShow && profile.bio?.trim()) {
    blocks.push({
      id: aid("bio-h"),
      type: "heading",
      payload: { text: "Tentang", size: "lg" },
    });
    blocks.push({
      id: aid("bio"),
      type: "paragraph",
      payload: { text: profile.bio.trim() },
    });
  }

  // ---- Keterampilan -------------------------------------------------
  if (profile.publicSkillsShow && profile.skills && profile.skills.length > 0) {
    blocks.push({
      id: aid("skills-h"),
      type: "heading",
      payload: { text: "Keterampilan", size: "md" },
    });
    blocks.push({
      id: aid("skills"),
      type: "paragraph",
      payload: { text: profile.skills.join(" · ") },
    });
  }

  // ---- Pengalaman ---------------------------------------------------
  if (toggles.showExperience && cv?.experience && cv.experience.length > 0) {
    blocks.push({
      id: aid("exp-h"),
      type: "heading",
      payload: { text: "Pengalaman", size: "lg" },
    });
    cv.experience.forEach((e, i) => {
      const range = `${fmtMonth(e.startDate)} – ${e.current ? "Sekarang" : fmtMonth(e.endDate) || "Sekarang"}`;
      const lines: string[] = [];
      lines.push(`**${e.position}** — ${e.company}`);
      lines.push(`_${range}_`);
      if (e.description?.trim()) {
        lines.push("");
        lines.push(e.description.trim());
      }
      blocks.push({
        id: aid("exp", i),
        type: "paragraph",
        payload: { text: lines.join("\n") },
      });
    });
  }

  // ---- Pendidikan ---------------------------------------------------
  if (toggles.showEducation && cv?.education && cv.education.length > 0) {
    blocks.push({
      id: aid("edu-h"),
      type: "heading",
      payload: { text: "Pendidikan", size: "md" },
    });
    cv.education.forEach((e, i) => {
      const range = `${fmtMonth(e.startDate)} – ${fmtMonth(e.endDate) || "Sekarang"}`;
      const degree = [e.degree, e.field].filter((x) => x?.trim()).join(" — ");
      const lines: string[] = [];
      lines.push(`**${e.institution}**`);
      if (degree) lines.push(degree);
      lines.push(`_${range}_`);
      blocks.push({
        id: aid("edu", i),
        type: "paragraph",
        payload: { text: lines.join("\n") },
      });
    });
  }

  // ---- Sertifikasi --------------------------------------------------
  if (toggles.showCertifications && cv?.certifications && cv.certifications.length > 0) {
    blocks.push({
      id: aid("cert-h"),
      type: "heading",
      payload: { text: "Sertifikasi", size: "md" },
    });
    cv.certifications.forEach((c, i) => {
      const meta = [c.issuer, fmtMonth(c.date)].filter(Boolean).join(" · ");
      blocks.push({
        id: aid("cert", i),
        type: "paragraph",
        payload: {
          text: `**${c.name}**${meta ? `\n_${meta}_` : ""}`,
        },
      });
    });
  }

  // ---- Proyek (dari CV) --------------------------------------------
  if (toggles.showProjects && cv?.projects && cv.projects.length > 0) {
    blocks.push({
      id: aid("proj-h"),
      type: "heading",
      payload: { text: "Proyek", size: "md" },
    });
    cv.projects.forEach((p, i) => {
      if (p.link && /^https?:\/\//i.test(p.link)) {
        blocks.push({
          id: aid("proj", i),
          type: "link",
          payload: {
            label: p.name,
            url: p.link,
            description: p.description?.trim() || undefined,
            variant: "secondary",
            emoji: "🛠️",
          },
        });
      } else {
        const techs = p.technologies?.length
          ? `\n_${p.technologies.join(" · ")}_`
          : "";
        blocks.push({
          id: aid("proj", i),
          type: "paragraph",
          payload: {
            text: `**${p.name}**${p.description ? `\n${p.description}` : ""}${techs}`,
          },
        });
      }
    });
  }

  // ---- Portofolio --------------------------------------------------
  if (publicPortfolioShow && portfolio.length > 0) {
    blocks.push({
      id: aid("portfolio-h"),
      type: "heading",
      payload: { text: "Portofolio", size: "lg" },
    });
    // Sort: featured first, then most recent.
    const sorted = portfolio
      .slice()
      .sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) {
          return a.featured ? -1 : 1;
        }
        return (b.date ?? "").localeCompare(a.date ?? "");
      });
    sorted.forEach((it, i) => {
      if (it.coverUrl) {
        blocks.push({
          id: aid("portfolio", `${i}-img`),
          type: "image",
          payload: {
            url: it.coverUrl,
            alt: it.title,
            caption: it.description || undefined,
            link: it.link || undefined,
          },
        });
      } else if (it.link) {
        blocks.push({
          id: aid("portfolio", `${i}-link`),
          type: "link",
          payload: {
            label: it.title,
            url: it.link,
            description: it.description || undefined,
            variant: "secondary",
            emoji: it.coverEmoji || "📌",
          },
        });
      } else {
        blocks.push({
          id: aid("portfolio", `${i}-p`),
          type: "paragraph",
          payload: {
            text: `**${it.title}**${it.description ? `\n${it.description}` : ""}`,
          },
        });
      }
    });
  }

  // ---- Sosial ------------------------------------------------------
  if (toggles.showSocial) {
    const items: Array<{ platform: string; url: string }> = [];
    if (profile.publicLinkedinUrl?.trim()) {
      items.push({ platform: "linkedin", url: profile.publicLinkedinUrl });
    }
    if (profile.publicPortfolioUrl?.trim()) {
      items.push({ platform: "website", url: profile.publicPortfolioUrl });
    }
    if (profile.publicContactEmail?.trim()) {
      items.push({
        platform: "email",
        url: `mailto:${profile.publicContactEmail.trim()}`,
      });
    }
    if (items.length > 0) {
      blocks.push({
        id: aid("social"),
        type: "social",
        payload: { items: items as Block<"social">["payload"]["items"] },
      });
    }
  }

  return blocks;
}

export const DEFAULT_AUTO_TOGGLES: AutoToggles = {
  showExperience: true,
  showEducation: true,
  showCertifications: true,
  showProjects: true,
  showSocial: true,
  showLanguages: true,
};
