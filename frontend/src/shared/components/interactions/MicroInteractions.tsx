"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/utils";

// ============================================================
// Ripple — wrap a button-like element. Captures pointer pos.
// ============================================================
export function Ripple({ color = "oklch(var(--brand) / 0.45)" }: { color?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const onPointerDown = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const span = document.createElement("span");
      span.className = "absolute pointer-events-none rounded-full animate-ripple";
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.background = color;
      ref.current?.appendChild(span);
      window.setTimeout(() => span.remove(), 600);
    };
    host.addEventListener("pointerdown", onPointerDown);
    return () => host.removeEventListener("pointerdown", onPointerDown);
  }, [color]);

  return (
    <span
      ref={ref}
      aria-hidden
      className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none"
    />
  );
}

// ============================================================
// SuccessCheck — SVG path that draws in
// ============================================================
export function SuccessCheck({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("text-success", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity={0.25} />
      <path className="animate-checkmark" d="M9 16 L14 21 L23 11" />
    </svg>
  );
}

// ============================================================
// Shimmer — skeleton block
// ============================================================
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

// ============================================================
// StaggerList — children appear with a cascading delay
// ============================================================
export function StaggerList({
  children,
  step = 50,
  className,
}: {
  children: ReactNode[];
  step?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <div
          key={i}
          className="animate-stagger-in"
          style={{ animationDelay: `${i * step}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Parallax — translates Y by scroll * factor
// ============================================================
export function Parallax({
  children,
  factor = 0.3,
  className,
}: {
  children: ReactNode;
  factor?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const offset = window.scrollY * factor;
      ref.current.style.transform = `translate3d(0, ${offset}px, 0)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}

// ============================================================
// LongPressMenu — wraps a child, opens a context menu on long-press
// ============================================================
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

// ============================================================
// MagneticTabs — pill indicator that slides between tabs
// ============================================================
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

// ============================================================
// SwipeToDelete — wraps an item; swipe-left reveals delete
// ============================================================
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

// ============================================================
// PullToRefresh — drag down past threshold to trigger
// ============================================================
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

// ============================================================
// ConfettiBurst — fires a one-shot burst from a point
// ============================================================
export function ConfettiBurst({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger) return;
    const host = ref.current;
    if (!host) return;
    // Read palette from CSS tokens so confetti follows theme.
    const root = getComputedStyle(document.documentElement);
    const hsl = (name: string) => `hsl(${root.getPropertyValue(name).trim()})`;
    const colors = [
      hsl("--brand-from"),
      hsl("--brand-to"),
      hsl("--warning"),
      hsl("--success"),
      hsl("--info"),
    ];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("span");
      const angle = (Math.PI * 2 * i) / 36;
      const dist = 80 + Math.random() * 140;
      piece.style.position = "absolute";
      piece.style.left = "50%";
      piece.style.top = "50%";
      piece.style.width = "8px";
      piece.style.height = "12px";
      piece.style.background = colors[i % colors.length];
      piece.style.borderRadius = "2px";
      piece.style.transform = "translate(-50%, -50%)";
      piece.style.setProperty("--cx", `${Math.cos(angle) * dist}px`);
      piece.style.setProperty("--cr", `${Math.random() * 720 - 360}deg`);
      piece.style.animation = "confetti-fall 900ms cubic-bezier(0.16,1,0.3,1) forwards";
      piece.style.animationDelay = `${Math.random() * 80}ms`;
      host.appendChild(piece);
      window.setTimeout(() => piece.remove(), 1100);
    }
  }, [trigger]);

  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" />;
}

// ============================================================
// AnimatedProgress — animated fill bar
// ============================================================
export function AnimatedProgress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setShown(value), 50);
    return () => window.clearTimeout(id);
  }, [value]);
  return (
    <div className={cn("h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full bg-gradient-to-r from-brand-from to-brand-to rounded-full",
          barClassName
        )}
        style={{ width: `${shown}%`, transition: "width 800ms cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}

// ============================================================
// TypingDots — three bouncing dots
// ============================================================
export function TypingDots({ className }: { className?: string }) {
  const dot: CSSProperties = { animation: "typing-dot 1.2s infinite" };
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="w-1.5 h-1.5 bg-brand rounded-full" style={{ ...dot, animationDelay: "0ms" }} />
      <span className="w-1.5 h-1.5 bg-brand rounded-full" style={{ ...dot, animationDelay: "150ms" }} />
      <span className="w-1.5 h-1.5 bg-brand rounded-full" style={{ ...dot, animationDelay: "300ms" }} />
    </div>
  );
}

// ============================================================
// useHapticPress — tiny visual press feedback (return ref/handlers)
// ============================================================
export function useHapticPress() {
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = "scale(0.94)";
    el.style.transition = "transform 80ms ease-out";
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate?.(8);
      } catch {
        /* ignore */
      }
    }
  }, []);
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.transform = "";
  }, []);
  return { onPointerDown, onPointerUp, onPointerLeave: onPointerUp };
}

// ============================================================
// useDragReorder — pointer-events drag handle for list items
// ============================================================
export function useDragReorder<T extends { id: string }>(
  items: T[],
  setItems: (next: T[]) => void
) {
  const draggingId = useRef<string | null>(null);

  const onDragStart = (id: string) => () => {
    draggingId.current = id;
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
  };

  return { onDragStart, onDragOver, onDragEnd };
}
