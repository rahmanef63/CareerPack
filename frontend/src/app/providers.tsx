"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/slices/shared/components/theme-provider"
import { ConvexClientProvider } from "@/ConvexClientProvider"
import { AuthProvider } from "@/slices/shared/hooks/useAuth"
import { AIConfigProvider } from "@/slices/shared/hooks/useAIConfig"
import { UIPrefsProvider } from "@/slices/shared/hooks/useUIPrefs"
import { InstallChip } from "@/slices/shared/components/InstallChip"
import { Toaster } from "@/slices/shared/components/ui/sonner"

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
