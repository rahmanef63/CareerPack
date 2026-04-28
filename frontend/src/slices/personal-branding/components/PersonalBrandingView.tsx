"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Code2,
  Download,
  Eye,
  Globe2,
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
import { ShareCard } from "../sections/ShareCard";
import { StatusBanner } from "../sections/StatusBanner";
import { SaveActions } from "../sections/SaveActions";
import { ModeWarning } from "../sections/ModeWarning";
import { AvailabilityCard } from "../sections/AvailabilityCard";
import { CtaCard } from "../sections/CtaCard";
import { SectionLayoutCard } from "../sections/SectionLayoutCard";
import {
  ExportCard,
  type ExportProfileSnapshot,
} from "../sections/ExportCard";
import { ImportCard } from "../sections/ImportCard";
import { PreviewDialog } from "./PreviewDialog";

type TopView = "auto" | "custom" | "import" | "html" | "embed";

/**
 * Personal Branding builder — thin orchestrator.
 *
 * Top-level tabs (5):
 *   - **Otomatis** — page is auto-built from CV + Profil + Portofolio.
 *   - **Manual** — drag-style block builder.
 *   - **Impor** — paste resume / LinkedIn → AI fills CV + profile.
 *   - **HTML** — copy a self-contained profile card to embed in any
 *     site (blog, README, portfolio).
 *   - **Embed** — copy an iframe snippet to drop into Notion / Wix /
 *     Wordpress.
 *
 * Otomatis + Manual write to `form.mode` (the rendering choice the
 * server stores). Impor / HTML / Embed are independent action panels;
 * they don't touch `form.mode`.
 */
export function PersonalBrandingView() {
  const form = usePBForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewData = usePreviewBranding(form.state);
  // Top-level tab state — initialised from server-stored mode so a
  // user who saved Manual still lands on Manual on next visit.
  const [view, setView] = useState<TopView>(
    () => (form.state.mode === "custom" ? "custom" : "auto"),
  );

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

  function handleViewChange(next: string) {
    const v = next as TopView;
    setView(v);
    if (v === "auto" || v === "custom") {
      // Sync render-mode for Otomatis / Manual; other tabs leave it alone.
      const modeBind = form.bind("mode");
      const targetMode: Mode = v;
      if (modeBind.value !== targetMode) modeBind.onChange(targetMode);
    }
  }

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

      <ShareCard
        slugTrimmed={form.slugTrimmed}
        displayName={profileSnapshot.fullName}
        enabled={Boolean(form.serverState?.enabled)}
      />

      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList variant="pills" className="flex-wrap">
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
          <TabsTrigger value="import" className="gap-1.5">
            <Download className="h-4 w-4" />
            <span>Impor</span>
          </TabsTrigger>
          <TabsTrigger value="html" className="gap-1.5">
            <Code2 className="h-4 w-4" />
            <span>HTML</span>
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-1.5">
            <Globe2 className="h-4 w-4" />
            <span>Embed</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== Otomatis =====
            id="pb-section-…" wrappers are landing targets for the
            BrandingValidationCard's "klik untuk langsung ke field"
            jump-links. Keep them stable — `brandingScore.ts`
            references these anchors by name. */}
        <TabsContent value="auto" className="mt-4 space-y-4">
          <div id="pb-section-theme" className="rounded-xl transition-shadow">
            <ThemeCard bind={form.bind} />
          </div>
          <div id="pb-section-validation" className="rounded-xl transition-shadow">
            <BrandingValidationCard branding={previewData?.branding} />
          </div>
          <div id="pb-section-header-bg" className="rounded-xl transition-shadow">
            <HeaderBgCard bind={form.bind} />
          </div>
          <div id="pb-section-auto-config" className="rounded-xl transition-shadow">
            <AutoConfigCard bind={form.bind} />
          </div>
          <div id="pb-section-identity" className="rounded-xl transition-shadow">
            <IdentityCard
              bind={form.bind}
              validation={form.slugValidation}
              slugTrimmed={form.slugTrimmed}
              canEnable={form.canEnable}
            />
          </div>
          <div id="pb-section-hero-toggles" className="rounded-xl transition-shadow">
            <HeroTogglesCard bind={form.bind} />
          </div>
          <div id="pb-section-availability" className="rounded-xl transition-shadow">
            <AvailabilityCard bind={form.bind} />
          </div>
          <div id="pb-section-cta" className="rounded-xl transition-shadow">
            <CtaCard bind={form.bind} />
          </div>
          <div id="pb-section-layout" className="rounded-xl transition-shadow">
            <SectionLayoutCard bind={form.bind} />
          </div>
          <div id="pb-section-contact" className="rounded-xl transition-shadow">
            <ContactCard bind={form.bind} />
          </div>
          <div id="pb-section-indexing" className="rounded-xl transition-shadow">
            <IndexingCard bind={form.bind} />
          </div>
          <SaveActions
            saving={form.saving}
            canEnable={form.canEnable}
            submit={form.submit}
            lastSavedAt={form.lastSavedAt}
            autoSavePending={form.autoSavePending}
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
                lastSavedAt={form.lastSavedAt}
                autoSavePending={form.autoSavePending}
              />
            </TabsContent>

            <TabsContent value="design" className="mt-4 space-y-4">
              <ThemeCard bind={form.bind} />
              <HeaderBgCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
                lastSavedAt={form.lastSavedAt}
                autoSavePending={form.autoSavePending}
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
              <IndexingCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
                lastSavedAt={form.lastSavedAt}
                autoSavePending={form.autoSavePending}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ===== Impor ===== */}
        <TabsContent value="import" className="mt-4 space-y-4">
          <ImportCard />
        </TabsContent>

        {/* ===== HTML ===== */}
        <TabsContent value="html" className="mt-4 space-y-4">
          <ExportCard
            bind={form.bind}
            state={form.state}
            slugTrimmed={form.slugTrimmed}
            profile={profileSnapshot}
            only="html"
            title="Ekspor sebagai kartu HTML"
            description="Snippet HTML self-contained — tempel ke website mana pun (blog, portofolio sendiri, README)."
          />
        </TabsContent>

        {/* ===== Embed ===== */}
        <TabsContent value="embed" className="mt-4 space-y-4">
          <ExportCard
            bind={form.bind}
            state={form.state}
            slugTrimmed={form.slugTrimmed}
            profile={profileSnapshot}
            only="embed"
            title="Embed iframe"
            description="Iframe yang menyematkan halaman publik Anda — cocok untuk Notion, Wix, Wordpress."
          />
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
