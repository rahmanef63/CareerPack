/**
 * Pull-to-refresh lock store. Counter-based — multiple overlays can
 * lock concurrently and PTR resumes only when the count returns to 0.
 *
 * Why a counter, not a boolean: nested modals (e.g. confirm dialog
 * over a drawer) both call `lockPullToRefresh` and both must release
 * before PTR is re-enabled. A boolean would let the inner close
 * unlock while the outer is still open.
 *
 * Most Radix/vaul overlays are auto-detected by `PullToRefresh` via
 * DOM querying — this lock store is the manual escape hatch for
 * custom non-Radix panels (e.g. CommandPalette, future bottom-sheets
 * built outside the shadcn primitives).
 */

let lockCount = 0;
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

/** Acquire a PTR lock. Returns a release function — call it on
 *  unmount or when the overlay closes. Idempotent: stale double
 *  releases are no-ops because the returned function captures the
 *  acquisition. */
export function lockPullToRefresh(): () => void {
  lockCount++;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    notify();
  };
}

/** Read current lock state. PTR consults this on every touchstart. */
export function isPullToRefreshLocked(): boolean {
  return lockCount > 0;
}

/** Subscribe for lock-state changes. Used by PTR when it needs to
 *  abort an in-progress pull because a modal opened mid-drag. */
export function subscribePullToRefreshLock(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
