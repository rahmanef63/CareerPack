"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AIButtonStyle = "solid" | "gradient" | "glow";
export type FontScale = "compact" | "normal" | "large";
export type NavStyle = "flat" | "floating" | "notched";

export interface UIPrefs {
  aiButtonStyle: AIButtonStyle;
  fontScale: FontScale;
  navStyle: NavStyle;
}

const DEFAULTS: UIPrefs = {
  aiButtonStyle: "gradient",
  // Compact font + flat nav are the more conservative defaults — feels
  // closer to native mobile apps and reduces visual weight on small
  // screens. Power users still pick Normal/Large + Floating/Notched.
  fontScale: "compact",
  navStyle: "flat",
};

const STORAGE_KEY = "careerpack_ui_prefs";

interface Ctx extends UIPrefs {
  setAIButtonStyle: (v: AIButtonStyle) => void;
  setFontScale: (v: FontScale) => void;
  setNavStyle: (v: NavStyle) => void;
  reset: () => void;
}

const UIPrefsContext = createContext<Ctx | undefined>(undefined);

const FONT_SCALE_VALUE: Record<FontScale, string> = {
  compact: "0.92",
  normal: "1",
  large: "1.1",
};

function applyToRoot(prefs: UIPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--font-scale", FONT_SCALE_VALUE[prefs.fontScale]);
  root.dataset.aiBtn = prefs.aiButtonStyle;
  root.dataset.navStyle = prefs.navStyle;
}

export function UIPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UIPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...JSON.parse(raw) } as UIPrefs;
        setPrefs(parsed);
        applyToRoot(parsed);
        return;
      }
    } catch {
      /* ignore */
    }
    applyToRoot(DEFAULTS);
  }, []);

  const update = (patch: Partial<UIPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      applyToRoot(next);
      return next;
    });
  };

  const value: Ctx = {
    ...prefs,
    setAIButtonStyle: (v) => update({ aiButtonStyle: v }),
    setFontScale: (v) => update({ fontScale: v }),
    setNavStyle: (v) => update({ navStyle: v }),
    reset: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setPrefs(DEFAULTS);
      applyToRoot(DEFAULTS);
    },
  };

  return <UIPrefsContext.Provider value={value}>{children}</UIPrefsContext.Provider>;
}

export function useUIPrefs(): Ctx {
  const ctx = useContext(UIPrefsContext);
  if (!ctx) throw new Error("useUIPrefs must be used within UIPrefsProvider");
  return ctx;
}
