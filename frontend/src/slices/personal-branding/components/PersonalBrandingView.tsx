"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Eye,
  Layers,
  Palette,
  Settings as SettingsIcon,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoProfileOverlay } from "@/shared/hooks/useDemoOverlay";
import { api } from "../../../../../convex/_generated/api";

import { usePBForm } from "../form/usePBForm";
import { usePreviewBranding } from "../form/usePreviewBranding";
import type { Mode } from "../form/types";
import { BrandingValidationCard } from "../sections/BrandingValidationCard";
import { IdentityCard } from "../sections/IdentityCard";
import { HeroTogglesCard } from "../sections/HeroTogglesCard";
import { ContactCard } from "../sections/ContactCard";
import { IndexingCard } from "../sections/IndexingCard";
import { ThemeCard } from "../sections/ThemeCard";
import { HeaderBgCard } from "../sections/HeaderBgCard";
import { AutoConfigCard } from "../sections/AutoConfigCard";
import { ManualBlocksCard } from "../sections/ManualBlocksCard";
import { StatusBanner } from "../sections/StatusBanner";
import { SaveActions } from "../sections/SaveActions";
import { ModeWarning } from "../sections/ModeWarning";
import {
  ExportCard,
  type ExportProfileSnapshot,
} from "../sections/ExportCard";
import { PreviewDialog } from "./PreviewDialog";

/**
 * Personal Branding builder — thin orchestrator.
 *
 * State + persistence live in `usePBForm()`. UI is composed of
 * per-concern cards (IdentityCard, ContactCard, etc.) that each
 * accept `bind` + optional override props. Adding a new editable
 * field is now a 4-touchpoint change (FormState → defaults →
 * hydrate → owning section). All other sections stay untouched.
 *
 * Modes (Otomatis vs Manual) reuse the same Theme + HeaderBg + Hero
 * + Contact + Indexing cards — no UI duplication. Only the
 * primary content surface differs:
 *   - Otomatis: AutoConfigCard (section toggles, page is auto-built
 *     from CV + Profil + Portofolio server-side)
 *   - Manual: ManualBlocksCard (drag-style block builder)
 */
export function PersonalBrandingView() {
  const form = usePBForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewData = usePreviewBranding(form.state);

  // Profile snapshot — used by ExportCard to fill the AI-prompt body
  // with the user's actual data. Both branches always run (rules of
  // hooks); we pick which result feeds ExportCard based on isDemo.
  const { state: authState } = useAuth();
  const isDemo = authState.isDemo;
  const isAuthenticated = authState.isAuthenticated;
  const realProfileQuery = useQuery(
    api.profile.queries.getCurrentUser,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const demoProfile = useDemoProfileOverlay();
  const profileSnapshot: ExportProfileSnapshot = isDemo
    ? {
        fullName: demoProfile.profile.fullName,
        bio: demoProfile.profile.bio,
        location: demoProfile.profile.location,
        targetRole: demoProfile.profile.targetRole,
        experienceLevel: demoProfile.profile.experienceLevel,
        skills: demoProfile.profile.skills,
      }
    : {
        fullName: realProfileQuery?.profile?.fullName ?? "",
        bio: realProfileQuery?.profile?.bio ?? "",
        location: realProfileQuery?.profile?.location ?? "",
        targetRole: realProfileQuery?.profile?.targetRole ?? "",
        experienceLevel: realProfileQuery?.profile?.experienceLevel ?? "",
        skills: realProfileQuery?.profile?.skills ?? [],
      };

  const liveStatus: "active" | "draft" | "empty" = (() => {
    const sv = form.serverState;
    if (!sv) return "empty";
    if (sv.enabled && sv.slug) return "active";
    if (sv.slug) return "draft";
    return "empty";
  })();
  const livePublicUrl = form.serverState?.slug
    ? `/${form.serverState.slug}`
    : "";

  const mode = form.bind("mode");

  const exportCard = (
    <ExportCard
      bind={form.bind}
      state={form.state}
      slugTrimmed={form.slugTrimmed}
      profile={profileSnapshot}
    />
  );

  return (
    <PageContainer size="lg" className="space-y-6">
      <ResponsivePageHeader
        title="Personal Branding"
        description="Pengganti Linktree / Bento — punya halaman publik dalam 1 menit, tanpa coding."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              type="button"
              onClick={() => form.submit({ activate: true })}
              disabled={form.saving || !form.canEnable}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {form.saving ? "Menyimpan…" : "Simpan & Publikasikan"}
            </Button>
          </div>
        }
      />

      <StatusBanner status={liveStatus} url={livePublicUrl} />

      <Tabs
        value={mode.value}
        onValueChange={(v) => mode.onChange(v as Mode)}
      >
        <TabsList variant="pills">
          <TabsTrigger value="auto" className="gap-1.5">
            <Zap className="h-4 w-4" />
            <span>Otomatis</span>
            <Badge
              variant="secondary"
              className="ml-1 bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Direkomendasikan
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-1.5">
            <Wrench className="h-4 w-4" />
            <span>Manual</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== Otomatis ===== */}
        <TabsContent value="auto" className="mt-4 space-y-4">
          <ThemeCard bind={form.bind} />
          <BrandingValidationCard branding={previewData?.branding} />
          <HeaderBgCard bind={form.bind} />
          <AutoConfigCard bind={form.bind} />
          <IdentityCard
            bind={form.bind}
            validation={form.slugValidation}
            slugTrimmed={form.slugTrimmed}
            canEnable={form.canEnable}
          />
          <HeroTogglesCard bind={form.bind} />
          <ContactCard bind={form.bind} />
          {exportCard}
          <IndexingCard bind={form.bind} />
          <SaveActions
            saving={form.saving}
            canEnable={form.canEnable}
            submit={form.submit}
          />
        </TabsContent>

        {/* ===== Manual ===== */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <ModeWarning />
          <Tabs defaultValue="content">
            <TabsList variant="pills">
              <TabsTrigger value="content" className="gap-1.5">
                <Layers className="h-4 w-4" /> Konten
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5">
                <Palette className="h-4 w-4" /> Tampilan
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <SettingsIcon className="h-4 w-4" /> Pengaturan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4 space-y-4">
              <ManualBlocksCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
              />
            </TabsContent>

            <TabsContent value="design" className="mt-4 space-y-4">
              <ThemeCard bind={form.bind} />
              <HeaderBgCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
              />
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <IdentityCard
                bind={form.bind}
                validation={form.slugValidation}
                slugTrimmed={form.slugTrimmed}
                canEnable={form.canEnable}
              />
              <HeroTogglesCard bind={form.bind} />
              <ContactCard bind={form.bind} />
              {exportCard}
              <IndexingCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        state={form.state}
        slugTrimmed={form.slugTrimmed}
      />
    </PageContainer>
  );
}
