"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";

import {
  activeTranslation,
  setTranslation,
  SOURCE_LANG,
  TRANSLATE_TARGETS,
  type TranslateTarget,
} from "@/shared/lib/googleTranslate";
import { cn } from "@/shared/lib/utils";

const SCRIPT_ID = "google-translate-script";
const HOST_ID = "google_translate_element";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          opts: { pageLanguage: string; autoDisplay: boolean },
          hostId: string,
        ) => unknown;
      };
    };
  }
}

/**
 * Loads Google's translate script — but ONLY when a translation is already
 * active. Nothing to translate means nothing to download, so the Indonesian
 * majority never pays for this. {@link setTranslation} writes the cookie and
 * reloads, and it is that next load which pulls the script in.
 *
 * Mounted once, globally (Providers). The hidden host div exists because the
 * constructor requires an element to attach its own (unused) <select> to.
 */
export function GoogleTranslate() {
  useEffect(() => {
    if (!activeTranslation()) return;
    if (document.getElementById(SCRIPT_ID)) return;

    // The `cb` query param names a GLOBAL function, so this has to live on
    // window rather than in closure scope.
    window.googleTranslateElementInit = () => {
      const ctor = window.google?.translate?.TranslateElement;
      if (!ctor) return;
      // autoDisplay:false suppresses Google's own "Translate this page?"
      // prompt — the cookie already says yes, and the prompt would be a
      // second, uglier banner over ours.
      new ctor({ pageLanguage: SOURCE_LANG, autoDisplay: false }, HOST_ID);
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Positioned off-screen rather than `hidden`: the widget has to be able to
  // lay itself out to finish initialising, and a `display: none` host has been
  // reported to leave it half-built. `inert` is what makes that safe — it drops
  // Google's injected <select> out of both the tab order and the accessibility
  // tree, so parking a real control off-screen doesn't create an invisible tab
  // stop. (Our own picker is the control; this host exists only because the
  // constructor demands an element.)
  //
  // No cleanup on unmount: tearing the host out from under an initialised
  // widget is what produces Google's "removeChild on a node that is not a
  // child" console noise. It only ever unmounts with the page.
  return (
    <div
      id={HOST_ID}
      inert
      className="pointer-events-none absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
    />
  );
}

interface TranslatePickerProps {
  className?: string;
  /** Rendered as the select's accessible name. */
  label?: string;
}

/**
 * Language picker. A native <select> on purpose — 13 options in a custom
 * popover is worse than the one the platform already ships with keyboard
 * support, type-ahead, and a mobile-native sheet.
 *
 * `translate="no"` matters here: without it Google would translate the
 * language names themselves, so a Japanese reader would see "Japanese"
 * rendered in Japanese for every option and lose the ability to navigate back.
 */
export function TranslatePicker({ className, label = "Bahasa halaman" }: TranslatePickerProps) {
  // Read the cookie after mount, not during render — the server has no
  // document, and guessing would flash the wrong selection.
  const [current, setCurrent] = useState("");
  useEffect(() => setCurrent(activeTranslation() ?? ""), []);

  return (
    <div className={cn("relative", className)} translate="no">
      <Languages
        aria-hidden
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <select
        aria-label={label}
        value={current}
        onChange={(e) => {
          const next = e.target.value;
          setCurrent(next);
          setTranslation(next ? (next as TranslateTarget) : null);
        }}
        className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Bahasa Indonesia</option>
        {TRANSLATE_TARGETS.map((t) => (
          <option key={t.code} value={t.code}>
            {t.label}
          </option>
        ))}
      </select>
      {/* Native arrow is hidden by appearance-none so the control can match
          the app's inputs; this replaces it. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
      >
        ▾
      </span>
    </div>
  );
}
