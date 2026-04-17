import type { Metadata } from "next"
import type { ReactNode } from "react"
import "../src/index.css"
import "../src/App.css"
import { Providers } from "@/app/providers"

export const metadata: Metadata = {
  title: "CareerPack",
  description: "Career starter pack app",
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
