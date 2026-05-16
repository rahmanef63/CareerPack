"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SaveFn<T> = (value: T) => Promise<void>;

export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface UseAutosaveOpts {
  /** Debounce window before triggering the save. Default 2500ms. */
  debounceMs?: number;
  /** Disable autosave entirely (e.g. while initial data is hydrating). */
  disabled?: boolean;
}

/**
 * Watches a serializable value, signs it via JSON.stringify, and calls
 * `save` after the debounce window when the signature changes. Status
 * surfaces back to the UI for a "Tersimpan otomatis · 2 menit lalu"
 * indicator without each caller wiring its own timer.
 *
 * The first observed value is treated as the baseline — autosave only
 * fires AFTER the user starts editing, so the initial hydration never
 * triggers a no-op round-trip.
 *
 * `dirty` flips on whenever the current signature differs from the
 * last-saved signature, even mid-debounce. That's what the dirty badge
 * and the `beforeunload` guard hook into.
 */
export function useAutosave<T>(
  value: T,
  save: SaveFn<T>,
  opts: UseAutosaveOpts = {},
) {
  const { debounceMs = 2500, disabled = false } = opts;
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const lastSavedSigRef = useRef<string | null>(null);
  const baselineSetRef = useRef(false);

  const signature = JSON.stringify(value);
  const dirty =
    lastSavedSigRef.current !== null && signature !== lastSavedSigRef.current;

  useEffect(() => {
    if (disabled) return;
    if (!baselineSetRef.current) {
      lastSavedSigRef.current = signature;
      baselineSetRef.current = true;
      return;
    }
    if (signature === lastSavedSigRef.current) return;
    setStatus("dirty");
    const handle = window.setTimeout(() => {
      void (async () => {
        setStatus("saving");
        try {
          await save(value);
          lastSavedSigRef.current = signature;
          setLastSavedAt(Date.now());
          setStatus("saved");
        } catch {
          setStatus("error");
        }
      })();
    }, debounceMs);
    return () => window.clearTimeout(handle);
    // `save` is captured by ref-like closure each render; depending on
    // `signature` is enough — re-firing on `save` identity would reset
    // the timer on every parent re-render and break the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, debounceMs, disabled]);

  /** Force a baseline reset — call after a hard reload (CV swap) so the
   *  next user-edit becomes the first dirty signal again. Stable across
   *  renders so callers can include it in effect deps safely. */
  const resetBaseline = useCallback((next: T) => {
    lastSavedSigRef.current = JSON.stringify(next);
    baselineSetRef.current = true;
    setStatus("idle");
  }, []);

  return { status, dirty, lastSavedAt, resetBaseline };
}
