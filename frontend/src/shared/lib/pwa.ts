/**
 * PWA helpers — service-worker registration + install prompt plumbing.
 * All functions are no-ops during SSR; guarded by `typeof window !== "undefined"`.
 */

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

// ---- Module-level singleton ----
// One listener for the entire lifetime of the page. Multiple `usePWAInstall`
// hook instances read from here; they never register their own listeners so
// `e.preventDefault()` is called exactly once per browser event.

let _deferred: BeforeInstallPromptEvent | null = null;
let _installed = false;
const _subscribers = new Set<() => void>();

function _notify() {
  _subscribers.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferred = e;
    _installed = false;
    _notify();
  });

  window.addEventListener("appinstalled", () => {
    _deferred = null;
    _installed = true;
    _notify();
  });

  // Already running in standalone mode (installed via OS)
  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    _installed = true;
  }
}

export function getPWAInstallState() {
  return { deferred: _deferred, installed: _installed };
}

export function subscribePWAInstall(fn: () => void): () => void {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

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
