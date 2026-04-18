"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth";
import { HeroSection } from "@/features/hero";
import { CVGenerator } from "@/features/cv-generator";
import { SkillRoadmap } from "@/features/skill-roadmap";
import { DocumentChecklist } from "@/features/document-checklist";
import { CareerDashboard } from "@/features/career-dashboard";
import { MockInterview } from "@/features/mock-interview";
import { FinancialCalculator } from "@/features/financial-calculator";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { TweaksPanel } from "@/features/settings/components/TweaksPanel";
import { AppShell } from "@/shared/components/AppShell";
import { PlaceholderView } from "@/shared/components/PlaceholderView";
import { PullToRefresh } from "@/shared/components/MicroInteractions";
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
            title="Job Matcher"
            description="AI akan mencocokkan profil Anda dengan lowongan terbaru. Tap AI di nav bar dan ketik /match untuk demo."
          />
        );
      case "networking":
        return (
          <PlaceholderView
            icon={Users}
            title="Networking"
            description="Kelola kontak profesional, mentor, dan rekruter yang Anda kenal."
          />
        );
      case "portfolio":
        return (
          <PlaceholderView
            icon={Folder}
            title="Portfolio"
            description="Showcase proyek terbaik Anda. Akan ditarik otomatis dari section Projects di CV."
          />
        );
      case "help":
        return (
          <PlaceholderView
            icon={HelpCircle}
            title="Pusat Bantuan"
            description="FAQ, panduan penggunaan, dan kontak support."
          />
        );
      default:
        return <HeroSection onGetStarted={() => setCurrentView("cv")} />;
    }
  };

  return (
    <AppShell currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </AppShell>
  );
}
