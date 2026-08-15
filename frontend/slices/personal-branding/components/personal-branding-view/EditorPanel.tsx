"use client";

import {
  Briefcase, Globe, Layers, Mail, Palette, ShieldCheck, User,
} from "lucide-react";
import { PreviewSplitLayout } from "@/shared/components/layout/PreviewSplitLayout";
import { BrandingValidationCard } from "../../sections/BrandingValidationCard";
import { IdentityCard } from "../../sections/IdentityCard";
import { HeroTogglesCard } from "../../sections/HeroTogglesCard";
import { ContactCard } from "../../sections/ContactCard";
import { IndexingCard } from "../../sections/IndexingCard";
import { ThemeCard } from "../../sections/ThemeCard";
import { CustomHtmlCard } from "../../sections/CustomHtmlCard";
import { AvailabilityCard } from "../../sections/AvailabilityCard";
import { CtaCard } from "../../sections/CtaCard";
import { SectionLayoutCard } from "../../sections/SectionLayoutCard";
import { PBSection } from "../../sections/PBSection";
import { SaveActions } from "../../sections/SaveActions";
import { PBSectionNav } from "../PBSectionNav";
import { MiniPreviewFrame } from "../MiniPreviewFrame";
import type { usePBForm } from "../../form/usePBForm";
import type { usePreviewBranding } from "../../form/usePreviewBranding";

interface ProfileSnapshot {
  fullName: string;
  bio: string;
  targetRole: string;
  location: string;
  skills: string[];
}

interface Props {
  form: ReturnType<typeof usePBForm>;
  previewData: ReturnType<typeof usePreviewBranding>;
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
  toggleSection: (id: string) => void;
  profileSnapshot: ProfileSnapshot;
}

/**
 * The whole editor: seven accordion sections over one form.
 *
 * There used to be two of these side by side — "Otomatis" (this) and "Atur
 * sendiri", a block builder behind four more sub-tabs, each with its own save
 * bar and four of these same cards repeated. Nobody in production ever
 * switched to it. Custom layout now means custom HTML (see CustomHtmlCard),
 * which sits inside the Tampilan section rather than doubling the editor.
 */
export function EditorPanel({
  form, previewData, activeSection, setActiveSection,
  toggleSection, profileSnapshot,
}: Props) {
  const customHtmlActive = form.state.html.trim().length > 0;
  return (
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
      <div id="pb-section-validation" className="rounded-xl transition-shadow">
        <BrandingValidationCard branding={previewData?.branding} />
      </div>
      <div className="space-y-3">
        <div id="pb-section-identity" className="rounded-xl transition-shadow">
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
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning-text">
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
        <div id="pb-section-theme" className="rounded-xl transition-shadow">
          <PBSection
            sectionId="theme"
            title="Tampilan"
            description="Pilih template siap pakai, atau pasang HTML kustom yang kamu (atau ChatGPT) buat sendiri."
            icon={<Palette className="h-4 w-4" />}
            tone="indigo"
            activeId={activeSection}
            onToggle={toggleSection}
            right={
              customHtmlActive ? (
                <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                  HTML kustom
                </span>
              ) : null
            }
          >
            <div className="space-y-5">
              <ThemeCard bind={form.bind} overridden={customHtmlActive} />
              <div className="border-t border-border pt-4">
                <CustomHtmlCard bind={form.bind} />
              </div>
            </div>
          </PBSection>
        </div>
        <div id="pb-section-hero" className="rounded-xl transition-shadow">
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
                location: profileSnapshot.location,
                skills: profileSnapshot.skills,
              }}
            />
          </PBSection>
        </div>
        <div id="pb-section-layout" className="rounded-xl transition-shadow">
          <PBSection
            sectionId="layout"
            title="Section halaman publik"
            description="Urutan + show/hide tiap section. Pengalaman / Pendidikan / Sertifikasi diambil otomatis dari CV."
            icon={<Layers className="h-4 w-4" />}
            tone="amber"
            activeId={activeSection}
            onToggle={toggleSection}
          >
            <SectionLayoutCard bind={form.bind} />
          </PBSection>
        </div>
        <div id="pb-section-status" className="rounded-xl transition-shadow">
          <PBSection
            sectionId="status"
            title="Status & tombol utama"
            description="Badge 'tersedia untuk direkrut' plus satu CTA — dua hal yang recruiter lihat duluan."
            icon={<Briefcase className="h-4 w-4" />}
            tone="emerald"
            activeId={activeSection}
            onToggle={toggleSection}
          >
            <div className="space-y-5">
              <AvailabilityCard bind={form.bind} />
              <div className="border-t border-border pt-4">
                <CtaCard bind={form.bind} />
              </div>
            </div>
          </PBSection>
        </div>
        <div id="pb-section-contact" className="rounded-xl transition-shadow">
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
        <div id="pb-section-indexing" className="rounded-xl transition-shadow">
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
  );
}
