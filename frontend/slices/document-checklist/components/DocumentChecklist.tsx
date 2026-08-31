"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle, Bell, Building2, Globe, Plane,
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import type { ChecklistItem } from "../types";
import { useChecklistData } from "../hooks/useChecklistData";
import { CategorySection } from "./document-checklist/CategorySection";
import { ItemDetailDialog } from "./document-checklist/ItemDetailDialog";
import { CountryTemplatePicker } from "./CountryTemplatePicker";

/**
 * Shortcut destinations for the "Destinasi Populer" carousel — country
 * codes must match a seeded `documentTemplates.country` value (see
 * `convex/_seeds/documents/index.ts`). Clicking a card sets `?country=<code>`
 * on the current URL, which `CountryTemplatePicker`'s own deep-link effect
 * (originally built for the Quest "Jalankan" flow) picks up and opens the
 * preview dialog for — no extra state wiring needed here.
 */
const POPULAR_DESTINATIONS = [
  { code: "SG", flag: "🇸🇬", label: "Singapura" },
  { code: "AU", flag: "🇦🇺", label: "Australia" },
  { code: "JP", flag: "🇯🇵", label: "Jepang" },
  { code: "AE", flag: "🇦🇪", label: "UAE" },
] as const;

export function DocumentChecklist() {
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("local");
  const pathname = usePathname();

  const {
    items, toggleItem, updateItem, isLoading,
    getFilteredItems, getProgress, getSubcategories,
  } = useChecklistData();

  const localProgress = getProgress("local");
  const internationalProgress = getProgress("international");

  return (
    // xl (not lg): CategorySection runs a rail + list two-column from `lg`
    // up, and a 6xl frame left the list too narrow to be worth splitting.
    <PageContainer size="xl">
      <ResponsivePageHeader
        title="Ceklis Dokumen"
        description="Kelola semua dokumen yang diperlukan untuk melamar pekerjaan"
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          // Subcategory filters are per-tab; a local-only filter would
          // yield an empty international list (and a mismatched header).
          setFilterCategory(null);
        }}
        className="space-y-6"
      >
        <TabsList variant="segmented">
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Kerja Lokal
          </TabsTrigger>
          <TabsTrigger value="international" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Kerja Luar Negeri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-6">
          <CategorySection
            isLoading={isLoading}
            category="local"
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            progress={localProgress}
            filteredItems={getFilteredItems("local", filterCategory)}
            subcategories={getSubcategories("local")}
            items={items}
            onToggle={toggleItem}
            onSelect={setSelectedItem}
            sidebarExtra={
              <Card
                role="button"
                tabIndex={0}
                onClick={() => {
                  // Opens the SKCK item's own detail dialog, where the
                  // existing due-date field (see ItemDetailDialog) can
                  // actually be set — this card used to be a dead end.
                  const skck = items.find((i) => i.id === "doc-4");
                  if (skck) setSelectedItem(skck);
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  const skck = items.find((i) => i.id === "doc-4");
                  if (skck) setSelectedItem(skck);
                }}
                className="border-border bg-gradient-to-br from-brand-muted to-brand-muted cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-brand-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand">Pengingat</h4>
                      <p className="text-sm text-brand mt-1">
                        SKCK perlu diperpanjang setiap 6 bulan. Klik untuk atur tanggal jatuh tempo.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>

        <TabsContent value="international" className="space-y-6">
          {/* Full-width, directly below the tab bar — see the layout note
              atop `CategorySection` for why the country picker moved out of
              its rail and up here. */}
          <CountryTemplatePicker />

          <CategorySection
            isLoading={isLoading}
            category="international"
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            progress={internationalProgress}
            filteredItems={getFilteredItems("international", filterCategory)}
            subcategories={getSubcategories("international")}
            items={items}
            onToggle={toggleItem}
            onSelect={setSelectedItem}
            notice={
              <Card className="border-warning/30 bg-warning/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-brand-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-warning-text">Penting untuk Kerja Luar Negeri</h4>
                      <p className="text-warning-text mt-1">
                        Persyaratan bervariasi sesuai negara. Selalu periksa persyaratan spesifik negara tujuan Anda.
                        Beberapa dokumen mungkin memerlukan apostille atau legalisasi.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
            sidebarExtra={
              <Card className="border-border bg-gradient-to-br from-info/20 to-info/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-info flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 text-brand-foreground" />
                    </div>
                    <h4 className="font-semibold text-info-text">Destinasi Populer</h4>
                  </div>
                  {/* Real shortcuts now, not static badges: each card sets
                      `?country=<code>` on the URL, which `CountryTemplatePicker`
                      picks up via its existing deep-link effect and opens
                      straight into that country's preview dialog. */}
                  <ResponsiveCarousel cellWidth="w-28" hideControls>
                    {POPULAR_DESTINATIONS.map((d) => (
                      <Link
                        key={d.code}
                        href={`${pathname}?country=${d.code}`}
                        scroll={false}
                        className="flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-4 text-center transition-colors hover:border-info/50 hover:bg-info/10"
                      >
                        <span className="text-3xl" aria-hidden="true">{d.flag}</span>
                        <span className="text-sm font-medium text-info-text">{d.label}</span>
                      </Link>
                    ))}
                  </ResponsiveCarousel>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>
      </Tabs>

      <ItemDetailDialog
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggle={toggleItem}
        onUpdate={updateItem}
      />
    </PageContainer>
  );
}
