/**
 * Stale-bundle detection + recovery.
 *
 * Two failure modes are unified here:
 *
 * 1) Convex API drift — when a deploy renames `api.<old>` → `api.<new>`
 *    (e.g. the 2026-04-25 restructure), an installed PWA still running
 *    the OLD JS bundle from its SW cache calls a function the backend
 *    no longer exposes, and Convex throws "Could not find function …".
 *
 * 2) Next.js chunk hash drift — every build emits content-hashed chunks
 *    (`layout-2ffcd02….js`). After a deploy the OLD hash returns 404 and
 *    webpack throws `ChunkLoadError: Loading chunk N failed`.
 *
 * Both leave a non-technical user stuck on a broken page until they
 * hard-refresh. Detection here matches both error families; recovery
 * (`forceFreshReload`) unregisters SW + clears Cache Storage + reloads
 * with a `_v=` cache-buster.
 */

/**
 * Session key used by callers to ensure auto-reload fires at most once
 * per tab session — prevents reload loops if the new bundle is also
 * broken. Single source of truth so all callers stay in sync.
 */
export const CHUNK_RELOAD_KEY = "_car_chunk_reload";

const STALE_PATTERNS = [
  // Convex API drift
  /could not find (the )?(public )?function/i,
  /could not find (the )?function/i,
  /functionnotfounderror/i,
  /api\.[\w.]+ is not a function/i,
  /cannot read prop(erties|erty) of undefined.*(reading\s+'(query|mutation|action)')/i,
  /no such function/i,
  /unknown function/i,
  // Next.js chunk hash drift — `\S+` covers numeric AND non-numeric
  // chunk identifiers (`9097`, `app/(auth)/layout`, etc.)
  /chunkloaderror/i,
  /loading chunk \S+ failed/i,
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
 * Auto-reload guard. Returns true on the first call this session and
 * marks sessionStorage so subsequent calls return false. Falls back to
 * `false` if storage is unavailable (e.g. private mode) so callers fall
 * through to the manual recovery banner instead of looping.
 */
export function claimAutoReloadOnce(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/** Race a promise against a timeout — resolves either way, never rejects. */
function withTimeout(p: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([
    p.then(() => undefined).catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]);
}

/**
 * Hard-recovery: unregister all service workers, drop every named cache,
 * then reload with a `_v=<ts>` cache-buster on the URL so any HTTP
 * caching layer (CDN, proxy) also revalidates.
 *
 * Each step is wrapped in withTimeout(…, 1500) — even if Cache Storage
 * or SW unregister hangs (rare on iOS PWA), we still reach the reload
 * within ~3s instead of leaving the user staring at a broken page.
 */
export async function forceFreshReload(): Promise<void> {
  // 1) SW unregister
  const swWork = (async () => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  })();
  await withTimeout(swWork, 1500);

  // 2) Cache Storage purge
  const cacheWork = (async () => {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  })();
  await withTimeout(cacheWork, 1500);

  // 3) Reload with cache-buster. `location.replace` keeps the back stack
  //    clean so the user can't accidentally navigate back to the broken
  //    instance.
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    url.searchParams.set("_v", Date.now().toString(36));
    window.location.replace(url.toString());
  }
}
