"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot } from "lucide-react";
import { useAuth } from "@/features/auth";
import { AIChat } from "@/features/ai-chat";
import { HeroSection } from "@/features/hero";
import { CVGenerator } from "@/features/cv-generator";
import { SkillRoadmap } from "@/features/skill-roadmap";
import { DocumentChecklist } from "@/features/document-checklist";
import { CareerDashboard } from "@/features/career-dashboard";
import { MockInterview } from "@/features/mock-interview";
import { FinancialCalculator } from "@/features/financial-calculator";
import { Navigation } from "@/shared/components/Navigation";
import { Button } from "@/shared/components/ui/button";

export default function App() {
  const router = useRouter();
  const { state, logout } = useAuth();
  const [currentView, setCurrentView] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <HeroSection onGetStarted={() => setCurrentView("cv")} />;
      case "cv":
        return <CVGenerator />;
      case "roadmap":
        return <SkillRoadmap />;
      case "checklist":
        return <DocumentChecklist />;
      case "dashboard":
        return <CareerDashboard />;
      case "interview":
        return <MockInterview />;
      case "calculator":
        return <FinancialCalculator />;
      default:
        return <HeroSection onGetStarted={() => setCurrentView("cv")} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        user={state.user}
        onLogout={logout}
      />

      <main>{renderView()}</main>

      {!isChatOpen && (
        <Button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 bg-career-600 hover:bg-career-700 shadow-lg rounded-full px-6"
        >
          <Bot className="w-5 h-5 mr-2" />
          AI Assistant
        </Button>
      )}

      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <footer className="bg-card border-t border-border py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-career-500 to-career-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-foreground">CareerPack</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Starter pack lengkap untuk kesuksesan karir Anda. Dari pembuatan CV hingga mendapatkan pekerjaan impian.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Fitur</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setCurrentView("cv")} className="hover:text-career-600">Pembuat CV</button></li>
                <li><button onClick={() => setCurrentView("roadmap")} className="hover:text-career-600">Roadmap Skill</button></li>
                <li><button onClick={() => setCurrentView("checklist")} className="hover:text-career-600">Ceklis Dokumen</button></li>
                <li><button onClick={() => setCurrentView("interview")} className="hover:text-career-600">Simulasi Wawancara</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setCurrentView("dashboard")} className="hover:text-career-600">Dashboard</button></li>
                <li><button onClick={() => setCurrentView("calculator")} className="hover:text-career-600">Kalkulator Keuangan</button></li>
                <li><button onClick={() => setIsChatOpen(true)} className="hover:text-career-600">AI Assistant</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Admin</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {state.user?.role === "admin" && (
                  <li><Link href="/admin" className="hover:text-career-600">Admin Dashboard</Link></li>
                )}
                <li><a href="#" className="hover:text-career-600">Pusat Bantuan</a></li>
                <li><a href="#" className="hover:text-career-600">Kebijakan Privasi</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">© 2024 CareerPack. Dibuat untuk pencari kerja Indonesia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
