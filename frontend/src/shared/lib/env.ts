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
    throw new Error(
      `[env] ${key} wajib diisi. Cek .env.local / deployment env.`,
    );
  }
  if (key === "NEXT_PUBLIC_CONVEX_URL") {
    try {
      new URL(val);
    } catch {
      throw new Error(`[env] ${key} bukan URL valid: ${val}`);
    }
  }
  return val;
}

export const env = {
  get NEXT_PUBLIC_CONVEX_URL() {
    return readEnv("NEXT_PUBLIC_CONVEX_URL");
  },
} satisfies EnvShape;
