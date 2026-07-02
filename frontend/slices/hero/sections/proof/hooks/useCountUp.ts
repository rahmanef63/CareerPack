"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up animation triggered once the attached element scrolls into view.
 * Same IntersectionObserver idiom as `@/slices/hero/hooks/useScrollReveal`,
 * but drives a numeric `value` from 0 to `target` via requestAnimationFrame
 * instead of toggling a CSS class. Fires once — the observer disconnects
 * after the first trigger, so re-entering the viewport does not restart it.
 * Respects `prefers-reduced-motion`: jumps straight to `target` on trigger
 * instead of running the rAF loop.
 */
export function useCountUp<T extends HTMLElement = HTMLDivElement>(target: number, durationMs = 900) {
  const ref = useRef<T>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          if (prefersReducedMotion) {
            setValue(target);
          } else {
            const startTime = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - startTime) / durationMs, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setValue(target * eased);
              if (progress < 1) {
                requestAnimationFrame(tick);
              }
            };
            requestAnimationFrame(tick);
          }

          observer.disconnect();
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [target, durationMs]);

  return { ref, value };
}
