// Runtime env validation — throw hanya time nilai dibaca (lazy),
// bukan time module load. Kalau throw time load, Next layout bundle
// akan crash sebelum error boundary dapat render.

type EnvShape = {
  NEXT_PUBLIC_CONVEX_URL: string;
};

// Convex HTTP Actions can live on a different origin from the realtime/API
// endpoint. Cloud deployments can derive .convex.site from .convex.cloud, but
// custom domains cannot be inferred safely, so production may provide this
// explicit site origin. Keep the access literal so Next can inline it.
const rawSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

const rawValues: Record<keyof EnvShape, string | undefined> = {
  // Harus literal `process.env.NEXT_PUBLIC_*` supaya Next inline value
  // time build. Dynamic key akses tak di-inline.
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
};

function readEnv(key: keyof EnvShape): string {
  const val = rawValues[key];
  if (!val || val.trim() === "") {
    throw new Error(`[env] ${key} wajib diisi.`);
  }
  if (key === "NEXT_PUBLIC_CONVEX_URL") {
    try {
      new URL(val);
    } catch {
      throw new Error(`[env] ${key} bukan URL valid: ${val}`);
    }
    // Guard against the Dockerfile placeholder shipping to prod —
    // happens when the build-arg `NEXT_PUBLIC_CONVEX_URL` isn't passed.
    // NEXT_PUBLIC_* gets inlined at build time, so a wrong value
    // silently disables every Convex call. Fail loud instead.
    if (val.includes("example.convex.cloud")) {
      throw new Error(`[env] ${key} placeholder belum diganti.`);
    }
  }
  return val;
}

export const env = {
  get NEXT_PUBLIC_CONVEX_URL() {
    return readEnv("NEXT_PUBLIC_CONVEX_URL");
  },
} satisfies EnvShape;

/**
 * Build the URL for a Convex HTTP route (e.g. `/api/password-reset/request`).
 *
 * - Explicit custom site origin: use `NEXT_PUBLIC_CONVEX_SITE_URL`.
 * - Convex Cloud fallback: derive `<dep>.convex.site` from `<dep>.convex.cloud`.
 * - Single-origin self-hosted fallback: keep the API origin unchanged.
 *
 * Strip trailing slash; caller appends a leading-slash path.
 */
export function convexHttpUrl(path: string): string {
  const base = env.NEXT_PUBLIC_CONVEX_URL.replace(/\/$/, "");
  let httpBase = base.replace(/\.convex\.cloud$/, ".convex.site");

  if (rawSiteUrl?.trim()) {
    try {
      const parsed = new URL(rawSiteUrl.trim());
      if (
        (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
        parsed.username ||
        parsed.password ||
        parsed.search ||
        parsed.hash ||
        (parsed.pathname !== "/" && parsed.pathname !== "")
      ) {
        throw new Error("site origin must be a bare http(s) origin");
      }
      httpBase = `${parsed.protocol}//${parsed.host}`;
    } catch {
      throw new Error("[env] NEXT_PUBLIC_CONVEX_SITE_URL bukan URL valid.");
    }
  }

  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${httpBase}${safePath}`;
}
