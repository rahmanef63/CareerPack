"use client";

/** Visual-feedback primitives — pointer ripple, success tick, shimmer
 * skeleton, confetti burst, animated progress, typing dots. */

import {
  useEffect, useRef, useState,
  type CSSProperties,
} from "react";
import { cn } from "@/shared/lib/utils";

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

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md", className)} />;
}

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
