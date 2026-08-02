"use client";

/** Scroll/cascade primitives — staggered list reveal + scroll-driven
 * parallax wrapper. */

import { useEffect, useRef, type ReactNode } from "react";

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
