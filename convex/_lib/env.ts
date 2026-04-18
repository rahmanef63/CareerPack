export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(`[env] ${key} wajib diisi di Convex dashboard`);
  }
  return val;
}

export function optionalEnv(key: string): string | undefined {
  const val = process.env[key];
  return val && val.trim() !== "" ? val : undefined;
}
