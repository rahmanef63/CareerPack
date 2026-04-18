/**
 * PWA helpers — service-worker registration + install prompt plumbing.
 * All functions are no-ops during SSR; guarded by `typeof window !== "undefined"`.
 */

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Only register on https or localhost; skip when previewed in an iframe sandbox.
  const { protocol, hostname } = window.location;
  const isSecure =
    protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
  if (!isSecure) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => console.warn("[PWA] registrasi service worker gagal:", err));
  });
}

// BeforeInstallPromptEvent isn't part of the standard lib.dom yet.
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
