"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import {
  Blocks,
  Briefcase,
  Brush,
  Code2,
  Download,
  Eye,
  Globe,
  Globe2,
  Layers,
  Mail,
  MousePointerClick,
  Palette,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  User,
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
import { StyleCard } from "../sections/StyleCard";
import { ManualDesignCard } from "../sections/ManualDesignCard";
import { ManualBlocksCard } from "../sections/ManualBlocksCard";
import { BlockPresetsCard } from "../builder/BlockPresetsCard";
import { PBSectionNav } from "./PBSectionNav";
import { MiniPreviewFrame } from "./MiniPreviewFrame";
import { MobileActionBar } from "./MobileActionBar";
import { PreviewSplitLayout } from "@/shared/components/layout/PreviewSplitLayout";
import { ShareCard } from "../sections/ShareCard";
import { StatusBanner } from "../sections/StatusBanner";
import { SaveActions } from "../sections/SaveActions";
import { ModeWarning } from "../sections/ModeWarning";
import { AvailabilityCard } from "../sections/AvailabilityCard";
import { CtaCard } from "../sections/CtaCard";
import { SectionLayoutCard } from "../sections/SectionLayoutCard";
import { PBSection } from "../sections/PBSection";
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
  // Single-open accordion state for the Otomatis tab — mirrors CV
  // editor's pattern. Defaults to "identity" so first-time users see
  // the slug input first (most-likely thing they want to set).
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
      // Map anchor key → accordion sectionId (some ids are abbreviated
      // for nicer URLs; e.g. "hero-toggles" → "hero").
      const map: Record<string, string> = {
        "hero-toggles": "hero",
      };
      const target = map[detail.sectionKey] ?? detail.sectionKey;
      // Force-open the target so the field is visible.
      setActiveSection(target);
      // Switch to Otomatis tab if the user is on a different one.
      setView((prev) => (prev === "auto" || prev === "custom" ? prev : "auto"));
    }
    window.addEventListener("pb-jump", onJump);
    return () => window.removeEventListener("pb-jump", onJump);
  }, []);

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

        {/* ===== Otomatis =====
            CV-format accordion — single-open like the CV editor.
            Anchor IDs (id="pb-section-…") on each section are
            landing targets for BrandingValidationCard's jump-links.
            Tapping a jump-link auto-opens the corresponding section.

            Layout:
              - Mobile / tablet: single column + sticky pill navigator
                at top so users can hop between accordion sections
                without scrolling the long stack manually.
              - Desktop (lg+): split view — accordion on the left, live
                MiniPreviewFrame pinned on the right so every keystroke
                shows up in the rendered template instantly. */}
        <TabsContent value="auto" className="mt-4">
          <PreviewSplitLayout
            mobileNav={
              <PBSectionNav
                activeId={activeSection}
                onSelect={(id) => setActiveSection(id)}
              />
            }
            preview={
              <MiniPreviewFrame
                state={form.state}
                slugTrimmed={form.slugTrimmed}
              />
            }
          >
            <div
              id="pb-section-validation"
              className="rounded-xl transition-shadow"
            >
              <BrandingValidationCard branding={previewData?.branding} />
            </div>
            <div className="space-y-3">
                <div
                  id="pb-section-identity"
                  className="rounded-xl transition-shadow"
                >
                  <PBSection
                    sectionId="identity"
                    title="Identitas & URL"
                    description="Slug halaman publik, headline, dan saklar publish."
                    icon={<Globe className="h-4 w-4" />}
                    tone="brand"
                    activeId={activeSection}
                    onToggle={toggleSection}
                    right={
                      !form.slugTrimmed ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          Set URL dulu
                        </span>
                      ) : null
                    }
                  >
                    <IdentityCard
                      bind={form.bind}
                      validation={form.slugValidation}
                      slugTrimmed={form.slugTrimmed}
                      canEnable={form.canEnable}
                      noCard
                    />
                  </PBSection>
                </div>
            <div
              id="pb-section-theme"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="theme"
                title="Pilih tema"
                description="Stack, Bento, atau Editorial — atur layout halaman publik."
                icon={<Palette className="h-4 w-4" />}
                tone="indigo"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <ThemeCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div
              id="pb-section-style"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="style"
                title="Style — warna, font, radius"
                description="Custom layer di atas template: ganti warna utama, font family, lekukan sudut, dan kerapatan spasi."
                icon={<Brush className="h-4 w-4" />}
                tone="indigo"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <StyleCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div
              id="pb-section-hero-toggles"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="hero"
                title="Tampilkan di hero"
                description="Saklar opt-in untuk tiap kolom (avatar, bio, skills, dll)."
                icon={<User className="h-4 w-4" />}
                tone="brand"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <HeroTogglesCard
                  bind={form.bind}
                  noCard
                  profile={{
                    fullName: profileSnapshot.fullName,
                    bio: profileSnapshot.bio,
                    targetRole: profileSnapshot.targetRole,
                    skills: profileSnapshot.skills,
                  }}
                />
              </PBSection>
            </div>
            <div
              id="pb-section-availability"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="availability"
                title="Status: Tersedia untuk direkrut"
                description="Badge hijau di hero — recruiter skim ini pertama-tama."
                icon={<Briefcase className="h-4 w-4" />}
                tone="emerald"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <AvailabilityCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div id="pb-section-cta" className="rounded-xl transition-shadow">
              <PBSection
                sectionId="cta"
                title="Tombol utama (CTA)"
                description="Aksi paling penting yang Anda mau pengunjung lakukan."
                icon={<MousePointerClick className="h-4 w-4" />}
                tone="indigo"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <CtaCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div
              id="pb-section-layout"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="layout"
                title="Section halaman publik"
                description="Urutan + show/hide tiap section. Pengalaman / Pendidikan / Sertifikasi diambil otomatis dari CV."
                icon={<Layers className="h-4 w-4" />}
                tone="amber"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <SectionLayoutCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div
              id="pb-section-contact"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="contact"
                title="Kontak publik"
                description="Email, LinkedIn, Portfolio URL."
                icon={<Mail className="h-4 w-4" />}
                tone="brand"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <ContactCard bind={form.bind} noCard />
              </PBSection>
            </div>
            <div
              id="pb-section-indexing"
              className="rounded-xl transition-shadow"
            >
              <PBSection
                sectionId="indexing"
                title="Privasi & SEO"
                description="Kontrol indexing mesin pencari. Default mati."
                icon={<ShieldCheck className="h-4 w-4" />}
                tone="rose"
                activeId={activeSection}
                onToggle={toggleSection}
              >
                <IndexingCard bind={form.bind} noCard />
              </PBSection>
            </div>
            </div>
            <SaveActions
              saving={form.saving}
              canEnable={form.canEnable}
              submit={form.submit}
              lastSavedAt={form.lastSavedAt}
              autoSavePending={form.autoSavePending}
            />
          </PreviewSplitLayout>
        </TabsContent>

        {/* ===== Manual =====
            Same split-pane treatment as Otomatis — the live preview
            on the right reflects the current `mode === "custom"`
            block list, so users see exactly what their drag-drop
            edits will produce on the public page. */}
        <TabsContent value="custom" className="mt-4 space-y-4">
          <ModeWarning />
          <PreviewSplitLayout
            preview={
              <MiniPreviewFrame
                state={form.state}
                slugTrimmed={form.slugTrimmed}
              />
            }
          >
          <Tabs defaultValue="presets">
            <TabsList variant="pills">
              <TabsTrigger value="presets" className="gap-1.5">
                <Blocks className="h-4 w-4" />
                <span>Preset</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-1.5">
                <Layers className="h-4 w-4" />
                <span>Konten</span>
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5">
                <Palette className="h-4 w-4" />
                <span>Tampilan</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <SettingsIcon className="h-4 w-4" />
                <span>Pengaturan</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="mt-4 space-y-4">
              <BlockPresetsCard bind={form.bind} />
              <SaveActions
                saving={form.saving}
                canEnable={form.canEnable}
                submit={form.submit}
                lastSavedAt={form.lastSavedAt}
                autoSavePending={form.autoSavePending}
              />
            </TabsContent>

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
              <ManualDesignCard bind={form.bind} />
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
          </PreviewSplitLayout>
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

      <MobileActionBar
        saving={form.saving}
        canEnable={form.canEnable}
        onPreview={() => setPreviewOpen(true)}
        onPublish={form.submit}
      />
    </PageContainer>
  );
}
