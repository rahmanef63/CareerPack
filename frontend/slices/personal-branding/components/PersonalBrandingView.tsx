"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Eye, Globe2, Sparkles, Wrench } from "lucide-react";
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
import { MobileActionBar } from "./MobileActionBar";
import { ShareCard } from "../sections/ShareCard";
import { StatusBanner } from "../sections/StatusBanner";
import {
  ExportCard, type ExportProfileSnapshot,
} from "../sections/ExportCard";
import { CVImportButton } from "@/shared/components/onboarding";
import { PreviewDialog } from "./PreviewDialog";
import { EditorPanel } from "./personal-branding-view/EditorPanel";

/** Top level. Was five siblings — Otomatis, Manual, Impor, HTML, Embed — where
 *  only the first two are authoring and the rest are export concerns. A
 *  first-timer had to rank five unequal choices before touching anything. */
type TopView = "edit" | "share";

/**
 * Personal Branding — thin orchestrator.
 *
 * Two tabs: **Edit halaman** (one editor, seven sections) and **Bagikan &
 * pasang** (export snippets). The editor used to be two: an automatic one and
 * a block builder, chosen from a second row of tabs. The page is always built
 * from the user's own data now; "build it differently" means custom HTML,
 * which is a field inside the Tampilan section.
 */
export function PersonalBrandingView() {
  const form = usePBForm();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewData = usePreviewBranding(form.state);
  const [topView, setTopView] = useState<TopView>("edit");
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
              shortest path to a filled page, so it leads here.
              
              This was <ImportCard/>, which ran `parseImportText` — a prompt
              that only ever asks the model for a `profile` object. No
              experience, no education, no certifications. It then applied it
              with `scope: "profile"`. So importing a CV here filled the
              profile and left the CV untouched, exactly as reported. The CV
              importer is a strict superset: same paste-text path, but it
              extracts the whole resume and merges it with conflict review and
              undo. */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
              Punya CV? Isi halaman ini dari sana
            </p>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Unggah PDF atau tempel isinya — profil dan CV kamu terisi
              sekaligus, dan kamu meninjau setiap perbedaan sebelum disimpan.
            </p>
            <CVImportButton variant="outline" size="sm" />
          </div>

          <EditorPanel
            form={form}
            previewData={previewData}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            toggleSection={toggleSection}
            profileSnapshot={profileSnapshot}
          />
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
