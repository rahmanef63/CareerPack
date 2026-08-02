/**
 * App metadata — single source of truth.
 *
 * Edit here when cutting a release. Used by the dashboard footer and
 * anywhere else we surface a human-readable app version. Kept in sync
 * with `frontend/package.json` on each tag; a pre-release hook could
 * automate the bump but for now it's a one-line manual edit.
 *
 * Rationale: importing `package.json` directly would require
 * `resolveJsonModule` in every referring tsconfig and introduces a
 * circular dependency between build config and runtime code. A tiny
 * constant file is simpler and cheaper.
 */
export const APP_NAME = "CareerPack";

/** Semantic version, matches `package.json.version`. */
export const APP_VERSION = "1.0.0";
