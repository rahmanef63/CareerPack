"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Eye } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { PersonalBrandingPage } from "../themes";
import {
  buildAutoBlocks,
  type AutoCVInput,
  type AutoPortfolioItem,
} from "../../../../../convex/profile/autoBlocks";
import type { Block } from "../blocks/types";
import type { FormState } from "../form/types";
import { usePreviewBranding } from "../form/usePreviewBranding";

export interface MiniPreviewFrameProps {
  state: FormState;
  slugTrimmed: string;
}

/**
 * Side-by-side live-preview for the Otomatis tab desktop layout.
 * Mirrors PreviewDialog's data assembly minus the viewport / template
 * mock toggles — desktop split-view is always "Data Saya, natural
 * width". Mobile users still get the modal Preview button.
 */
export function MiniPreviewFrame({ state, slugTrimmed }: MiniPreviewFrameProps) {
  const me = useQuery(api.profile.queries.getCurrentUser);
  const cvs = useQuery(api.cv.queries.getUserCVs);
  const portfolio = useQuery(api.portfolio.queries.listPortfolio);
  const previewData = usePreviewBranding(state);

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
      branding: previewData?.branding,
    }),
    [state, slugTrimmed, me, previewBlocks, previewData],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Eye className="h-3 w-3" />
          Pratinjau langsung
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Live
        </span>
      </div>
      <div className="max-h-[calc(100vh-14rem)] overflow-auto bg-muted/10">
        <PersonalBrandingPage
          profile={previewProfile}
          brand={false}
          showBranding
        />
      </div>
    </div>
  );
}
