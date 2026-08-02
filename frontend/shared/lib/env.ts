// Runtime env validation — throw hanya time nilai dibaca (lazy),
// bukan time module load. Kalau throw time load, Next layout bundle
// akan crash sebelum error boundary dapat render.

type EnvShape = {
  NEXT_PUBLIC_CONVEX_URL: string;
};

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
 * - Convex cloud: ws lives at `<dep>.convex.cloud`, HTTP at `<dep>.convex.site`.
 * - Self-hosted: same host serves both — translate is a no-op.
 *
 * Strip trailing slash; caller appends a leading-slash path.
 */
export function convexHttpUrl(path: string): string {
  const base = env.NEXT_PUBLIC_CONVEX_URL.replace(/\/$/, "");
  const httpBase = base.replace(/\.convex\.cloud$/, ".convex.site");
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${httpBase}${safePath}`;
}
