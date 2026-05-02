"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { ThemePresetProvider } from "@/shared/providers/ThemePresetProvider"
import { ConvexClientProvider } from "@/shared/providers/ConvexClientProvider"
import { AuthProvider } from "@/shared/hooks/useAuth"
import { AIConfigProvider } from "@/shared/hooks/useAIConfig"
import { UIPrefsProvider } from "@/shared/hooks/useUIPrefs"
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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
     <ThemePresetProvider>
      <ConvexClientProvider>
        <AuthProvider>
          <AIConfigProvider>
            <UIPrefsProvider>
              <TooltipProvider delayDuration={300}>
                {children}
                <SettingsCapabilities />
                <CalendarCapabilities />
                <ThemeColorSync />
                <CommandPalette />
                <ExtensionErrorFilter />
                <RegisterSW />
                <SWUpdatePrompt />
                <UpdateChecker />
                <Toaster />
              </TooltipProvider>
            </UIPrefsProvider>
          </AIConfigProvider>
        </AuthProvider>
      </ConvexClientProvider>
     </ThemePresetProvider>
    </ThemeProvider>
  )
}
