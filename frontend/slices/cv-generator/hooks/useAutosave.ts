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
  // Holds the latest queued write so a still-pending debounce can be
  // flushed (not just cancelled) on unmount / client-side navigation —
  // otherwise edits made inside the debounce window are silently lost.
  const pendingRef = useRef<{ value: T; signature: string } | null>(null);
  // Always-latest `save` so the stable `runSave`/`flush` callbacks never
  // pin a stale mutation closure from the first render.
  const saveRef = useRef(save);
  saveRef.current = save;

  const signature = JSON.stringify(value);
  const dirty =
    lastSavedSigRef.current !== null && signature !== lastSavedSigRef.current;

  // Fire the queued write immediately and mark its signature as saved.
  // Stable across renders (reads `save` via ref) so the unmount effect
  // and `flush` can depend on it without re-arming the debounce.
  const runSave = useCallback((next: T, nextSig: string) => {
    void (async () => {
      setStatus("saving");
      try {
        await saveRef.current(next);
        lastSavedSigRef.current = nextSig;
        setLastSavedAt(Date.now());
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  useEffect(() => {
    if (disabled) return;
    if (!baselineSetRef.current) {
      lastSavedSigRef.current = signature;
      baselineSetRef.current = true;
      return;
    }
    if (signature === lastSavedSigRef.current) return;
    setStatus("dirty");
    pendingRef.current = { value, signature };
    const handle = window.setTimeout(() => {
      pendingRef.current = null;
      runSave(value, signature);
    }, debounceMs);
    return () => window.clearTimeout(handle);
    // `save` is captured by ref-like closure each render; depending on
    // `signature` is enough — re-firing on `save` identity would reset
    // the timer on every parent re-render and break the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, debounceMs, disabled, runSave]);

  /** Force the queued write out NOW (if any) and clear it. Idempotent —
   *  a no-op when nothing is pending, so it never double-writes. */
  const flush = useCallback(() => {
    const queued = pendingRef.current;
    if (!queued) return;
    pendingRef.current = null;
    runSave(queued.value, queued.signature);
  }, [runSave]);

  // Mount-only: flush whatever is still queued when the component
  // unmounts (route change / console close). Depends only on the stable
  // `flush` so it never re-runs mid-edit and never drops the timer.
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  /** Force a baseline reset — call after a hard reload (CV swap) so the
   *  next user-edit becomes the first dirty signal again. Stable across
   *  renders so callers can include it in effect deps safely. */
  const resetBaseline = useCallback((next: T) => {
    // Drop any write queued against the previous document so swapping
    // CVs can't flush stale data into the freshly-loaded one.
    pendingRef.current = null;
    lastSavedSigRef.current = JSON.stringify(next);
    baselineSetRef.current = true;
    setStatus("idle");
  }, []);

  return { status, dirty, lastSavedAt, resetBaseline, flush };
}
