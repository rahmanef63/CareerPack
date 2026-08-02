/**
 * Dot Background — ported from Aceternity UI
 * https://ui.aceternity.com/components/grid-and-dot-backgrounds
 *
 * Varian titik dari latar Aceternity: satu radial-gradient yang di-tile.
 * Nol JavaScript.
 *
 * Changed vs upstream: sama persis dengan {@link GridBackground} —
 * - **Palette retokenised.** `#d4d4d4` / `dark:#404040` diganti
 *   `currentColor` + `dotClassName` (default `text-border`), jadi titiknya
 *   ikut preset tema tanpa varian `dark:` terpisah.
 * - **Fade tanpa pelat solid**, mask dipasang langsung ke lapisan titik
 *   supaya latar di belakangnya tetap tembus.
 * - **Layer, bukan wrapper** — di-drop ke parent ber-`relative`.
 *
 * Server Component — tanpa state, tanpa "use client".
 *
 * @example
 * <section className="relative isolate">
 *   <DotBackground />
 *   <div className="relative">…</div>
 * </section>
 */
import { cn } from "@/shared/lib/utils";

/** Jarak antar titik. Nilai statis supaya terbaca oleh scanner Tailwind. */
const DOT_SIZE = {
  sm: "[background-size:16px_16px]",
  md: "[background-size:20px_20px]",
  lg: "[background-size:32px_32px]",
} as const;

export type DotBackgroundProps = {
  className?: string;
  /** Kerapatan titik. Default `md` (20px). */
  size?: keyof typeof DOT_SIZE;
  /** Token warna titik sebagai kelas Tailwind. Default `text-border`. */
  dotClassName?: string;
  /** Pudarkan tepi pola dengan mask radial. Default `true`. */
  fade?: boolean;
};

export function DotBackground({
  className,
  size = "md",
  dotClassName = "text-border",
  fade = true,
}: DotBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        DOT_SIZE[size],
        "[background-image:radial-gradient(currentColor_1px,transparent_1px)]",
        fade &&
          "[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]",
        dotClassName,
        className,
      )}
    />
  );
}
