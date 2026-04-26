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
import { PersonalBrandingPage } from "../themes";
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
    }),
    [state, slugTrimmed, me, previewBlocks],
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
