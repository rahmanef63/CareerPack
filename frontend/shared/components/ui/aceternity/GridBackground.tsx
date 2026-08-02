/**
 * Grid Background — ported from Aceternity UI
 * https://ui.aceternity.com/components/grid-and-dot-backgrounds
 *
 * Lapisan garis grid halus untuk latar section. Nol JavaScript — murni
 * `background-image` bertumpuk dua linear-gradient.
 *
 * Changed vs upstream:
 * - **Palette retokenised.** Upstream mengunci warna garis ke `#e4e4e7` dan
 *   `dark:#262626`. Di sini garis memakai `currentColor` dan warnanya datang
 *   dari `lineClassName` (default `text-border`), jadi grid mengikuti preset
 *   tema — satu kelas, tanpa varian `dark:` terpisah.
 * - **Fade tanpa pelat solid.** Upstream menumpuk satu div berlatar putih
 *   (hitam di mode gelap) ber-mask di atas grid; itu mengandaikan latar
 *   halaman selalu putih atau hitam murni dan
 *   bocor di preset berwarna. Di sini mask dipasang langsung ke lapisan grid,
 *   jadi apa pun latar di belakangnya tetap tembus.
 * - **Layer, bukan wrapper.** Upstream adalah demo setinggi `h-[50rem]` yang
 *   membungkus konten. Komponen ini hanya lapisan absolut yang di-drop ke
 *   dalam parent ber-`relative`, jadi tidak ikut mengatur layout.
 *
 * Server Component — tanpa state, tanpa "use client".
 *
 * @example
 * <section className="relative isolate">
 *   <GridBackground />
 *   <div className="relative">…</div>
 * </section>
 */
import { cn } from "@/shared/lib/utils";

/** Jarak antar garis. Nilai statis supaya terbaca oleh scanner Tailwind. */
const CELL_SIZE = {
  sm: "[background-size:24px_24px]",
  md: "[background-size:40px_40px]",
  lg: "[background-size:64px_64px]",
} as const;

export type GridBackgroundProps = {
  className?: string;
  /** Kerapatan grid. Default `md` (40px). */
  size?: keyof typeof CELL_SIZE;
  /** Token warna garis sebagai kelas Tailwind. Default `text-border`. */
  lineClassName?: string;
  /** Pudarkan tepi grid dengan mask radial. Default `true`. */
  fade?: boolean;
};

export function GridBackground({
  className,
  size = "md",
  lineClassName = "text-border",
  fade = true,
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0",
        CELL_SIZE[size],
        "[background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)]",
        fade &&
          "[mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_72%)]",
        lineClassName,
        className,
      )}
    />
  );
}
