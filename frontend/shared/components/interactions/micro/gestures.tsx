"use client";

/** Touch-gesture primitives — long-press menu, swipe-to-delete row,
 * pull-to-refresh wrapper, magnetic pill tabs. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export function LongPressMenu({
  children,
  items,
  delay = 450,
}: {
  children: ReactNode;
  items: Array<{ label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean }>;
  delay?: number;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const start = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    timer.current = window.setTimeout(() => {
      if (startPos.current) setPos(startPos.current);
    }, delay);
  };
  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <>
      <div onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}>
        {children}
      </div>
      {pos && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setPos(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setPos(null);
          }}
        >
          <div
            className="absolute min-w-[180px] rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl py-1 animate-stagger-in"
            style={{ left: Math.min(pos.x, window.innerWidth - 200), top: Math.min(pos.y, window.innerHeight - 200) }}
          >
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => {
                  it.onSelect();
                  setPos(null);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left",
                  it.danger && "text-destructive hover:bg-destructive/10"
                )}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export function MagneticTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: Array<{ id: T; label: string; icon?: ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const idx = tabs.findIndex((t) => t.id === value);
    const btn = container.querySelectorAll<HTMLButtonElement>("[data-tab]")[idx];
    if (btn) {
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    }
  }, [value, tabs]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex bg-muted rounded-full p-1",
        className
      )}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-background shadow-sm transition-all duration-300 ease-out"
        style={{ left: indicator.left, width: indicator.width }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          data-tab
          onClick={() => onChange(t.id)}
          className={cn(
            "relative z-10 px-4 py-1.5 text-sm font-medium rounded-full flex items-center gap-1.5 transition-colors",
            value === t.id ? "text-brand" : "text-muted-foreground"
          )}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function SwipeToDelete({
  children,
  onDelete,
  threshold = 96,
  className,
}: {
  children: ReactNode;
  onDelete: () => void;
  threshold?: number;
  className?: string;
}) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);

  const onDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current === null) return;
    const delta = Math.min(0, e.clientX - startX.current);
    setDx(Math.max(delta, -threshold * 1.6));
  };
  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (Math.abs(dx) >= threshold) {
      setDx(-window.innerWidth);
      window.setTimeout(onDelete, 200);
    } else {
      setDx(0);
    }
    startX.current = null;
  };

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive text-destructive-foreground text-sm font-semibold">
        Hapus
      </div>
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ transform: `translateX(${dx}px)`, transition: dragging.current ? "none" : "transform 200ms ease-out" }}
        className="bg-card touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 70,
}: {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPull(Math.min(delta * 0.5, threshold * 1.4));
    }
  };
  const onTouchEnd = async () => {
    startY.current = null;
    if (pull >= threshold) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        aria-hidden
        className="flex justify-center items-end overflow-hidden text-brand"
        style={{ height: pull, transition: refreshing ? "none" : "height 200ms ease-out" }}
      >
        <div
          className={cn(
            "w-6 h-6 mb-2 rounded-full border-2 border-brand border-t-transparent",
            refreshing && "animate-spin"
          )}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}
