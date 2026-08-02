"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TranslatePicker } from "@/shared/components/system/GoogleTranslate";
import {
  activeTranslation,
  autoTranslateTarget,
  LANG_CHOICE_KEY,
  setTranslation,
  SOURCE_LANG,
  targetForBrowserLang,
  TRANSLATE_TARGETS,
  visitorCountry,
  type TranslateTarget,
} from "@/shared/lib/googleTranslate";

/**
 * Decides what a non-Indonesian visitor sees: an automatic translation when we
 * know they are abroad, otherwise a one-tap offer.
 *
 * The offer used to be the ONLY behaviour, because the signal available was
 * `navigator.language` — and an English-locale browser in Jakarta is extremely
 * common, so auto-translating Indonesian copy for an Indonesian reader was the
 * worse failure. IP country answers that objection: it says Jakarta for the
 * Jakarta reader no matter what their browser is set to. So the page now
 * auto-translates when, and only when, the country is BOTH known and not
 * Indonesia — see `autoTranslateTarget` for the three ways that resolves to
 * "do nothing", each of which lands back on this banner.
 *
 * The banner therefore still carries every case where the country is unknown
 * (header absent, lookup timed out, request blocked), which is also what a
 * geolocation outage degrades to: a working offer, never a blank page.
 *
 * Copy is in English because by definition nobody who sees this reads
 * Indonesian first. Once a translation is active, Google renders the rest of
 * the app — including this component's own strings — in the chosen language.
 */
export function TranslateHint() {
  const [dismissed, setDismissed] = useState(true);
  const [target, setTarget] = useState<TranslateTarget | null>(null);

  useEffect(() => {
    // Already translating → the offer is answered; never show it.
    if (activeTranslation()) return;
    // A reader who has already chosen is never re-asked and never
    // auto-translated — including out of the Indonesian they chose to keep.
    if (window.localStorage.getItem(LANG_CHOICE_KEY) === "1") return;
    // An Indonesian-locale browser reads the copy as authored, so no country
    // can make either branch below fire. Bail before the geo round-trip:
    // this component mounts in Providers on every page, and that request is
    // one the majority of this app's traffic would pay for nothing.
    if (navigator.language.toLowerCase().startsWith(SOURCE_LANG)) return;

    let cancelled = false;
    void visitorCountry().then((country) => {
      if (cancelled) return;
      const auto = autoTranslateTarget(country, navigator.language);
      // Auto-apply writes the googtrans cookie and RELOADS. With cookies
      // blocked the reload lands on the same untranslated page, re-decides
      // the same way, and reloads again — forever. The banner cannot loop
      // (a human has to press it), so a cookie-less browser keeps the offer.
      if (auto && navigator.cookieEnabled) {
        setTranslation(auto);
        return;
      }
      const t = targetForBrowserLang(navigator.language);
      if (!t) return;
      setTarget(t);
      setDismissed(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !target) return null;

  const targetLabel =
    TRANSLATE_TARGETS.find((t) => t.code === target)?.label ?? target;

  const dismiss = () => {
    window.localStorage.setItem(LANG_CHOICE_KEY, "1");
    setDismissed(true);
  };

  return (
    // Height matters more than it looks. This is `fixed` with nothing
    // reserving space for it, it fires for EVERY non-Indonesian browser, and at
    // full height (~200px on a 375px screen) it covered the hero's "Mulai
    // Gratis" / "Lihat Demo" row outright — the component built to rescue this
    // audience was occluding their conversion button. On phones it collapses to
    // heading + buttons (~90px); the body copy and the language picker are
    // desktop-only, and the hero's own English line covers anyone who never
    // reads this far. `--safe-bottom` because layout.tsx sets
    // viewportFit: "cover", so a flat pb-3 puts the card in the iPhone
    // home-indicator strip.
    // `translate-offer` is the hook index.css uses to lift this clear of the
    // mobile BottomNav, which shares its z-40 and was being covered outright.
    <div className="translate-offer fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl px-3 pb-[calc(0.75rem+var(--safe-bottom))] sm:bottom-3 sm:ml-auto sm:mr-0 sm:max-w-sm sm:pb-3">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/95 p-3 text-sm shadow-lg backdrop-blur">
        <Languages className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">This site is in Bahasa Indonesia</p>
          <p className="mt-0.5 hidden text-muted-foreground sm:block">
            Translate it with Google — the whole app, not just this page.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setTranslation(target)}>
              Translate to {targetLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Keep Indonesian
            </Button>
          </div>
          {/* Escape hatch for the browser-language guess being wrong — a
              Korean reader on an en-US laptop, say. */}
          <TranslatePicker
            className="mt-2 hidden max-w-[14rem] sm:block"
            label="Choose another language"
          />
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
