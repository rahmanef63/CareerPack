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
 * FORMATTING preference — dates, numbers, currency. Stored in localStorage.
 *
 * Scope is deliberately narrow: this hook does NOT translate anything. Text
 * translation is a separate axis handled by Google Translate
 * (`shared/lib/googleTranslate.ts`), because the two are genuinely
 * independent — someone working abroad may want Rupiah amounts with English
 * copy, or Indonesian copy with US date order.
 *
 * What it does own:
 *   1. `Intl.*` formatters (the whole reason it exists)
 *   2. The `<html lang>` attribute, so screen readers pronounce content with
 *      the right phonemes
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

function detectInitial(): LocalePref {
  if (typeof window === "undefined") return "id";
  const stored = window.localStorage.getItem(STORAGE_KEY) as LocalePref | null;
  return stored === "id" || stored === "en" ? stored : "id";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setState] = useState<LocalePref>(() => detectInitial());

  const setLocale = useCallback((l: LocalePref) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
    setState(l);
  }, []);

  // Keep `<html lang>` in sync so assistive tech switches voice/phonemes.
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
  }, [locale, setLocale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocale must be used inside <LocaleProvider>");
  return v;
}
