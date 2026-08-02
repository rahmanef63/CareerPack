"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { ThemePresetProvider } from "@/shared/providers/ThemePresetProvider"
import { ConvexClientProvider } from "@/shared/providers/ConvexClientProvider"
import { AuthProvider } from "@/shared/hooks/useAuth"
import { AIConfigProvider } from "@/shared/hooks/useAIConfig"
import { UIPrefsProvider } from "@/shared/hooks/useUIPrefs"
import { LocaleProvider } from "@/shared/hooks/useLocale"
import { TranslateHint } from "@/shared/components/system/TranslateHint"
import { GoogleTranslate } from "@/shared/components/system/GoogleTranslate"
import { OfflineBanner } from "@/shared/components/system/OfflineBanner"
import { ThemeColorSync } from "@/shared/components/pwa/ThemeColorSync"
import { SWUpdatePrompt } from "@/shared/components/pwa/SWUpdatePrompt"
import { RegisterSW } from "@/shared/components/pwa/RegisterSW"
import { UpdateChecker } from "@/shared/components/system/UpdateChecker"
import { ExtensionErrorFilter } from "@/shared/providers/ExtensionErrorFilter"
import { CommandPalette } from "@/shared/components/command-palette/CommandPalette"
import { Toaster } from "@/shared/components/ui/sonner"
import { TooltipProvider } from "@/shared/components/ui/tooltip"
// Slice capability binders — each subscribes to the aiActionBus and
// runs skills declared in the slice's manifest. Mount one per slice
// that exposes mutation/compose skills. Removing a slice = removing
// its import here = clean modular boundary at compile time.
// Import the component file DIRECTLY, never the slice barrel: this is the
// root client entry of every route, and a barrel import drags the slice's
// whole UI (recharts, editors, …) into the shared chunk of /, /login, /offline.
import { SettingsCapabilities } from "@/slices/settings/components/SettingsCapabilities"
import { CalendarCapabilities } from "@/slices/calendar/components/CalendarCapabilities"
import { CareerDashboardCapabilities } from "@/slices/career-dashboard/components/CareerDashboardCapabilities"
import { NetworkingCapabilities } from "@/slices/networking/components/NetworkingCapabilities"
import { DocumentChecklistCapabilities } from "@/slices/document-checklist/components/DocumentChecklistCapabilities"
import { CVCapabilities } from "@/slices/cv-generator/components/CVCapabilities"
import { RoadmapCapabilities } from "@/slices/skill-roadmap/components/RoadmapCapabilities"
import { MatcherCapabilities } from "@/slices/matcher/components/MatcherCapabilities"
import { InterviewCapabilities } from "@/slices/mock-interview/components/InterviewCapabilities"
import { FinancialCapabilities } from "@/slices/financial-calculator/components/FinancialCapabilities"
import { PortfolioCapabilities } from "@/slices/portfolio/components/PortfolioCapabilities"
import { NotificationsCapabilities } from "@/slices/notifications/components/NotificationsCapabilities"
import { BrandingCapabilities } from "@/slices/personal-branding/components/BrandingCapabilities"
import { HelpCapabilities } from "@/slices/help/components/HelpCapabilities"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
     <ThemePresetProvider>
      <ConvexClientProvider>
        <AuthProvider>
          <AIConfigProvider>
            <UIPrefsProvider>
             <LocaleProvider>
              <TooltipProvider delayDuration={300}>
                {children}
                <SettingsCapabilities />
                <CalendarCapabilities />
                <CareerDashboardCapabilities />
                <NetworkingCapabilities />
                <DocumentChecklistCapabilities />
                <CVCapabilities />
                <RoadmapCapabilities />
                <MatcherCapabilities />
                <InterviewCapabilities />
                <FinancialCapabilities />
                <PortfolioCapabilities />
                <NotificationsCapabilities />
                <BrandingCapabilities />
                <HelpCapabilities />
                <ThemeColorSync />
                <CommandPalette />
                <ExtensionErrorFilter />
                <RegisterSW />
                <SWUpdatePrompt />
                <UpdateChecker />
                <GoogleTranslate />
                <TranslateHint />
                <OfflineBanner />
                <Toaster />
              </TooltipProvider>
             </LocaleProvider>
            </UIPrefsProvider>
          </AIConfigProvider>
        </AuthProvider>
      </ConvexClientProvider>
     </ThemePresetProvider>
    </ThemeProvider>
  )
}
