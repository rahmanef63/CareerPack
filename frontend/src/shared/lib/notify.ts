"use client";

import { toast, type ExternalToast } from "sonner";
import { ConvexError } from "convex/values";

/**
 * Central toast facade.
 *
 * Why this exists:
 * - Convex throws `Error("pesan Indonesia")` which crosses the RPC
 *   boundary wrapped as `"[CONVEX A(module:fn)] [Request ID: xxx] Server
 *   ErrorUncaught Error: <real message>    at requireEnv (...)"`. Raw
 *   `err.message` leaks that envelope + a stack trace into the toast.
 * - Without a facade, every caller writes the same
 *   `err instanceof Error ? err.message : "Gagal ..."` pattern — 30+
 *   copies of an error-handling ritual that doesn't handle errors.
 * - Backend error strings ("Tidak terautentikasi", quota hit, missing
 *   env) deserve one central mapping to friendlier UX strings instead
 *   of being repeated verbatim per-module.
 *
 * Usage:
 *   notify.success("Tersimpan");
 *   notify.error("Validasi gagal", { description: "Nama wajib diisi" });
 *   notify.fromError(err, "Gagal menyimpan profil");
 *
 * Always prefer `notify.fromError(err, fallback)` in catch blocks —
 * never pass `err.message` to `toast.error` directly.
 */

interface ErrorOptions extends ExternalToast {
  /** Override the fallback message used when the error can't be humanized. */
  fallback?: string;
}

/**
 * Patterns that strip the Convex server-error envelope. The goal is to
 * leave only the human message the backend actually threw.
 *
 * Example raw input:
 *   "[CONVEX A(translateCV:translate)] [Request ID: abc] Server ErrorUncaught Error: [env] CONVEX_OPENAI_BASE_URL wajib diisi    at requireEnv (../../convex/_lib/env.ts:5:9)"
 * After cleanup:
 *   "[env] CONVEX_OPENAI_BASE_URL wajib diisi"
 * Then humanKnownError maps it to:
 *   "Layanan AI belum dikonfigurasi. Hubungi admin."
 */
const CONVEX_ENVELOPE = /^\s*\[CONVEX\s+[^\]]*\]\s*(?:\[Request ID:[^\]]*\]\s*)?Server Error\s*/i;
const UNCAUGHT_PREFIX = /^Uncaught\s+(?:Error|ConvexError):\s*/i;
const STACK_TRACE = /\n?\s+at\s+.+/gs;

function stripEnvelope(raw: string): string {
  let out = raw.replace(CONVEX_ENVELOPE, "");
  out = out.replace(UNCAUGHT_PREFIX, "");
  // Stack frames — drop everything from the first `    at ` onward.
  out = out.split(STACK_TRACE)[0];
  // Trim trailing whitespace + any lingering newlines.
  return out.replace(/\s+$/, "").trim();
}

/**
 * Translate raw backend strings into user-friendly Indonesian UX copy.
 * Matched in order — first hit wins.
 */
const KNOWN_ERRORS: Array<[RegExp, string]> = [
  [/\[env\].+wajib diisi di Convex dashboard/i, "Layanan AI belum dikonfigurasi. Hubungi admin untuk mengaktifkan."],
  [/Tidak terautentikasi/i, "Sesi Anda berakhir. Silakan login ulang."],
  [/rate limit|quota|terlalu banyak/i, "Anda sudah mencapai batas pemakaian. Coba lagi beberapa menit lagi."],
  [/(unauthori[sz]ed|forbidden|akses ditolak)/i, "Anda tidak memiliki akses ke resource ini."],
  [/not found|tidak ditemukan/i, "Data tidak ditemukan."],
  [/network|failed to fetch|TypeError: fetch/i, "Koneksi bermasalah. Periksa internet Anda."],
  [/Server Error/i, "Server sedang bermasalah. Coba lagi nanti."],
];

function mapKnown(msg: string, fallback: string): string {
  if (!msg) return fallback;
  for (const [pattern, friendly] of KNOWN_ERRORS) {
    if (pattern.test(msg)) return friendly;
  }
  return msg;
}

/**
 * Best-effort conversion of any thrown value into a clean, user-safe
 * Indonesian string. Handles ConvexError (preferred — explicit data
 * payload), plain Error (strip envelope + map known), strings, unknown.
 */
export function humanMessage(err: unknown, fallback: string): string {
  if (err instanceof ConvexError) {
    const data = err.data as unknown;
    if (typeof data === "string") return mapKnown(data, fallback);
    if (data && typeof data === "object") {
      const rec = data as Record<string, unknown>;
      if (typeof rec.message === "string") return mapKnown(rec.message, fallback);
    }
    return fallback;
  }
  if (err instanceof Error) {
    return mapKnown(stripEnvelope(err.message), fallback);
  }
  if (typeof err === "string") {
    return mapKnown(stripEnvelope(err), fallback);
  }
  return fallback;
}

/**
 * Sonner dedupes by `id`. We default id to a hash of the message so
 * the same error fired twice in rapid succession collapses into one
 * toast instead of stacking.
 */
function idFor(kind: string, message: string): string {
  return `${kind}:${message.slice(0, 64)}`;
}

export const notify = {
  success(message: string, opts?: ExternalToast) {
    return toast.success(message, { id: idFor("ok", message), ...opts });
  },
  info(message: string, opts?: ExternalToast) {
    return toast.info(message, { id: idFor("info", message), ...opts });
  },
  warning(message: string, opts?: ExternalToast) {
    return toast.warning(message, { id: idFor("warn", message), ...opts });
  },
  error(message: string, opts?: ExternalToast) {
    return toast.error(message, { id: idFor("err", message), ...opts });
  },
  /**
   * Preferred way to report caught errors. `title` is shown large,
   * the humanized detail is shown as description. Fallback kicks in
   * when the error yields nothing human-friendly.
   */
  fromError(err: unknown, title: string, opts?: ErrorOptions) {
    const { fallback, ...rest } = opts ?? {};
    const detail = humanMessage(err, fallback ?? title);
    // Swallow the description line when it equals the title — avoids
    // the same string stacked twice in the toast body.
    const description = detail === title ? undefined : detail;
    if (process.env.NODE_ENV !== "production") {
      console.error(`[notify] ${title}:`, err);
    }
    return toast.error(title, {
      id: idFor("err", title),
      description,
      ...rest,
    });
  },
  /**
   * Field-level validation shortcut. Use in form submit handlers
   * before hitting the backend — consistent tone everywhere.
   */
  validation(message: string, description?: string) {
    return toast.warning(message, {
      id: idFor("val", message),
      description,
    });
  },
  dismiss: toast.dismiss,
};

export type Notify = typeof notify;
