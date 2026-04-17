"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "@/shared/components/theme-provider"
import { ConvexClientProvider } from "@/ConvexClientProvider"
import { AuthProvider } from "@/features/auth"
import { AIConfigProvider } from "@/features/ai-chat"
import { Toaster } from "@/shared/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexClientProvider>
        <AuthProvider>
          <AIConfigProvider>
            {children}
            <Toaster />
          </AIConfigProvider>
        </AuthProvider>
      </ConvexClientProvider>
    </ThemeProvider>
  )
}
