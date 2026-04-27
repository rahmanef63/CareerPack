"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { PersonalBrandingPage, type BrandingPayload } from "../themes";
import {
  buildAutoBlocks,
  type AutoCVInput,
  type AutoPortfolioItem,
} from "../../../../../convex/profile/autoBlocks";
import type { Block } from "../blocks/types";
import type { FormState } from "../form/types";

export interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  state: FormState;
  slugTrimmed: string;
}

/**
 * Live preview wrapper. Renders the public page through the same theme
 * dispatcher visitors see. Auto mode regenerates blocks client-side
 * via buildAutoBlocks() so the editor preview stays in lock-step with
 * the server's auto rebuild — they share `convex/profile/autoBlocks.ts`.
 */
export function PreviewDialog({
  open,
  onOpenChange,
  state,
  slugTrimmed,
}: PreviewDialogProps) {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const portfolio = useQuery(api.portfolio.queries.listPortfolio);
  const defaultCv = (cvs ?? []).find((c) => c.isDefault) ?? cvs?.[0] ?? null;

  const previewBlocks = useMemo<Block[]>(() => {
    if (state.mode === "custom") return state.blocks.filter((b) => !b.hidden);
    if (!me || !portfolio) return [];
    const cvForAuto: AutoCVInput | null = defaultCv
      ? {
          experience: defaultCv.experience,
          education: defaultCv.education,
          certifications: defaultCv.certifications,
          projects: defaultCv.projects,
        }
      : null;
    const portfolioForAuto: AutoPortfolioItem[] = (portfolio ?? []).map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      link: p.link ?? undefined,
      date: p.date,
      featured: p.featured,
      coverEmoji: p.coverEmoji ?? undefined,
      coverUrl: (p as { coverUrl?: string | null }).coverUrl ?? null,
    }));
    return buildAutoBlocks({
      profile: {
        bio: me?.profile?.bio ?? undefined,
        skills: me?.profile?.skills ?? undefined,
        publicBioShow: state.bioShow,
        publicSkillsShow: state.skillsShow,
        publicLinkedinUrl: state.linkedinUrl,
        publicPortfolioUrl: state.portfolioUrl,
        publicContactEmail: state.contactEmail,
      },
      cv: cvForAuto,
      portfolio: portfolioForAuto,
      toggles: state.autoToggles,
      publicPortfolioShow: state.portfolioShow,
    });
  }, [state, me, portfolio, defaultCv]);

  // Build the structured branding payload mirror of what the server's
  // getBySlug returns — so the editor preview hydrates the dynamic
  // template iframe with the same shape visitors will see live.
  const previewBranding = useMemo<BrandingPayload | undefined>(() => {
    if (!me) return undefined;
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
    const contactEmail = state.contactEmail ?? "";
    const linkedin = state.linkedinUrl ?? "";
    const portfolioUrl = state.portfolioUrl ?? "";
    return {
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
      languages: (defaultCv?.languages ?? []).map((l) => ({
        language: l.language ?? "",
        proficiency: l.proficiency ?? "",
      })),
      projects,
      has: {
        about: Boolean(bio.trim() || cvSummary.trim()),
        skills: skills.length > 0,
        experience: experience.length > 0,
        education: education.length > 0,
        certifications: certifications.length > 0,
        languages: (defaultCv?.languages ?? []).length > 0,
        projects: projects.length > 0,
        contact: Boolean(contactEmail || linkedin || portfolioUrl),
      },
    };
  }, [state, me, defaultCv, portfolio]);

  const previewProfile = useMemo(
    () => ({
      slug: slugTrimmed || "preview",
      displayName: me?.profile?.fullName || me?.name || "Nama Anda",
      headline: state.headline,
      targetRole: state.targetRoleShow ? me?.profile?.targetRole ?? "" : "",
      avatarUrl: state.avatarShow ? me?.avatarUrl ?? null : null,
      blocks: previewBlocks,
      theme: state.theme,
      headerBg: state.headerBg,
      accent: null,
      branding: previewBranding,
    }),
    [state, slugTrimmed, me, previewBlocks, previewBranding],
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        size="content"
        className="max-h-[95vh] overflow-y-auto p-0"
        drawerClassName="max-h-[95vh]"
        aria-describedby={undefined}
      >
        <ResponsiveDialogHeader className="p-4">
          <ResponsiveDialogTitle>Preview halaman publik</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="border-t border-border bg-background">
          <PersonalBrandingPage profile={previewProfile} brand={false} />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
