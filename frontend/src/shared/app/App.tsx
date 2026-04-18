"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/hooks/useAuth";
import { HeroSection } from "@/slices/hero";
import { CVGenerator } from "@/slices/cv-generator";
import { SkillRoadmap } from "@/slices/skill-roadmap";
import { DocumentChecklist } from "@/slices/document-checklist";
import { CareerDashboard } from "@/slices/career-dashboard";
import { MockInterview } from "@/slices/mock-interview";
import { FinancialCalculator } from "@/slices/financial-calculator";
import { CalendarView } from "@/slices/calendar/components/CalendarView";
import { TweaksPanel } from "@/slices/settings/components/TweaksPanel";
import { AppShell } from "@/shared/components/AppShell";
import { PlaceholderView } from "@/shared/components/PlaceholderView";
import { PullToRefresh } from "@/shared/components/MicroInteractions";
import { AIAgentConsole } from "@/slices/ai-agent";
import { Bell, Compass, Folder, Users, HelpCircle } from "lucide-react";

export default function App() {
  const router = useRouter();
  const { state } = useAuth();
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.replace("/login");
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  if (state.isLoading || !state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-career-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleHomeRefresh = () =>
    new Promise<void>((resolve) => window.setTimeout(resolve, 600));

  const renderView = () => {
    switch (currentView) {
      case "home":
        return (
          <PullToRefresh onRefresh={handleHomeRefresh}>
            <HeroSection onGetStarted={() => setCurrentView("cv")} />
          </PullToRefresh>
        );
      case "cv":
        return <CVGenerator />;
      case "calendar":
        return <CalendarView />;
      case "roadmap":
        return <SkillRoadmap />;
      case "checklist":
        return <DocumentChecklist />;
      case "applications":
      case "dashboard":
        return <CareerDashboard />;
      case "interview":
        return <MockInterview />;
      case "calculator":
        return <FinancialCalculator />;
      case "settings":
        return <TweaksPanel />;
      case "notifications":
        return (
          <PlaceholderView
            icon={Bell}
            title="Notifikasi"
            description="Pemberitahuan terkait progres karir, tenggat dokumen, dan update lowongan akan muncul di sini."
          />
        );
      case "matcher":
        return (
          <PlaceholderView
            icon={Compass}
            title="Pencocok Lowongan"
            description="AI akan mencocokkan profil Anda dengan lowongan terbaru. Ketuk tombol AI di bar navigasi lalu ketik /match untuk demo."
          />
        );
      case "networking":
        return (
          <PlaceholderView
            icon={Users}
            title="Jaringan"
            description="Kelola kontak profesional, mentor, dan rekruter yang Anda kenal."
          />
        );
      case "portfolio":
        return (
          <PlaceholderView
            icon={Folder}
            title="Portofolio"
            description="Tampilkan proyek terbaik Anda. Akan ditarik otomatis dari bagian Proyek di CV."
          />
        );
      case "help":
        return (
          <PlaceholderView
            icon={HelpCircle}
            title="Pusat Bantuan"
            description="Tanya jawab, panduan penggunaan, dan kontak dukungan."
          />
        );
      default:
        return <HeroSection onGetStarted={() => setCurrentView("cv")} />;
    }
  };

  return (
    <AppShell
      currentView={currentView}
      onViewChange={setCurrentView}
      renderAIConsole={({ open, setOpen, currentView: cv, onNavigate }) => (
        <AIAgentConsole
          open={open}
          onOpenChange={setOpen}
          currentView={cv}
          onNavigate={onNavigate}
        />
      )}
    >
      {renderView()}
    </AppShell>
  );
}
