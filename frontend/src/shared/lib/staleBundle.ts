/**
 * Stale-bundle detection + recovery.
 *
 * Problem: when we ship breaking API changes (e.g. the 2026-04-25 convex
 * restructure that renamed every `api.<old>` → `api.<domain>.<file>`), an
 * already-installed PWA on a user's device runs the OLD JS bundle from
 * its service-worker cache while the BACKEND now exposes the NEW paths.
 * Every Convex call from the stale tab fails. Reopening in a new tab or
 * hard-refresh fixes it, but a non-technical user is stuck.
 *
 * Detection: Convex throws errors whose message contains a recognisable
 * "Could not find …" / "FunctionNotFoundError" / "is not a function"
 * pattern. We match those and surface an apologetic banner with a
 * one-click recovery: unregister SW + clear caches + reload with a
 * cache-bust query. The banner also offers "open in new tab" since some
 * iOS PWA installs ignore programmatic SW unregister.
 */

const STALE_PATTERNS = [
  /could not find (the )?(public )?function/i,
  /could not find (the )?function/i,
  /functionnotfounderror/i,
  /api\.[\w.]+ is not a function/i,
  /cannot read prop(erties|erty) of undefined.*(reading\s+'(query|mutation|action)')/i,
  /no such function/i,
  /unknown function/i,
  // Next.js chunk replaced after deploy — hash-named file returns 404
  /chunkloaderror/i,
  /loading chunk \d+ failed/i,
];

export function isStaleBundleError(err: unknown): boolean {
  if (!err) return false;
  let msg: string;
  if (err instanceof Error) {
    // Include name (e.g. "ChunkLoadError") — production bundles minify class
    // names in the stack but preserve them in err.name.
    msg = `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  } else if (typeof err === "string") {
    msg = err;
  } else {
    try {
      msg = JSON.stringify(err);
    } catch {
      msg = "";
    }
  }
  return STALE_PATTERNS.some((p) => p.test(msg));
}

/**
 * Hard-recovery: unregister all service workers, drop every named cache,
 * then reload with a `_v=<ts>` cache-buster on the URL so any HTTP
 * caching layer (CDN, proxy) also revalidates.
 *
 * Some browsers + iOS PWA installs may refuse to unregister SW from a
 * non-secure context or from inside a controlled session. We swallow
 * each step's failure individually so a partial recovery still ends in
 * `location.replace`.
 */
export async function forceFreshReload(): Promise<void> {
  // 1) SW unregister
  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch {
    /* fall through */
  }

  // 2) Cache Storage purge
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch {
    /* fall through */
  }

  // 3) Reload with cache-buster. `location.replace` keeps the back stack
  //    clean so the user can't accidentally navigate back to the broken
  //    instance.
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString(36));
    window.location.replace(url.toString());
  }
}
