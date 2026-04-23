"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { ThemePresetProvider } from "@/shared/providers/ThemePresetProvider"
import { ConvexClientProvider } from "@/shared/providers/ConvexClientProvider"
import { AuthProvider } from "@/shared/hooks/useAuth"
import { AIConfigProvider } from "@/shared/hooks/useAIConfig"
import { UIPrefsProvider } from "@/shared/hooks/useUIPrefs"
import { InstallChip } from "@/shared/components/pwa/InstallChip"
import { Toaster } from "@/shared/components/ui/sonner"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

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
                <InstallChip />
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
