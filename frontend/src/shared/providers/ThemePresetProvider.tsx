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
import {
  DEFAULT_PRESET_NAME,
  applyPreset,
  bootPreset,
  getSavedPreset,
  loadRegistry,
  previewPreset,
  restoreSavedPreset,
  type ThemeRegistry,
} from "@/shared/lib/themePresets";

/**
 * Thin provider that boots the preset on first mount and exposes the
 * current name + a `setPreset` commit handler. All heavy lifting (style
 * tag injection, preview, restore, transition pulse) lives in
 * `shared/lib/themePresets.ts`.
 */

interface ThemePresetContextValue {
  presetName: string;
  registry: ThemeRegistry | null;
  setPreset: (name: string) => void;
  preview: (name: string | null) => void;
  restore: () => void;
  isReady: boolean;
}

const ThemePresetContext = createContext<ThemePresetContextValue>({
  presetName: DEFAULT_PRESET_NAME,
  registry: null,
  setPreset: () => {},
  preview: () => {},
  restore: () => {},
  isReady: false,
});

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const [registry, setRegistry] = useState<ThemeRegistry | null>(null);
  const [presetName, setPresetName] = useState<string>(DEFAULT_PRESET_NAME);
  const [isReady, setIsReady] = useState(false);

  // Boot: read localStorage + apply persisted preset on first client render.
  useEffect(() => {
    const saved = getSavedPreset();
    if (saved) setPresetName(saved);
    void bootPreset()
      .catch(() => {
        // Fail open — base theme stays.
      })
      .finally(() => setIsReady(true));
  }, []);

  // Load registry once for the switcher UI.
  useEffect(() => {
    let cancelled = false;
    loadRegistry()
      .then((r) => {
        if (!cancelled) setRegistry(r);
      })
      .catch(() => {
        // Ignore; switcher will render empty if unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreset = useCallback((name: string) => {
    setPresetName(name);
    void applyPreset(name);
  }, []);

  const preview = useCallback((name: string | null) => {
    void previewPreset(name);
  }, []);

  const restore = useCallback(() => {
    void restoreSavedPreset();
  }, []);

  const value = useMemo<ThemePresetContextValue>(
    () => ({ presetName, registry, setPreset, preview, restore, isReady }),
    [presetName, registry, setPreset, preview, restore, isReady],
  );

  return (
    <ThemePresetContext.Provider value={value}>
      {children}
    </ThemePresetContext.Provider>
  );
}

export function useThemePreset(): ThemePresetContextValue {
  return useContext(ThemePresetContext);
}

export { DEFAULT_PRESET_NAME };
export type { ThemeRegistry };
