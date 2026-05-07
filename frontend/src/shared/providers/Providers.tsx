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
import { SettingsCapabilities } from "@/slices/settings"
import { CalendarCapabilities } from "@/slices/calendar"
import { CareerDashboardCapabilities } from "@/slices/career-dashboard"
import { NetworkingCapabilities } from "@/slices/networking"
import { DocumentChecklistCapabilities } from "@/slices/document-checklist"
import { CVCapabilities } from "@/slices/cv-generator"
import { RoadmapCapabilities } from "@/slices/skill-roadmap"
import { MatcherCapabilities } from "@/slices/matcher"
import { InterviewCapabilities } from "@/slices/mock-interview"
import { FinancialCapabilities } from "@/slices/financial-calculator"
import { PortfolioCapabilities } from "@/slices/portfolio"
import { NotificationsCapabilities } from "@/slices/notifications"
import { BrandingCapabilities } from "@/slices/personal-branding"
import { HelpCapabilities } from "@/slices/help"

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
                <TranslateHint />
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
