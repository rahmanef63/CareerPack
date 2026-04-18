"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/shared/components/theme-provider"
import { ConvexClientProvider } from "@/shared/providers/ConvexClientProvider"
import { AuthProvider } from "@/shared/hooks/useAuth"
import { AIConfigProvider } from "@/shared/hooks/useAIConfig"
import { UIPrefsProvider } from "@/shared/hooks/useUIPrefs"
import { InstallChip } from "@/shared/components/InstallChip"
import { Toaster } from "@/shared/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexClientProvider>
        <AuthProvider>
          <AIConfigProvider>
            <UIPrefsProvider>
              {children}
              <InstallChip />
              <Toaster />
            </UIPrefsProvider>
          </AIConfigProvider>
        </AuthProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  )
}
