"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { BrandingPayload } from "../themes";
import type { FormState } from "./types";

/**
 * Build the same `BrandingPayload` the iframe templates consume.
 * Mirrors `convex/profile/queries.ts:getProfileBySlug` so the editor
 * preview matches what visitors will see live.
 *
 * Returns `undefined` until profile + portfolio queries resolve so
 * consumers can branch on loading state.
 */
export function usePreviewBranding(state: FormState):
  | { branding: BrandingPayload; cv: BrandingCv | null }
  | undefined {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const portfolio = useQuery(api.portfolio.queries.listPortfolio);

  const defaultCv = useMemo(() => {
    if (!cvs || cvs.length === 0) return null;
    const ranked = [...cvs].sort((a, b) => {
      const aRich = a.experience.length + a.skills.length + a.education.length;
      const bRich = b.experience.length + b.skills.length + b.education.length;
      if (aRich !== bRich) return bRich - aRich;
      return b._creationTime - a._creationTime;
    });
    return ranked[0];
  }, [cvs]);

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
    const projects: BrandingPayload["projects"] = [
      ...(state.portfolioShow ? portfolio ?? [] : []).map((p) => ({
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
    const branding: BrandingPayload = {
      identity: {
        name: me.profile?.fullName || me.name || "",
        headline: state.headline,
        targetRole: state.targetRoleShow ? me.profile?.targetRole ?? "" : "",
        location: me.profile?.location ?? "",
        avatarUrl: state.avatarShow ? me.avatarUrl ?? null : null,
        contact: { email: contactEmail, linkedin, portfolio: portfolioUrl },
      },
      about: { bio, summary: cvSummary },
      skills,
      experience,
      education,
      certifications,
      languages,
      projects,
      has: {
        about: Boolean(bio.trim() || cvSummary.trim()),
        skills: skills.length > 0,
        experience: experience.length > 0,
        education: education.length > 0,
        certifications: certifications.length > 0,
        languages: languages.length > 0,
        projects: projects.length > 0,
        contact: Boolean(contactEmail || linkedin || portfolioUrl),
      },
    };
    const cvShape: BrandingCv | null = defaultCv
      ? {
          experience: defaultCv.experience,
          education: defaultCv.education,
          certifications: defaultCv.certifications,
          projects: defaultCv.projects,
        }
      : null;
    return { branding, cv: cvShape };
  }, [state, me, defaultCv, portfolio]);
}

export interface BrandingCv {
  experience: ReadonlyArray<unknown>;
  education: ReadonlyArray<unknown>;
  certifications: ReadonlyArray<unknown>;
  projects: ReadonlyArray<unknown>;
}
