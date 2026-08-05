"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  useDemoCVOverlay,
  useDemoPortfolioOverlay,
  useDemoProfileOverlay,
  useIsDemo,
} from "@/shared/hooks/useDemoOverlay";
import type { BrandingPayload } from "../themes";
import type { FormState } from "./types";

/** The subset of a CV this preview reads, in the Convex doc's vocabulary.
 *  Both the server doc and the demo overlay are normalised into it. */
interface PreviewCv {
  personalInfo?: { summary?: string };
  skills?: Array<{ name?: string }>;
  experience?: Array<{
    company?: string; position?: string; startDate?: string;
    endDate?: string; current?: boolean; description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution?: string; degree?: string; field?: string;
    startDate?: string; endDate?: string; gpa?: string;
  }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  projects?: Array<{
    name?: string; description?: string;
    technologies?: string[]; link?: string;
  }>;
  languages?: Array<{ language?: string; proficiency?: string }>;
}

/**
 * Build the same `BrandingPayload` the iframe templates consume.
 * Mirrors `convex/profile/queries.ts:getProfileBySlug` so the editor
 * preview matches what visitors will see live.
 *
 * Returns `undefined` until profile + portfolio queries resolve so
 * consumers can branch on loading state.
 */
export function usePreviewBranding(state: FormState):
  | { branding: BrandingPayload }
  | undefined {
  // A demo session keeps profile/CV/portfolio in localStorage overlays, so
  // querying Convex here returned nothing and the preview rendered an empty
  // "Nama Anda" card right next to a form full of demo data.
  const isDemo = useIsDemo();
  const serverMe = useQuery(api.profile.queries.getCurrentUser, isDemo ? "skip" : {});
  const serverCvs = useQuery(api.cv.queries.getUserCVs, isDemo ? "skip" : {});
  const serverPortfolio = useQuery(api.portfolio.queries.listPortfolio, isDemo ? "skip" : {});
  const demoProfile = useDemoProfileOverlay();
  const demoCV = useDemoCVOverlay();
  const demoPortfolio = useDemoPortfolioOverlay();

  const me = useMemo(() => {
    if (!isDemo) return serverMe;
    const p = demoProfile.profile;
    return {
      name: p.fullName,
      avatarUrl: null,
      profile: {
        fullName: p.fullName,
        bio: p.bio,
        skills: p.skills,
        targetRole: p.targetRole,
        location: p.location,
      },
    };
  }, [isDemo, serverMe, demoProfile.profile]);

  const portfolio = isDemo ? demoPortfolio.items : serverPortfolio;

  const defaultCv = useMemo<PreviewCv | null>(() => {
    // The demo CV is the frontend `CVData` shape, which names a few fields
    // differently from the Convex doc (fieldOfStudy vs field, profile.summary
    // vs personalInfo.summary, and no languages at all) — normalise once here
    // so the payload builder below stays single-path.
    if (isDemo) {
      const d = demoCV.cvData;
      if (!d) return null;
      return {
        personalInfo: { summary: d.profile?.summary ?? "" },
        skills: d.skills,
        experience: d.experience.map((e) => ({ ...e, current: !e.endDate })),
        education: d.education.map((e) => ({ ...e, field: e.fieldOfStudy })),
        certifications: d.certifications,
        projects: d.projects,
        languages: [],
      };
    }
    if (!serverCvs || serverCvs.length === 0) return null;
    // Mirror getProfileBySlug (`.order("desc").first()`): newest CV wins.
    // Was ranking by richness, which made the editor preview show a
    // different CV than the published page for users with 2+ CVs.
    return [...serverCvs].sort(
      (a, b) => b._creationTime - a._creationTime,
    )[0] as PreviewCv;
  }, [isDemo, demoCV.cvData, serverCvs]);

  return useMemo(() => {
    if (!me || !portfolio) return undefined;
    const cvSummary = defaultCv?.personalInfo?.summary ?? "";
    const bio = state.bioShow ? me.profile?.bio ?? "" : "";
    const cvSkills = (defaultCv?.skills ?? [])
      .map((s) => s.name)
      .filter((n): n is string => typeof n === "string" && n.length > 0);
    const profileSkills = state.skillsShow ? me.profile?.skills ?? [] : [];
    const seen = new Set<string>();
    const skills: string[] = [];
    for (const s of [...profileSkills, ...cvSkills]) {
      const k = s.trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      skills.push(s.trim());
    }
    const experience = (defaultCv?.experience ?? []).map((e) => ({
      company: e.company ?? "",
      position: e.position ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      current: Boolean(e.current),
      description: e.description ?? "",
      achievements: e.achievements ?? [],
    }));
    const education = (defaultCv?.education ?? []).map((e) => ({
      institution: e.institution ?? "",
      degree: e.degree ?? "",
      field: e.field ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      gpa: e.gpa ?? "",
    }));
    const certifications = (defaultCv?.certifications ?? []).map((c) => ({
      name: c.name ?? "",
      issuer: c.issuer ?? "",
      date: c.date ?? "",
    }));
    const cvProjects = (defaultCv?.projects ?? []).map((p) => ({
      name: p.name ?? "",
      description: p.description ?? "",
      technologies: p.technologies ?? [],
      link: p.link ?? "",
    }));
    // Filter portfolio by per-item brandingShow:
    //   undefined → follow global state.portfolioShow
    //   true      → always shown (overrides global off)
    //   false     → never shown (overrides global on)
    const visiblePortfolio = (portfolio ?? [])
      .filter((p) => {
        const flag = (p as { brandingShow?: boolean }).brandingShow;
        if (flag === true) return true;
        if (flag === false) return false;
        return state.portfolioShow;
      })
      // Match the PUBLISHED page order (convex/profile/queries.ts): featured
      // cards first, then newest date first. Preview previously kept raw
      // creation order, so the live page and the preview showed a different
      // first tile / card order.
      .sort((a, b) => {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        return (b.date ?? "").localeCompare(a.date ?? "");
      });
    const projects: BrandingPayload["projects"] = [
      ...visiblePortfolio.map((p) => ({
        id: p._id as unknown as string,
        title: p.title,
        description: p.description,
        category: p.category,
        link: p.link ?? "",
        date: p.date,
        techStack: p.techStack ?? [],
        featured: p.featured,
        coverEmoji: p.coverEmoji ?? null,
        coverUrl: (p as { coverUrl?: string | null }).coverUrl ?? null,
      })),
      ...cvProjects.map((p, i) => ({
        id: `cv-project-${i}`,
        title: p.name,
        description: p.description,
        category: "project",
        link: p.link,
        date: "",
        techStack: p.technologies,
        featured: false,
        coverEmoji: null,
        coverUrl: null,
      })),
    ].filter((p) => p.title.trim().length > 0);
    const languages = (defaultCv?.languages ?? []).map((l) => ({
      language: l.language ?? "",
      proficiency: l.proficiency ?? "",
    }));
    const contactEmail = state.contactEmail ?? "";
    const linkedin = state.linkedinUrl ?? "";
    const portfolioUrl = state.portfolioUrl ?? "";
    const t = state.autoToggles;
    const branding: BrandingPayload = {
      identity: {
        name: me.profile?.fullName || me.name || "",
        headline: state.headline,
        targetRole: state.targetRoleShow ? me.profile?.targetRole ?? "" : "",
        // Mirror the backend least-disclosure gate: location only shows
        // when the user opts in (default hidden).
        location: state.locationShow ? me.profile?.location ?? "" : "",
        avatarUrl: state.avatarShow ? me.avatarUrl ?? null : null,
        contact: { email: contactEmail, linkedin, portfolio: portfolioUrl },
      },
      // Mirror convex/profile/brandingPayload.ts: a section switched off
      // is not just hidden, its DATA is dropped. Preview must build the
      // same payload or the editor shows fields the live page omits.
      about: { bio, summary: state.bioShow ? cvSummary : "" },
      skills: state.skillsShow ? skills : [],
      experience: t.showExperience ? experience : [],
      education: t.showEducation ? education : [],
      certifications: t.showCertifications ? certifications : [],
      languages: t.showLanguages ? languages : [],
      // Mirrors buildBrandingPayload: portfolio rows are already filtered by
      // per-item brandingShow, but CV projects have no per-item flag, so the
      // section toggle is their only gate. Preview must match the backend.
      projects: t.showProjects ? projects : [],
      availability: state.availableForHire
        ? { open: true, note: state.availabilityNote }
        : undefined,
      cta:
        state.ctaLabel.trim() && state.ctaUrl.trim()
          ? {
              label: state.ctaLabel.trim(),
              url: state.ctaUrl.trim(),
              type: state.ctaType,
            }
          : undefined,
      sectionOrder:
        state.sectionOrder.length > 0 ? state.sectionOrder : undefined,
      // Style customization is manual-only — auto previews fall back
      // to each template's curated design.
      style:
        state.mode === "custom" && Object.keys(state.style ?? {}).length > 0
          ? state.style
          : undefined,
      blocks:
        state.mode === "custom"
          ? state.blocks.filter((b) => !b.hidden)
          : undefined,
      has: {
        // Mirror the backend: respect user toggles in addition to data
        // presence so the preview matches what visitors will see.
        about: state.bioShow && Boolean(bio.trim() || cvSummary.trim()),
        skills: state.skillsShow && skills.length > 0,
        experience: t.showExperience && experience.length > 0,
        education: t.showEducation && education.length > 0,
        certifications: t.showCertifications && certifications.length > 0,
        languages: t.showLanguages && languages.length > 0,
        projects: t.showProjects && projects.length > 0,
        contact: Boolean(contactEmail || linkedin || portfolioUrl),
      },
    };
    return { branding };
  }, [state, me, defaultCv, portfolio]);
}
