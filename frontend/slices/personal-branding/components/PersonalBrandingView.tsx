"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import {
  Code2, Download, Eye, Globe2, Sparkles, Wrench, Zap,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoProfileOverlay } from "@/shared/hooks/useDemoOverlay";
import { api } from "../../../../../convex/_generated/api";

import { usePBForm } from "../form/usePBForm";
import { usePreviewBranding } from "../form/usePreviewBranding";
import type { Mode } from "../form/types";
import { MobileActionBar } from "./MobileActionBar";
import { ShareCard } from "../sections/ShareCard";
import { StatusBanner } from "../sections/StatusBanner";
import {
  ExportCard, type ExportProfileSnapshot,
} from "../sections/ExportCard";
import { ImportCard } from "../sections/ImportCard";
import { PreviewDialog } from "./PreviewDialog";
import { AutoTab } from "./personal-branding-view/AutoTab";
import { ManualTab } from "./personal-branding-view/ManualTab";

type TopView = "auto" | "custom" | "import" | "html" | "embed";

/**
 * Personal Branding builder — thin orchestrator.
 *
 * Top-level tabs (5):
 *   - **Otomatis** — page is auto-built from CV + Profil + Portofolio.
 *   - **Manual** — drag-style block builder.
 *   - **Impor** — paste resume / LinkedIn → AI fills CV + profile.
 *   - **HTML** — copy a self-contained profile card to embed.
 *   - **Embed** — copy an iframe snippet.
 */
export function PersonalBrandingView() {
  const form = usePBForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewData = usePreviewBranding(form.state);
  const [view, setView] = useState<TopView>(
    () => (form.state.mode === "custom" ? "custom" : "auto"),
  );
  const [activeSection, setActiveSection] = useState<string | null>("identity");
  function toggleSection(id: string) {
    setActiveSection((prev) => (prev === id ? null : id));
  }

  // Listen for jump-link events from BrandingValidationCard so a click
  // on "Isi headline" opens the matching accordion section before the
  // smooth-scroll lands on the field.
  useEffect(() => {
    function onJump(e: Event) {
      const detail = (e as CustomEvent<{ sectionKey?: string }>).detail;
      if (!detail?.sectionKey) return;
      // Map anchor key → accordion sectionId.
      const map: Record<string, string> = { "hero-toggles": "hero" };
      const target = map[detail.sectionKey] ?? detail.sectionKey;
      setActiveSection(target);
      setView((prev) => (prev === "auto" || prev === "custom" ? prev : "auto"));
    }
    window.addEventListener("pb-jump", onJump);
    return () => window.removeEventListener("pb-jump", onJump);
  }, []);

  // Profile snapshot — used by ExportCard to fill the AI-prompt body
  // with the user's actual data. Both branches always run (rules of
  // hooks); pick which result feeds ExportCard based on isDemo.
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
          <div className="hidden flex-wrap gap-2 lg:flex">
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
        <TabsList variant="pills">
          <TabsTrigger value="auto" className="gap-1.5">
            <Zap className="h-4 w-4" />
            <span>Otomatis</span>
            <Badge
              variant="secondary"
              className="ml-1 hidden bg-emerald-100 text-[10px] text-emerald-700 sm:inline-flex dark:bg-emerald-950 dark:text-emerald-300"
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

        <AutoTab
          form={form}
          previewData={previewData}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          toggleSection={toggleSection}
          profileSnapshot={profileSnapshot}
        />

        <ManualTab form={form} />

        <TabsContent value="import" className="mt-4 space-y-4">
          <ImportCard />
        </TabsContent>

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

      <MobileActionBar
        saving={form.saving}
        canEnable={form.canEnable}
        onPreview={() => setPreviewOpen(true)}
        onPublish={form.submit}
      />
    </PageContainer>
  );
}
