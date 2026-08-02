"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import {
  isPullToRefreshLocked,
  subscribePullToRefreshLock,
} from "@/shared/lib/ptrLock";

interface PullToRefreshProps {
  children: ReactNode;
  /** Override the refresh action — default is `window.location.reload()`. */
  onRefresh?: () => void | Promise<void>;
}

/**
 * Auto-detect open overlays where PTR must NOT fire. Covers all our
 * shadcn primitives + vaul drawer + AI agent Sheet without each one
 * needing to opt in.
 *
 * - Radix Dialog/Sheet/AlertDialog: render content with
 *   `role="dialog"` and `data-state="open"` while open.
 * - vaul Drawer (used by ResponsiveDialog mobile mode): adds
 *   `data-vaul-drawer-direction` to its content.
 *
 * Using `:is(...)` keeps the selector to one query call.
 */
function hasOpenOverlay(): boolean {
  return Boolean(
    document.querySelector(
      '[role="dialog"][data-state="open"], [data-vaul-drawer-direction], [data-radix-dialog-overlay]',
    ),
  );
}

/** True if the touch originated inside any modal/drawer subtree —
 *  even if the open-overlay detector misses (e.g. custom popups
 *  using role="dialog" without data-state). */
function isInsideOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[role="dialog"], [data-vaul-drawer-direction]'),
  );
}

/** How many pixels user drags before refresh activates. */
const ACTIVATE_PX = 70;
/** Soft cap on visual pull distance for resistance feel. */
const MAX_PULL_PX = 120;
/** Resistance ratio — user drags 2× for every 1px of pull. */
const RESISTANCE = 0.5;

/**
 * Native HTML5 pull-to-refresh. Listens to touch events on the
 * document, only activates when window scrollTop is 0 and the user
 * drags down. Uses `passive: false` on touchmove so we can prevent
 * the browser's own bounce while ours is active.
 *
 * Mounts the indicator in a fixed container at the top of the
 * viewport — does NOT translate page content, which avoids scroll
 * jank with the rest of the app's flex/sticky layouts.
 */
export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    /** Reset the gesture if the lock store flips on mid-drag —
     *  e.g. user opens a drawer programmatically while pulling. */
    const onLockChange = () => {
      if (isPullToRefreshLocked() && active.current) {
        active.current = false;
        setPullY(0);
      }
    };
    const unsubLock = subscribePullToRefreshLock(onLockChange);

    const shouldAbort = (target: EventTarget | null): boolean => {
      if (isPullToRefreshLocked()) return true;
      if (hasOpenOverlay()) return true;
      if (isInsideOverlay(target)) return true;
      return false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (shouldAbort(e.target)) {
        active.current = false;
        return;
      }
      // Only initiate when at the very top of the document.
      if (window.scrollY > 0 || document.documentElement.scrollTop > 0) {
        active.current = false;
        return;
      }
      // Ignore multi-touch (pinch).
      if (e.touches.length !== 1) {
        active.current = false;
        return;
      }
      active.current = true;
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || refreshing) return;
      // Re-check abort each frame — modal might have opened after touchstart.
      if (shouldAbort(e.target)) {
        active.current = false;
        setPullY(0);
        return;
      }
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        // User scrolled up — abort.
        active.current = false;
        setPullY(0);
        return;
      }
      // We're committed to PTR. Block native bounce/refresh.
      if (e.cancelable) e.preventDefault();
      setPullY(Math.min(delta * RESISTANCE, MAX_PULL_PX));
    };

    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const triggered = pullY >= ACTIVATE_PX;
      if (!triggered) {
        setPullY(0);
        return;
      }
      setRefreshing(true);
      setPullY(ACTIVATE_PX);
      try {
        if (onRefresh) {
          await onRefresh();
          // If the handler doesn't replace the page, snap the indicator back.
          setRefreshing(false);
          setPullY(0);
        } else {
          // Default: full reload after a tick so the indicator paints.
          setTimeout(() => window.location.reload(), 120);
        }
      } catch {
        setRefreshing(false);
        setPullY(0);
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
      unsubLock();
    };
  }, [pullY, refreshing, onRefresh]);

  const armed = pullY >= ACTIVATE_PX;
  const progress = Math.min(pullY / ACTIVATE_PX, 1);

  return (
    <>
      <div
        aria-hidden={pullY === 0}
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[60] flex items-center justify-center transition-opacity",
          pullY > 0 ? "opacity-100" : "opacity-0",
        )}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 4px)",
          transform: `translateY(${Math.max(0, pullY - 36)}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur",
            armed && !refreshing && "border-brand text-brand",
          )}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Memuat ulang…</span>
            </>
          ) : armed ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Lepas untuk refresh</span>
            </>
          ) : (
            <>
              <RefreshCw
                className="h-3.5 w-3.5 transition-transform"
                style={{ transform: `rotate(${progress * 270}deg)` }}
              />
              <span>Tarik ke bawah</span>
            </>
          )}
        </div>
      </div>
      {children}
    </>
  );
}
