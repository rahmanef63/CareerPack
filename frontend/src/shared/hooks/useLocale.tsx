"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Locale preference — stored in localStorage so it survives reloads.
 *
 * Phase 1 strategy is "browser-translate-first": the app's content
 * remains in Bahasa Indonesia by default; users who prefer English
 * are pointed to their browser's built-in page translation. This
 * hook still tracks the user's preference so:
 *
 *   1. `Intl.*` formatters can pivot (dates, numbers, currency)
 *   2. The `<html lang>` attribute reflects the actual content
 *      language so browsers correctly *offer* to translate
 *   3. A one-time hint banner appears for non-id browsers
 *
 * Adding a real translation layer (e.g. next-intl with message
 * catalogs) is a multi-day effort; the discovery doc lives at
 * `docs/progress/2026-05-05-en-i18n-discovery.md`. Until then, this
 * is the dynamic primitive every locale-aware UI bit consumes.
 */

export type LocalePref = "id" | "en";
const STORAGE_KEY = "careerpack:locale-pref";

interface LocaleCtx {
  /** User's stored preference. Defaults from navigator.language. */
  locale: LocalePref;
  setLocale: (l: LocalePref) => void;
  /** BCP-47 tag for `Intl.*` constructors (id-ID / en-US). */
  intlTag: string;
  /** Currency tag follows the locale (IDR for id, USD for en). */
  currencyCode: string;
  /** Did the auto-detect resolve to a non-id browser? Used by hint. */
  browserNonId: boolean;
  /** Format a number per current locale (no currency symbol). */
  formatNumber: (n: number, opts?: Intl.NumberFormatOptions) => string;
  /** Format a currency amount per current locale + currency code. */
  formatCurrency: (n: number, currency?: string) => string;
  /** Format a date per current locale (short style). */
  formatDate: (
    v: number | Date | string,
    opts?: Intl.DateTimeFormatOptions,
  ) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

function detectInitial(): { locale: LocalePref; browserNonId: boolean } {
  if (typeof window === "undefined") {
    return { locale: "id", browserNonId: false };
  }
  // Stored preference wins over auto-detect.
  const stored = window.localStorage.getItem(STORAGE_KEY) as LocalePref | null;
  const browser = (navigator.language ?? "id-ID").toLowerCase();
  const browserNonId = !browser.startsWith("id");
  if (stored === "id" || stored === "en") {
    return { locale: stored, browserNonId };
  }
  // Default: stay on Indonesian content. The hint banner will offer
  // browser translate to non-id users.
  return { locale: "id", browserNonId };
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [{ locale, browserNonId }, setState] = useState(() => detectInitial());

  const setLocale = useCallback((l: LocalePref) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
    setState((s) => ({ ...s, locale: l }));
  }, []);

  // Keep `<html lang>` in sync. Browsers offer "Translate" only when
  // the lang attribute mismatches their preferred language — flipping
  // this dynamically also helps screen readers.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "en" ? "en" : "id";
  }, [locale]);

  const value = useMemo<LocaleCtx>(() => {
    const intlTag = locale === "en" ? "en-US" : "id-ID";
    const currencyCode = locale === "en" ? "USD" : "IDR";
    return {
      locale,
      setLocale,
      intlTag,
      currencyCode,
      browserNonId,
      formatNumber: (n, opts) =>
        new Intl.NumberFormat(intlTag, opts).format(n),
      formatCurrency: (n, currency) =>
        new Intl.NumberFormat(intlTag, {
          style: "currency",
          currency: currency ?? currencyCode,
          maximumFractionDigits: 0,
        }).format(n),
      formatDate: (v, opts) => {
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return "—";
        return new Intl.DateTimeFormat(
          intlTag,
          opts ?? { day: "numeric", month: "short", year: "numeric" },
        ).format(d);
      },
    };
  }, [locale, setLocale, browserNonId]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocale must be used inside <LocaleProvider>");
  return v;
}
