"use client";

import { useState } from "react";
import { Sparkles, SlidersHorizontal, UserRound } from "lucide-react";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { AISettingsPanel } from "@/slices/ai-settings";
import { AppearanceSection } from "./AppearanceSection";
import { ProfileSection } from "./ProfileSection";
import { PublicProfileSection } from "./PublicProfileSection";

type SettingsTab = "profile" | "appearance" | "ai";

/**
 * Halaman Pengaturan terpadu — menggabungkan dulu dua menu terpisah
 * (Profil & Tampilan vs Setelan AI) jadi satu entry di nav dengan 3 tab.
 */
export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>("profile");

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <ResponsivePageHeader
        title="Pengaturan"
        description="Atur profil, tampilan, dan koneksi AI Anda dari satu tempat."
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
          <PublicProfileSection />
        </TabsContent>
        <TabsContent value="appearance">
          <AppearanceSection />
        </TabsContent>
        <TabsContent value="ai">
          <AISettingsPanel embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
