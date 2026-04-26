import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ErrorBoundary } from "@/shared/components/error/ErrorBoundary";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Route group untuk halaman autentikasi standalone (login, forgot-password,
 * reset-password). Tidak pakai MarketingHeader/Footer — tiap page punya
 * full-screen `AuthShell` sendiri. Meta `noindex` supaya token reset
 * tidak ter-crawl search engine.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
