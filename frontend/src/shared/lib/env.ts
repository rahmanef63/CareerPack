// Runtime env validation — fail fast di build/startup kalau env wajib kosong.
// Sengaja tanpa zod untuk minimal deps; validasi cukup sederhana.

type EnvShape = {
  NEXT_PUBLIC_CONVEX_URL: string;
};

function requireEnv(key: keyof EnvShape): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(
      `[env] ${key} wajib diisi. Cek .env.local / deployment env.`,
    );
  }
  return val;
}

function parseUrl(key: keyof EnvShape, val: string): string {
  try {
    new URL(val);
  } catch {
    throw new Error(`[env] ${key} bukan URL valid: ${val}`);
  }
  return val;
}

export const env: EnvShape = {
  NEXT_PUBLIC_CONVEX_URL: parseUrl(
    "NEXT_PUBLIC_CONVEX_URL",
    requireEnv("NEXT_PUBLIC_CONVEX_URL"),
  ),
};
