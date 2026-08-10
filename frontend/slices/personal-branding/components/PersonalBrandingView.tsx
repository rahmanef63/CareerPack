"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  Eye, Globe2, Sparkles, Wrench, Zap,
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
import { api } from "../../../../convex/_generated/api";

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

/** Which editor is active. Doubles as the persisted `mode` field. */
type EditorView = "auto" | "custom";
/** Top level. Was five siblings — Otomatis, Manual, Impor, HTML, Embed — where
 *  only the first two are authoring and the rest are export concerns. A
 *  first-timer had to rank five unequal choices before touching anything. */
type TopView = "edit" | "share";

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
  const [topView, setTopView] = useState<TopView>("edit");
  const [view, setView] = useState<EditorView>(
    () => (form.state.mode === "custom" ? "custom" : "auto"),
  );
  // The lazy initializer above runs before the server state hydrates
  // (mode is still the "auto" default), so a saved custom-mode user
  // would land on the Otomatis tab with their block builder hidden.
  // Sync once, when serverState first arrives.
  const modeSyncedRef = useRef(false);
  useEffect(() => {
    if (modeSyncedRef.current || !form.serverState) return;
    modeSyncedRef.current = true;
    setView(form.serverState.mode === "custom" ? "custom" : "auto");
  }, [form.serverState]);
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
      // The jump targets live in the editor, so leaving the user on Bagikan
      // would scroll to a node that is not mounted.
      setTopView("edit");
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
    const v = next as EditorView;
    setView(v);
    const modeBind = form.bind("mode");
    if (modeBind.value !== (v as Mode)) modeBind.onChange(v as Mode);
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

      <Tabs value={topView} onValueChange={(v) => setTopView(v as TopView)}>
        <TabsList variant="pills">
          <TabsTrigger value="edit" className="gap-1.5">
            <Wrench className="h-4 w-4" />
            <span>Edit halaman</span>
          </TabsTrigger>
          <TabsTrigger value="share" className="gap-1.5">
            <Globe2 className="h-4 w-4" />
            <span>Bagikan &amp; pasang</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 space-y-4">
          {/* Import is an INPUT, not a sharing concern — it used to sit beside
              HTML and Embed. For someone starting from nothing it is the
              shortest path to a filled page, so it leads here. */}
          <ImportCard />

          {/* Mode is a question about how you want to build, so it reads as one
              rather than as two separate destinations. The labels say what each
              does; "Otomatis" and "Manual" only mean something once you already
              know the feature. */}
          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList variant="pills">
              <TabsTrigger value="auto" className="gap-1.5">
                <Zap className="h-4 w-4" />
                <span>Susun otomatis dari CV</span>
                <Badge
                  variant="secondary"
                  className="ml-1 hidden bg-success/15 text-[10px] text-success-text sm:inline-flex"
                >
                  Termudah
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-1.5">
                <Wrench className="h-4 w-4" />
                <span>Atur sendiri</span>
              </TabsTrigger>
            </TabsList>

            {/* Blocks are only rendered in "Atur sendiri" — the public query
                drops them outright in auto mode. Someone who built a page,
                switched modes, and saw it vanish got no explanation at all. */}
            {view === "auto" && form.state.blocks.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-text">
                <span>
                  Kamu punya <strong>{form.state.blocks.length} blok</strong> yang
                  disusun sendiri. Blok itu tidak ditampilkan selama mode
                  &ldquo;Susun otomatis&rdquo; aktif.
                </span>
                <button
                  type="button"
                  onClick={() => handleViewChange("custom")}
                  className="shrink-0 rounded-md border border-warning/50 bg-background/70 px-2 py-1 font-medium hover:bg-background"
                >
                  Pakai blok saya
                </button>
              </div>
            )}

            <AutoTab
              form={form}
              previewData={previewData}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              toggleSection={toggleSection}
              profileSnapshot={profileSnapshot}
            />

            <ManualTab form={form} />
          </Tabs>
        </TabsContent>

        <TabsContent value="share" className="mt-4 space-y-4">
          <ExportCard
            bind={form.bind}
            state={form.state}
            slugTrimmed={form.slugTrimmed}
            profile={profileSnapshot}
            only="html"
            title="Ekspor sebagai kartu HTML"
            description="Snippet HTML self-contained — tempel ke website mana pun (blog, portofolio sendiri, README)."
          />
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
