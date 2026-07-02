"use client";

import { useEffect, useRef } from "react";

/**
 * Staggered scroll-reveal for landing sections: elements starting with
 * `.animate-on-scroll opacity-0` inside the returned ref fade/slide in via
 * `.animate-slide-up` once they cross the viewport threshold. Shared across
 * every landing section so the IntersectionObserver wiring lives in one
 * place instead of being copy-pasted per section.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-slide-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = ref.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}
