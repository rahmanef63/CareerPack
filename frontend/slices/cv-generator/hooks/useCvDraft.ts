"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AutosaveStatus } from "./useAutosave";

/**
 * Crash-recovery buffer for the CV editor.
 *
 * Autosave already writes to Convex 2.5s after the last edit and flushes on
 * unmount, so this is NOT a second copy of the CV — it only ever holds edits
 * that never reached the server. It is written while the form is dirty and
 * **cleared the moment a save succeeds**, which is what stops it from
 * resurrecting a stale CV over a newer one: outside a crash there is nothing
 * stored to restore.
 *
 * Scoped per CV id so switching CVs cannot cross-contaminate, and per user is
 * unnecessary — the key is cleared on save and a different account loads a
 * different id.
 */
const PREFIX = "careerpack:cv-draft:";
/** Older than this and the draft is more likely to confuse than to help. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface Stored<T> {
  at: number;
  data: T;
}

/** Exported for the unit test — the guards here are the whole reason a stale
 *  or half-written draft cannot be offered back to the user. */
export function readDraft<T>(key: string): Stored<T> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored<T>;
    if (typeof parsed?.at !== "number" || parsed.data === undefined) return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    // Quota errors, private mode, a half-written value from a killed tab —
    // none of them are worth breaking the editor over.
    return null;
  }
}

export function useCvDraft<T>(args: {
  /** null while the editor has not settled on a CV yet — nothing is stored. */
  cvId: string | null;
  value: T;
  dirty: boolean;
  status: AutosaveStatus;
}) {
  const { cvId, value, dirty, status } = args;
  const key = cvId ? `${PREFIX}${cvId}` : null;

  // Read once per CV, before the first write can overwrite it. Lazy state
  // would re-read on every render; an effect would run after the write effect
  // below had already clobbered the stored value.
  const [recovered, setRecovered] = useState<T | null>(null);
  const probedKey = useRef<string | null>(null);
  if (key && probedKey.current !== key) {
    probedKey.current = key;
    // Render-phase read of localStorage: no state is set for the common
    // (nothing stored) case, so this does not loop.
    const found = typeof window === "undefined" ? null : readDraft<T>(key);
    if (found) setRecovered(found.data);
    else if (recovered !== null) setRecovered(null);
  }

  useEffect(() => {
    if (!key) return;
    try {
      if (dirty || status === "error") {
        const payload: Stored<T> = { at: Date.now(), data: value };
        window.localStorage.setItem(key, JSON.stringify(payload));
      } else if (status === "saved" || status === "idle") {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Full quota just means no crash recovery this session.
    }
  }, [key, value, dirty, status]);

  const dismiss = useCallback(() => {
    setRecovered(null);
    if (!key) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to clean up */
    }
  }, [key]);

  return { recovered, dismiss };
}
