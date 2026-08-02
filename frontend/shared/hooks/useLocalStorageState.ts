"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SSR-safe local-storage-backed React state.
 *
 * Hydrates from localStorage after mount (so the SSR shell is
 * deterministic — no hydration warnings). Falls back to `defaultValue`
 * if storage is empty, unparseable, or unavailable. Writes serialise
 * via JSON; failures are swallowed so quota errors don't crash the UI.
 *
 * Multi-tab sync via the `storage` event so two open tabs of the same
 * app stay in lockstep when one tab mutates demo data.
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T,
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const hydratedRef = useRef(false);

  // Hydrate on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore corrupt entry */
    }
    hydratedRef.current = true;
  }, [key]);

  // Cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) {
        setValue(defaultValue);
        return;
      }
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, defaultValue]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(key, JSON.stringify(v));
          } catch {
            /* quota exceeded — keep in-memory */
          }
        }
        return v;
      });
    },
    [key],
  );

  return [value, update] as const;
}
