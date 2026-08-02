"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Orchestrated first-visit reveal — wraps a block with a CSS-keyframe
 * slide-up + blur-in animation. Only fires ONCE per session (via
 * sessionStorage) so repeat navigations stay instant — no motion
 * repetition fatigue.
 *
 * Respects prefers-reduced-motion via Tailwind's `motion-safe:` prefix.
 *
 * Usage — stagger a set of blocks with incremental delay:
 *
 *   <Reveal delay={0}>{hero}</Reveal>
 *   <Reveal delay={80}>{kpi}</Reveal>
 *   <Reveal delay={160}>{chart}</Reveal>
 */
const SESSION_KEY = "careerpack_revealed_sections";

function sessionHas(key: string): boolean {
  if (typeof window === "undefined") return true; // SSR: skip animation
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    return raw.split(",").includes(key);
  } catch {
    return true;
  }
}

function markSession(key: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY) ?? "";
    const set = new Set(raw.split(",").filter(Boolean));
    set.add(key);
    window.sessionStorage.setItem(SESSION_KEY, Array.from(set).join(","));
  } catch {
    /* quota / private-mode — ignore, just skip marking. */
  }
}

export interface RevealProps {
  /** Unique key per revealed block; gates session de-duplication. */
  id?: string;
  /** ms delay before animation starts. */
  delay?: number;
  className?: string;
  children: ReactNode;
}

export function Reveal({
  id = "default",
  delay = 0,
  className,
  children,
}: RevealProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (sessionHas(id)) return;
    setShouldAnimate(true);
    markSession(id);
  }, [id]);

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn("motion-safe:animate-reveal-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
