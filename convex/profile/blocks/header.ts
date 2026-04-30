/** Header background + accent sanitisers. */

import { sanitizeUrl, trimSafe } from "./helpers";

const ACCENT_HEX_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export const HEADER_GRADIENT_PRESETS: ReadonlyArray<string> = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-emerald-400 via-cyan-400 to-sky-500",
  "from-rose-400 via-fuchsia-500 to-indigo-600",
  "from-amber-300 via-orange-400 to-rose-500",
  "from-slate-700 via-slate-900 to-black",
  "from-cyan-200 via-blue-400 to-indigo-600",
  "from-lime-300 via-emerald-400 to-teal-600",
  "from-pink-300 via-rose-400 to-orange-400",
];
const HEADER_GRADIENT_SET = new Set(HEADER_GRADIENT_PRESETS);

export function sanitizeHeaderBg(
  raw: unknown,
):
  | { kind: "gradient" | "solid" | "image" | "none"; value: string }
  | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = r.kind;
  if (kind === "none") return { kind: "none", value: "" };
  if (kind === "gradient") {
    const v = trimSafe(r.value, 200);
    if (!HEADER_GRADIENT_SET.has(v)) return null;
    return { kind, value: v };
  }
  if (kind === "solid") {
    const v = trimSafe(r.value, 12);
    if (!ACCENT_HEX_RE.test(v)) return null;
    return { kind, value: v.toLowerCase() };
  }
  if (kind === "image") {
    const v = sanitizeUrl(r.value);
    if (!v) return null;
    return { kind, value: v };
  }
  return null;
}

export function sanitizeAccent(raw: unknown): string | null {
  const v = trimSafe(raw, 12);
  if (!v) return null;
  if (!ACCENT_HEX_RE.test(v)) return null;
  return v.toLowerCase();
}
