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
import { useTheme } from "next-themes";
import {
  DEFAULT_PRESET_NAME,
  applyPreset,
  clearInlinePreset,
  findPreset,
  loadRegistry,
  type ThemePresetItem,
  type ThemeRegistry,
} from "@/shared/lib/themePresets";

const STORAGE_KEY = "careerpack:theme-preset";

interface ThemePresetContextValue {
  presetName: string;
  registry: ThemeRegistry | null;
  setPreset: (name: string) => void;
  isReady: boolean;
}

const ThemePresetContext = createContext<ThemePresetContextValue>({
  presetName: DEFAULT_PRESET_NAME,
  registry: null,
  setPreset: () => {},
  isReady: false,
});

function readStoredPreset(): string {
  if (typeof window === "undefined") return DEFAULT_PRESET_NAME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
  return DEFAULT_PRESET_NAME;
}

function resolvedMode(resolved: string | undefined): "light" | "dark" {
  return resolved === "dark" ? "dark" : "light";
}

export function ThemePresetProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedMode(resolvedTheme);
  const [registry, setRegistry] = useState<ThemeRegistry | null>(null);
  const [presetName, setPresetName] = useState<string>(DEFAULT_PRESET_NAME);
  const [isReady, setIsReady] = useState(false);

  // Hydrate from storage after mount to avoid SSR mismatch.
  useEffect(() => {
    setPresetName(readStoredPreset());
  }, []);

  // Load registry once.
  useEffect(() => {
    let cancelled = false;
    loadRegistry()
      .then((r) => {
        if (!cancelled) setRegistry(r);
      })
      .catch(() => {
        if (!cancelled) setIsReady(true); // fail open, base theme stays
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply preset on mode or name change.
  useEffect(() => {
    if (!registry) return;
    const preset = findPreset(registry, presetName);
    if (!preset) {
      clearInlinePreset();
      setIsReady(true);
      return;
    }
    applyPreset(preset, mode);
    setIsReady(true);
  }, [registry, presetName, mode]);

  const setPreset = useCallback((name: string) => {
    setPresetName(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Ignore.
    }
  }, []);

  const value = useMemo<ThemePresetContextValue>(
    () => ({ presetName, registry, setPreset, isReady }),
    [presetName, registry, setPreset, isReady],
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
export type { ThemePresetItem };
