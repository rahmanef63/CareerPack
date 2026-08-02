/**
 * Google Translate Element, driven by its own cookie instead of its widget.
 *
 * The widget script reads a `googtrans` cookie on load and translates the
 * live DOM to that target language. So the whole control surface we need is:
 * write the cookie, reload. That means
 *
 *   - our picker is plain shadcn UI, not Google's `.goog-te-combo` <select>
 *     (which arrives async, unstyled, and outside React's tree), and
 *   - the ~90KB Google script is only ever fetched for users who actually
 *     asked for a translation — an Indonesian visitor pays nothing.
 *
 * This is the whole i18n story on purpose. A message catalog for 22 slices
 * is weeks of extraction plus a permanent tax on every new string; Google
 * covers 100+ languages today at the cost of one cookie.
 *
 * ponytail: ceiling is that Google rewrites text nodes React owns, so a
 * translated page can hit a stray reconciliation error on heavy re-render
 * (same failure mode as Chrome's built-in translate, which users can trigger
 * on any site regardless). Upgrade path if that ever bites in practice:
 * next-intl with real catalogs — see docs/progress/2026-05-05-en-i18n-discovery.md.
 */

// Relative, not `@/shared/lib/env`: vitest.config.ts defines no `@` alias, so
// the alias form makes this whole module unimportable from its own test.

/** The page's authored language. Every translation is FROM this. */
export const SOURCE_LANG = "id";

const COOKIE = "googtrans";

/**
 * Set once the reader has expressed ANY language preference — dismissed the
 * banner, or picked from the language select, including picking Indonesian
 * back. Both the banner and the IP-country auto-translate check it.
 *
 * The googtrans cookie cannot carry this on its own: choosing Indonesian
 * DELETES the cookie, so on the next visit a reader who deliberately said
 * "Keep Indonesian" is indistinguishable from a first-timer — and would be
 * auto-translated straight back out of the language they just chose.
 *
 * Value is the original hint-dismissal key, unrenamed, so dismissals already
 * in visitors' browsers keep working.
 */
export const LANG_CHOICE_KEY = "careerpack:translate-hint-dismissed";

const COUNTRY_CACHE_KEY = "careerpack:geo-country";

/**
 * Offered targets. Deliberately not Google's full 100+ list: a long select is
 * worse UX than a short one, and these cover the languages this product's
 * audience actually reaches for — English for the international/Product Hunt
 * side, and the destination languages of the overseas-work checklists
 * (Japan, Korea, Taiwan, Germany, Netherlands, Gulf states).
 */
export const TRANSLATE_TARGETS = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "nl", label: "Nederlands" },
  { code: "pt", label: "Português" },
  { code: "zh-CN", label: "中文 (简体)" },
  { code: "zh-TW", label: "中文 (繁體)" },
] as const;

export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number]["code"];

/**
 * Countries whose visitors are better served by something other than English.
 * Only entries whose majority language is an offered target earn a row —
 * everywhere else falls through to English, which beats untranslated
 * Indonesian for a reader we know nothing else about.
 */
const COUNTRY_LANG: Record<string, TranslateTarget> = {
  JP: "ja",
  KR: "ko",
  // Traditional-script markets kept off the CN row on purpose.
  TW: "zh-TW",
  HK: "zh-TW",
  MO: "zh-TW",
  CN: "zh-CN",
  DE: "de",
  AT: "de",
  CH: "de",
  NL: "nl",
  MY: "ms",
  BN: "ms",
  FR: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  PT: "pt",
  BR: "pt",
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  OM: "ar",
  BH: "ar",
  EG: "ar",
  JO: "ar",
};

/**
 * The auto-translate decision, from the visitor's IP country plus their
 * browser language. Null means "do nothing automatic" and the caller falls
 * back to the offer banner.
 *
 * Country decides WHETHER, browser language decides WHICH — a Korean reader
 * on holiday in Germany is outside Indonesia (so: translate) but wants Korean,
 * not German. Country alone would hand them the wrong language; browser
 * language alone is what the banner already uses and is why it cannot
 * auto-apply.
 *
 * Three ways this returns null, each one a wrong translation prevented:
 *
 *   - Country unknown — header absent, upstream timed out, Tor exit. The
 *     endpoint already collapses every vendor non-answer (`XX`, `T1`) to
 *     null, so this only has to reject the shape, not the vendor quirks. The
 *     entire reason to prefer country over `navigator.language` is that it
 *     does not misfire, so a country we had to guess is worth less than the
 *     banner and gets none of its authority.
 *   - Country is Indonesia — an Indonesian on an en-US browser, the exact
 *     reader the banner was built to avoid steamrolling.
 *   - Browser language IS Indonesian — the mirror case, and the one that
 *     makes country insufficient on its own: an Indonesian in Tokyo would
 *     otherwise be auto-translated into Japanese.
 */
export function autoTranslateTarget(
  country: string | null | undefined,
  navLang: string | undefined,
): TranslateTarget | null {
  const cc = (country ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) || cc === "ID") return null;
  if ((navLang ?? "").toLowerCase().startsWith(SOURCE_LANG)) return null;
  return targetForBrowserLang(navLang) ?? COUNTRY_LANG[cc] ?? "en";
}

/**
 * Best offered target for a browser language tag, or null when the browser
 * already reads the source language (or nothing close is offered).
 *
 * Matches the base subtag so `en-GB` → `en`, but keeps `zh-TW` distinct from
 * `zh-CN` — Traditional vs Simplified is not a formatting detail.
 */
export function targetForBrowserLang(navLang: string | undefined): TranslateTarget | null {
  const tag = (navLang ?? "").toLowerCase();
  if (!tag || tag.startsWith(SOURCE_LANG)) return null;
  const exact = TRANSLATE_TARGETS.find((t) => t.code.toLowerCase() === tag);
  if (exact) return exact.code;
  const base = tag.split("-")[0];
  // zh needs the region to pick a script; default Simplified when absent.
  if (base === "zh") return tag.includes("tw") || tag.includes("hk") ? "zh-TW" : "zh-CN";
  return TRANSLATE_TARGETS.find((t) => t.code === base)?.code ?? null;
}

/**
 * Pull the active target out of a raw `document.cookie` string, or null when
 * untranslated. Split out from {@link activeTranslation} so it is testable
 * without a DOM — this is string parsing, not a browser feature, and pulling
 * in jsdom to assert on it would be the tail wagging the dog.
 */
export function parseGoogTrans(cookieHeader: string): string | null {
  const raw = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return null;
  // Value is `/<source>/<target>`; Google also accepts a bare `/auto/xx`.
  const target = decodeURIComponent(raw).split("/")[2];
  return target && target !== SOURCE_LANG ? target : null;
}

/** Currently active translation target, or null when untranslated. */
export function activeTranslation(): string | null {
  if (typeof document === "undefined") return null;
  return parseGoogTrans(document.cookie);
}

/**
 * Cookie domains to write. Google's widget looks the cookie up on the exact
 * host AND on the registrable domain, and which one it finds first depends on
 * how the page was reached (`careerpack.org` vs `www.careerpack.org`). Writing
 * both is the only way a switch survives that difference. Skipped for hosts
 * with no dot (localhost) — browsers reject a Domain attribute there.
 */
function cookieDomains(): (string | null)[] {
  const host = window.location.hostname;
  if (!host.includes(".")) return [null];
  const parts = host.split(".");
  const registrable = parts.slice(-2).join(".");
  return [null, `.${registrable}`];
}

/**
 * Switch the page translation. Reloads, because the widget only reads the
 * cookie during its own init — there is no supported way to re-target it
 * in place. Pass null to go back to the original Indonesian.
 */
export function setTranslation(target: TranslateTarget | null): void {
  if (typeof document === "undefined") return;
  // Records the reader's pick before the reload — see LANG_CHOICE_KEY. Also
  // written on the auto-translate path, where it doubles as a second stop
  // against re-deciding on the page the reload lands on.
  window.localStorage.setItem(LANG_CHOICE_KEY, "1");
  for (const domain of cookieDomains()) {
    const suffix = domain ? `;domain=${domain}` : "";
    document.cookie = target
      // max-age, not a session cookie. LANG_CHOICE_KEY is localStorage and
      // outlives the browser; the cookie carrying the actual translation did
      // not. On the next launch the marker suppressed both the banner and the
      // auto-translate while the translation itself was gone — the visitor who
      // read this app in English yesterday got untranslated Indonesian with no
      // control left on any public page.
      ? `${COOKIE}=/${SOURCE_LANG}/${target};path=/;max-age=31536000${suffix}`
      : `${COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT${suffix}`;
  }
  window.location.reload();
}

/**
 * The visitor's ISO country from the Convex geo route, or null when it can't
 * be resolved.
 *
 * Cached in sessionStorage because the answer costs a round-trip — and, when
 * Cloudflare doesn't hand the backend a country, an upstream lookup on top of
 * that — while a visitor does not move between renders. Per tab rather than
 * forever so that a failed lookup, or a flight, self-heals on the next visit
 * instead of pinning a wrong answer permanently. `""` is the cached form of
 * "asked, unknown", which is why the read tests for `null` rather than
 * falsiness: without that distinction a miss re-fetches on every mount.
 *
 * Cannot reject. Offline, CORS, a 500, a stalled socket, storage disabled in
 * a locked-down browser — every one resolves to null, and null means the
 * caller keeps the browser-language offer banner.
 */
export async function visitorCountry(): Promise<string | null> {
  try {
    const cached = window.sessionStorage.getItem(COUNTRY_CACHE_KEY);
    if (cached !== null) return cached || null;
    // Same-origin Next route, not the Convex SITE origin: it answers from the
    // bundled geoip-lite database, so the visitor's IP never leaves this
    // deployment. The Convex version asked api.country.is, which meant every
    // visitor's address went to a third party the privacy policy does not name.
    const res = await fetch("/api/geo", {
      // Client-side deadline: a request stalled before it reaches the server
      // has no server timeout to save it, and it would hold the banner back
      // for the browser's default (minutes).
      signal: AbortSignal.timeout(2_500),
    });
    const body = res.ok ? ((await res.json()) as { country?: unknown }) : {};
    const country = typeof body.country === "string" && body.country ? body.country : null;
    window.sessionStorage.setItem(COUNTRY_CACHE_KEY, country ?? "");
    return country;
  } catch {
    return null;
  }
}
