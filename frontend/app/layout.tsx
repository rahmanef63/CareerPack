import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Inter, JetBrains_Mono } from "next/font/google"
import "@/shared/styles/index.css"
import "@/shared/styles/App.css"
import { Providers } from "@/shared/providers/Providers"

// Self-hosted Google Fonts via next/font. Matches default --font-sans /
// --font-mono tokens in index.css (modern-minimal preset). Preset switches
// that specify other fonts fall back to system chain until loaded.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-inter",
  display: "swap",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-jetbrains",
  display: "swap",
})

export const metadata: Metadata = {
  applicationName: "CareerPack",
  title: {
    default: "CareerPack",
    template: "%s · CareerPack",
  },
  description:
    "Starter pack lengkap untuk kesuksesan karir Anda. CV ATS-friendly, roadmap karir, checklist dokumen, dan Asisten AI.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CareerPack",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
