import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import {
  DM_Sans,
  Fira_Code,
  Fraunces,
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
// Weight ranges trimmed to 400/500/600/700 where possible; variable
// fonts use their native weight range.
//
// PERFORMANCE: only Inter (default Modern Minimal font) is eagerly
// preloaded. The other 22 are declared with `preload: false` so Next
// does NOT emit a <link rel="preload"> tag for them — the browser
// only fetches their woff2 when a tweakcn preset actually applies the
// font family at runtime (via `var(--font-*)` in CSS). Without this
// flag, initial page load fires 23 parallel font preload requests
// (~5-10 MB of woff2) even though the user only sees one preset's
// fonts. Cutting this to 1 preloaded font drops first-paint network
// waterfall dramatically on mobile / 3G.

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

// Display pairing — Fraunces (variable serif with SOFT + opsz axes) for
// hero titles, page greetings, auth headings. Warmer + editorial feel
// than the default sans. Preloaded eagerly alongside Inter because it
// hits the above-the-fold greeting on every dashboard page.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
  // `axes` requires the variable weight range — omit explicit weights.
  display: "swap",
})

// All below: preload: false (lazy — only fetched when a preset applies).
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap", weight: ["400", "500", "600", "700"], preload: false })
const poppins = Poppins({ subsets: ["latin"], variable: "--font-poppins", display: "swap", weight: ["400", "500", "600", "700"], preload: false })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false })
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", preload: false })
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap", preload: false })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans", display: "swap", preload: false })
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-oxanium", display: "swap", preload: false })
const quicksand = Quicksand({ subsets: ["latin"], variable: "--font-quicksand", display: "swap", preload: false })
const roboto = Roboto({ subsets: ["latin"], variable: "--font-roboto", display: "swap", weight: ["400", "500", "700"], preload: false })
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap", preload: false })

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap", preload: false })
const firaCode = Fira_Code({ subsets: ["latin"], variable: "--font-fira-code", display: "swap", preload: false })
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-ibm-plex-mono", display: "swap", weight: ["400", "500", "700"], preload: false })
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-source-code-pro", display: "swap", preload: false })
const spaceMono = Space_Mono({ subsets: ["latin"], variable: "--font-space-mono", display: "swap", weight: ["400", "700"], preload: false })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false })
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono", display: "swap", preload: false })

const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif-4", display: "swap", preload: false })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap", preload: false })
const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-merriweather", display: "swap", weight: ["400", "700"], preload: false })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap", preload: false })
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], variable: "--font-libre-baskerville", display: "swap", weight: ["400", "700"], preload: false })

// Compose all variable class names into one string so <html> registers
// every --font-* on :root. Next's runtime de-dupes and only ships the
// woff2 bytes actually referenced.
const ALL_FONT_CLASSES = [
  inter, fraunces, montserrat, poppins, dmSans, outfit, openSans, plusJakarta,
  oxanium, quicksand, roboto, geist,
  jetbrainsMono, firaCode, ibmPlexMono, sourceCodePro, spaceMono,
  geistMono, robotoMono,
  sourceSerif, lora, merriweather, playfair, libreBaskerville,
]
  .map((f) => f.variable)
  .join(" ")

const SITE_URL = "https://careerpack.org";

export const metadata: Metadata = {
  applicationName: "CareerPack",
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CareerPack — Starter pack karir Anda",
    template: "%s · CareerPack",
  },
  description:
    "CV ATS-friendly, roadmap karir, ceklis dokumen, asisten AI, dan lainnya — satu paket untuk karir Anda, baik lokal maupun luar negeri.",
  keywords: [
    "CV ATS-friendly",
    "pembuat CV Indonesia",
    "roadmap karir",
    "ceklis dokumen kerja",
    "persiapan wawancara",
    "asisten karir AI",
    "portofolio profesional",
  ],
  authors: [{ name: "CareerPack" }],
  creator: "CareerPack",
  publisher: "CareerPack",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // black-translucent shows the app content behind the status bar
    // on iOS PWA — feels more native than the default white.
    statusBarStyle: "black-translucent",
    title: "CareerPack",
    startupImage: [
      { url: "/apple-touch-icon.png" },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  // Next.js auto-emits <link rel> for every entry. Multiple sizes so
  // Android / iOS / desktop browsers each pick the right bitmap
  // instead of scaling a single 192 icon up/down.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "CareerPack",
    title: "CareerPack — Starter pack karir Anda",
    description:
      "CV ATS-friendly, roadmap karir, ceklis dokumen, asisten AI — satu paket untuk karir Anda.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CareerPack — Starter pack karir Anda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerPack — Starter pack karir Anda",
    description:
      "CV ATS-friendly, roadmap karir, ceklis dokumen, asisten AI — satu paket untuk karir Anda.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  // Best-effort early-hint headers — preconnect tells the browser to
  // open TCP + TLS to the Convex backend during HTML parse (saves
  // ~150–300 ms on first websocket upgrade for first-paint queries).
  // dns-prefetch is the cheaper fallback for browsers that ignore
  // preconnect.
  const convexOrigin = (() => {
    try {
      return process.env.NEXT_PUBLIC_CONVEX_URL
        ? new URL(process.env.NEXT_PUBLIC_CONVEX_URL).origin
        : null;
    } catch {
      return null;
    }
  })();
  return (
    <html lang="id" suppressHydrationWarning className={ALL_FONT_CLASSES}>
      <head>
        {convexOrigin && (
          <>
            <link rel="preconnect" href={convexOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={convexOrigin} />
          </>
        )}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
