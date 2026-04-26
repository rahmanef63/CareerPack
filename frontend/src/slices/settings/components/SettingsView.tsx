"use client";

import { useState } from "react";
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
import { Button } from "@/shared/components/ui/button";
import { QuickFillButton } from "@/shared/components/onboarding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { AppearanceSection } from "./AppearanceSection";
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
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
        <TabsContent value="ai">
          <AISettingsPanel embedded />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
