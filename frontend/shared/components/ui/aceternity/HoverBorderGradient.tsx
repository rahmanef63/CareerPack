/**
 * Hover Border Gradient — ported from Aceternity UI
 * https://ui.aceternity.com/components/hover-border-gradient
 *
 * Pil dengan cincin gradien yang berputar mengelilingi tepinya, menyala penuh
 * saat hover. Cocok untuk CTA sekunder atau badge di hero.
 *
 * Changed vs upstream:
 * - **Dep removed.** Upstream memakai `motion/react` plus `useState` +
 *   `setInterval` yang memutar empat radial-gradient (`TOP` → `LEFT` →
 *   `BOTTOM` → `RIGHT`) untuk mensimulasikan rotasi. Di sini satu
 *   `conic-gradient` diputar oleh utility `animate-spin` bawaan Tailwind —
 *   tanpa dependency, tanpa timer, dan tanpa state, sehingga komponen ini
 *   tetap Server Component (tidak ada `"use client"`).
 * - **Palette retokenised.** Highlight `#3275F8` dan `hsl(0,0%,100%)` diganti
 *   `oklch(var(--brand-from))` / `oklch(var(--brand-to))` untuk cincinnya;
 *   panel dalam yang upstream-nya hitam-pekat dengan teks putih sekarang
 *   memakai `bg-card` + `text-card-foreground`.
 * - **Reduced motion.** `motion-reduce:animate-none` — cincin berhenti sebagai
 *   gradien statis yang tetap terbaca sebagai border berwarna (bukan hilang
 *   atau setengah ter-render).
 * - **Default `as`.** Upstream default ke `"button"`; di sini default `"span"`
 *   yang netral secara semantik, karena komponen ini sering hanya membungkus
 *   `<Link>` atau `<button>` milik pemanggil.
 */
import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Kecepatan putar cincin. Ditulis sebagai properti arbitrary yang eksplisit —
 * bentuk singkat `duration-*` sudah dipakai `tailwindcss-animate`, jadi versi
 * arbitrary-nya ambigu dan tidak akan menghasilkan CSS apa pun.
 */
const SPIN_SPEED = {
  slow: "[animation-duration:4500ms]",
  normal: "[animation-duration:2800ms]",
  fast: "[animation-duration:1600ms]",
} as const;

export type HoverBorderGradientProps = React.PropsWithChildren<{
  /** Elemen/komponen pembungkus. Default `"span"`. */
  as?: React.ElementType;
  /** Kelas untuk pembungkus luar (yang memegang cincin). */
  containerClassName?: string;
  /** Kelas untuk panel dalam (yang memegang konten). */
  className?: string;
  /** Kecepatan putar cincin. Default `normal`. */
  speed?: keyof typeof SPIN_SPEED;
}> &
  Omit<React.AnchorHTMLAttributes<HTMLElement>, "type"> & {
    type?: "button" | "submit" | "reset";
  };

export function HoverBorderGradient({
  children,
  as: Tag = "span",
  containerClassName,
  className,
  speed = "normal",
  ...props
}: HoverBorderGradientProps) {
  return (
    <Tag
      {...props}
      className={cn(
        "group/hbg relative inline-flex w-fit items-center justify-center overflow-hidden rounded-full p-px",
        containerClassName,
      )}
    >
      {/* Kotak conic-gradient yang jauh lebih besar dari pil, diputar di
          tengahnya lalu dipotong oleh `overflow-hidden` milik pembungkus.
          `inset-[-1000%]` menjamin kotaknya tetap menutupi pil pada setiap
          sudut rotasi, sekalipun pilnya sangat lebar. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-[-1000%] animate-spin motion-reduce:animate-none",
          SPIN_SPEED[speed],
          "bg-[conic-gradient(from_0deg,transparent_0%,oklch(var(--brand-from))_18%,oklch(var(--brand-to))_30%,transparent_50%)]",
          "opacity-70 transition-opacity [transition-duration:300ms] group-hover/hbg:opacity-100",
        )}
      />
      <span
        className={cn(
          "relative z-10 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-card-foreground",
          "transition-colors [transition-duration:300ms] group-hover/hbg:bg-accent",
          className,
        )}
      >
        {children}
      </span>
    </Tag>
  );
}
