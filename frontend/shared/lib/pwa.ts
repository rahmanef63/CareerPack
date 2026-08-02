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

/**
 * Module-level singleton — one `beforeinstallprompt` listener for the
 * whole page lifetime. Multiple `usePWAInstall` hook instances read from
 * here via `useSyncExternalStore`; they never register their own listeners
 * so `e.preventDefault()` is called exactly once per browser event.
 */

export interface PWAInstallSnapshot {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

const SERVER_SNAPSHOT: PWAInstallSnapshot = Object.freeze({
  deferred: null,
  installed: false,
});

// Cached snapshot — same reference until state changes. Required by the
// `useSyncExternalStore` contract: getSnapshot must return a stable value
// when nothing changed, otherwise React tears.
let _snapshot: PWAInstallSnapshot = { deferred: null, installed: false };
const _subscribers = new Set<() => void>();

function _setState(deferred: BeforeInstallPromptEvent | null, installed: boolean): void {
  if (_snapshot.deferred === deferred && _snapshot.installed === installed) return;
  _snapshot = { deferred, installed };
  _subscribers.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _setState(e, false);
  });

  window.addEventListener("appinstalled", () => {
    _setState(null, true);
  });

  // Already running in standalone mode (installed via OS).
  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    _setState(null, true);
  }
}

export function getPWAInstallSnapshot(): PWAInstallSnapshot {
  return _snapshot;
}

export function getPWAInstallServerSnapshot(): PWAInstallSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribePWAInstall(fn: () => void): () => void {
  _subscribers.add(fn);
  return () => {
    _subscribers.delete(fn);
  };
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
