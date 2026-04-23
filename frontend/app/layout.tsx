import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import {
  DM_Sans,
  Fira_Code,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Montserrat,
  Open_Sans,
  Outfit,
  Oxanium,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Quicksand,
  Roboto,
  Roboto_Mono,
  Source_Code_Pro,
  Source_Serif_4,
  Space_Mono,
} from "next/font/google"
import "@/shared/styles/index.css"
import "@/shared/styles/App.css"
import { Providers } from "@/shared/providers/Providers"

// Self-hosted fonts covering the families used across the 36 tweakcn
// presets in `frontend/public/r/registry.json`. Each font exposes a CSS
// variable (`--font-<slug>`) referenced by `REGISTRY_FONT_VAR` in
// `shared/lib/registryFonts.ts` so `applyPreset` can rewrite a preset's
// `font-sans` / `font-mono` / `font-serif` value to point at the loaded
// font before the browser falls back to generic system fonts.
//
// Weight ranges are trimmed to 400/500/600/700 where possible; variable
// fonts use their native weight range. This caps the woff2 payload at
// ~2 MB total, loaded lazily by the browser only when referenced.

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap", weight: ["400", "500", "600", "700"] })
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", display: "swap", weight: ["400", "500", "600", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans", display: "swap" })
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-oxanium", display: "swap" })
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand", display: "swap" })
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap", weight: ["400", "500", "700"] })
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" })

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" })
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code", display: "swap" })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-ibm-plex-mono", display: "swap", weight: ["400", "500", "700"] })
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code-pro", display: "swap" })
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-space-mono", display: "swap", weight: ["400", "700"] })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", display: "swap" })

const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4", display: "swap" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" })
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-merriweather", display: "swap", weight: ["400", "700"] })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" })
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], variable: "--font-libre-baskerville", display: "swap", weight: ["400", "700"] })

// Compose all variable class names into one string so <html> registers
// every --font-* on :root. Next's runtime de-dupes and only ships the
// woff2 bytes actually referenced.
const ALL_FONT_CLASSES = [
  inter, montserrat, poppins, dmSans, outfit, openSans, plusJakarta,
  oxanium, quicksand, roboto, geist,
  jetbrainsMono, firaCode, ibmPlexMono, sourceCodePro, spaceMono,
  geistMono, robotoMono,
  sourceSerif, lora, merriweather, playfair, libreBaskerville,
]
  .map((f) => f.variable)
  .join(" ")

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
    <html lang="id" suppressHydrationWarning className={ALL_FONT_CLASSES}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
