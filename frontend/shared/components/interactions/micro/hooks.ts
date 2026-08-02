"use client";

/** Pointer-driven helper hooks: tactile press feedback + drag-reorder. */

import { useCallback, useRef, useState } from "react";

export function useHapticPress() {
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = "scale(0.94)";
    el.style.transition = "transform 80ms ease-out";
    // Vibrate only when we have real touch + a fresh user activation.
    // Desktop Chrome no-ops vibrate anyway and logs an Intervention
    // warning if called before the first engagement — silent gating
    // here kills both the noise and the wasted call.
    if (e.pointerType !== "touch") return;
    const ua = (navigator as Navigator & { userActivation?: { isActive: boolean } })
      .userActivation;
    if (ua && !ua.isActive) return;
    try {
      navigator.vibrate?.(8);
    } catch {
      /* ignore */
    }
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = "";
  }, []);
  return { onPointerDown, onPointerUp, onPointerLeave: onPointerUp };
}

export function useDragReorder<T extends { id: string }>(
  items: T[],
  setItems: (next: T[]) => void
) {
  const draggingId = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const onDragStart = (id: string) => () => {
    draggingId.current = id;
    setActiveId(id);
  };
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingId.current || draggingId.current === id) return;
    const fromIdx = items.findIndex((i) => i.id === draggingId.current);
    const toIdx = items.findIndex((i) => i.id === id);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = items.slice();
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setItems(next);
  };
  const onDragEnd = () => {
    draggingId.current = null;
    setActiveId(null);
  };

  return { onDragStart, onDragOver, onDragEnd, activeId };
}
