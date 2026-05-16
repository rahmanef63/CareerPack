"use client";

import { useEffect, useState } from "react";
import { Languages, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useLocale } from "@/shared/hooks/useLocale";

const DISMISS_KEY = "careerpack:translate-hint-dismissed";

/**
 * One-time banner shown to users whose browser locale isn't
 * Indonesian. Tells them the app's content is in Bahasa Indonesia
 * and points to the browser's built-in page translation.
 *
 * Auto-translate is the dynamic-as-possible i18n strategy — the
 * banner exists only because a non-id user might not realise their
 * browser CAN translate without us shipping a message catalog.
 *
 * Dismissed → never shown again on this device. Switching the
 * settings UI to "en" also implicitly dismisses it.
 */
export function TranslateHint() {
  const { browserNonId, locale, setLocale } = useLocale();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setDismissed(false);
  }, []);

  // Only show: non-id browser AND user is still on the id default
  // AND they haven't dismissed before.
  if (dismissed) return null;
  if (!browserNonId) return null;
  if (locale !== "id") return null;

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
  };

  const switchToEn = () => {
    setLocale("en");
    dismiss();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl px-3 pb-3 sm:bottom-3">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card/95 p-3 text-sm shadow-lg backdrop-blur">
        <Languages className="mt-0.5 size-4 shrink-0 text-career-600" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">App is in Bahasa Indonesia</p>
          <p className="mt-0.5 text-muted-foreground">
            Use your browser&apos;s page-translate (right-click → Translate, or
            the address-bar icon) for English. Or switch dates &amp; numbers
            to en-US below.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="default" onClick={switchToEn}>
              Switch to en-US formats
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Got it
            </Button>
          </div>
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
