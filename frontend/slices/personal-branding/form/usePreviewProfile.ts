"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  buildAutoBlocks,
  type AutoCVInput,
  type AutoPortfolioItem,
} from "../../../../convex/profile/autoBlocks";
import type { Block } from "../blocks/types";
import type { FormState } from "./types";
import { usePreviewBranding } from "./usePreviewBranding";

/**
 * Assemble the `profile` payload that `PersonalBrandingPage` renders in
 * the editor's live previews. Fetches the user's profile + CVs + portfolio,
 * picks the richest CV, runs the `buildAutoBlocks` pipeline (auto mode) or
 * the manual blocks (custom mode), and folds in the shared branding payload.
 *
 * Extracted verbatim from `MiniPreviewFrame` + `PreviewDialog`, which used to
 * carry identical copies of this assembly. Single source of truth so the
 * split desktop view and the modal preview can never drift.
 */
export function usePreviewProfile(state: FormState, slugTrimmed: string) {
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
      mode: state.mode,
      branding: previewData?.branding,
    }),
    [state, slugTrimmed, me, previewBlocks, previewData],
  );

  return previewProfile;
}
