import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import "../src/index.css"
import "../src/App.css"
import { Providers } from "@/app/providers"

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
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
