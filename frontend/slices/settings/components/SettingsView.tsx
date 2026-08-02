"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, SlidersHorizontal, UserRound, Globe, ArrowRight } from "lucide-react";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { AISettingsPanel } from "@/shared/components/ai-settings/AISettingsPanel";
import { McpConnectorCard } from "./McpConnectorCard";
import { Button } from "@/shared/components/ui/button";
import { QuickFillButton } from "@/shared/components/onboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { notify } from "@/shared/lib/notify";
import { parseAIConnectResult } from "../lib/aiConnectResult";
import { AppearanceSection } from "./AppearanceSection";
import { DangerZoneCard } from "./DangerZoneCard";
import { NotificationsCard } from "./NotificationsCard";
import { ProfileSection } from "./ProfileSection";
import { PageContainer } from "@/shared/components/layout/PageContainer";

type SettingsTab = "profile" | "appearance" | "ai";

/**
 * Halaman Pengaturan terpadu — menggabungkan dulu dua menu terpisah
 * (Profil & Tampilan vs Setelan AI) jadi satu entry di nav dengan 3 tab.
 *
 * Personal Branding dulunya nested di tab "Profil Akun" sebagai
 * `<PublicProfileSection>`. Sekarang fitur itu jadi entry sidebar
 * sendiri di /dashboard/personal-branding karena (1) lebih ditemukan
 * (sebelumnya user nggak nyangka harus masuk Settings dulu) dan
 * (2) UX-nya butuh ruang sendiri untuk status banner + dual-action
 * Save vs Save+Publish. Cross-link card di bawah profil tetap ada
 * supaya bookmark lama "/dashboard/settings" tetap bisa nemu pintunya.
 */
export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>("profile");
  const [connectFailed, setConnectFailed] = useState(false);

  // The provider OAuth callback returns to this page with `?ai=…`
  // (app/oauth/<provider>/callback → SETTINGS_HREF). Without this the user
  // comes back from the provider onto the default "Profil Akun" tab and sees
  // no trace of what they just did — success or failure.
  //
  // Read in an effect off `window.location`, not `useSearchParams`: this view
  // is dynamic()-imported WITHOUT `ssr: false`, so it prerenders, and
  // useSearchParams would push the whole dashboard route into a Suspense
  // bailout for one string read once.
  useEffect(() => {
    const result = parseAIConnectResult(window.location.search);
    if (!result) return;
    setTab("ai");
    setConnectFailed(result.status === "failed");
    // Failure gets a banner in the form; success gets nothing there but a
    // "Tersambung · disimpan <tanggal>" row that looks identical for a key
    // pasted last week — so the round-trip has to say so itself, once.
    if (result.status === "ok") notify.success("Akun AI tersambung");
    // Drop the param so a reload can't resurrect an outcome from minutes ago.
    const url = new URL(window.location.href);
    url.searchParams.delete("ai");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  return (
    <PageContainer size="sm" className="space-y-6">
      <ResponsivePageHeader
        title="Pengaturan"
        description="Atur profil, tampilan, dan koneksi AI Anda dari satu tempat."
        actions={<QuickFillButton variant="outline" size="sm" />}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as SettingsTab)}>
        <TabsList variant="equal" cols={3}>
          <TabsTrigger value="profile" className="gap-2">
            <UserRound className="w-4 h-4" />
            Profil Akun
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Tampilan
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="w-4 h-4" />
            AI &amp; Integrasi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-4">
          <ProfileSection />
          <NotificationsCard />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand" />
                Personal Branding
              </CardTitle>
              <CardDescription>
                Halaman publik di careerpack.org/[slug] sekarang punya
                menunya sendiri di sidebar. Pindah ke sana untuk
                mengaktifkan profil + atur kolom yang dibagikan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/personal-branding">
                  Buka Personal Branding
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <DangerZoneCard />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
        <TabsContent value="ai" className="space-y-4">
          {/* One form, not a login card stacked on a key card: account login is
              an affordance OF the selected provider, so it cannot be offered
              before the provider is picked. See ProviderAuthSection. */}
          <AISettingsPanel embedded connectFailed={connectFailed} />
          {/* Below the provider form on purpose: this tab is "AI & Integrasi",
              and an MCP connector is the integration half — it is about which
              OUTSIDE apps may drive this account, not about which model runs. */}
          <McpConnectorCard />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
