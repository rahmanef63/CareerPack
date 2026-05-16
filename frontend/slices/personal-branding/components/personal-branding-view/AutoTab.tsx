"use client";

import {
  Briefcase, Globe, Layers, Mail, MousePointerClick,
  Palette, ShieldCheck, User,
} from "lucide-react";
import { TabsContent } from "@/shared/components/ui/tabs";
import { PreviewSplitLayout } from "@/shared/components/layout/PreviewSplitLayout";
import { BrandingValidationCard } from "../../sections/BrandingValidationCard";
import { IdentityCard } from "../../sections/IdentityCard";
import { HeroTogglesCard } from "../../sections/HeroTogglesCard";
import { ContactCard } from "../../sections/ContactCard";
import { IndexingCard } from "../../sections/IndexingCard";
import { ThemeCard } from "../../sections/ThemeCard";
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

export function AutoTab({
  form, previewData, activeSection, setActiveSection,
  toggleSection, profileSnapshot,
}: Props) {
  return (
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
          <div id="pb-section-theme" className="rounded-xl transition-shadow">
            <PBSection
              sectionId="theme"
              title="Pilih template"
              description="Purple Glass · Editorial Cream · Premium Dark. Setiap template sudah punya warna + font + layout yang kohesif — pilih yang paling cocok dan template yang urus sisanya."
              icon={<Palette className="h-4 w-4" />}
              tone="indigo"
              activeId={activeSection}
              onToggle={toggleSection}
            >
              <ThemeCard bind={form.bind} noCard />
            </PBSection>
          </div>
          <div id="pb-section-hero-toggles" className="rounded-xl transition-shadow">
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
          <div id="pb-section-availability" className="rounded-xl transition-shadow">
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
              <SectionLayoutCard bind={form.bind} noCard />
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
    </TabsContent>
  );
}
