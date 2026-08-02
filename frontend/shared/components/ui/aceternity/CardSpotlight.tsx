"use client";

/**
 * Card Spotlight — ported from Aceternity UI
 * https://ui.aceternity.com/components/card-spotlight
 *
 * Kartu dengan pendar radial yang mengikuti kursor saat hover.
 *
 * Changed vs upstream:
 * - **Dep removed (motion).** Upstream memakai `useMotionValue` +
 *   `useMotionTemplate` dari `motion/react`. Di sini cukup `useState` dan satu
 *   handler `onMouseMove` yang menulis dua CSS custom property
 *   (`--cp-card-spot-x` / `--cp-card-spot-y`) — hasil visualnya sama, tanpa
 *   dependency dan tanpa animation loop.
 * - **Dep removed (three.js).** Upstream menumpuk `CanvasRevealEffect` di atas
 *   pendar; komponen itu menarik `three` + `@react-three/fiber`. Efek inti
 *   Card Spotlight adalah pendarnya sendiri, jadi lapisan canvas dibuang.
 * - **Palette retokenised.** Latar hitam pekat, border neutral gelap, dan
 *   warna pendar `#262626` milik upstream diganti `bg-card` / `border-border`
 *   / `oklch(var(--brand) / …)`.
 * - **Reduced motion.** Handler-nya benar-benar no-op saat pengguna minta
 *   kurangi gerak (dicek lewat `matchMedia`, jadi tidak ada re-render sama
 *   sekali), dan lapisan pendar disembunyikan lewat `motion-reduce:hidden`
 *   sebagai jaring pengaman sebelum hidrasi.
 * - **Keyboard.** Pendar juga muncul lewat `group-focus-within` di posisi
 *   tengah (nilai default custom property), sehingga pengguna keyboard yang
 *   men-tab ke tautan di dalam kartu mendapat umpan balik yang sama.
 *   Lapisan pendar `pointer-events-none` + `z-0`, konten `z-10` — fokus dan
 *   klik pada anak-anaknya tidak pernah terhalang.
 */
import * as React from "react";

import { cn } from "@/shared/lib/utils";

export type CardSpotlightProps = React.PropsWithChildren<{
  className?: string;
  /** Kelas tambahan untuk lapisan pendar (mis. mengganti warna/radius). */
  glowClassName?: string;
}> &
  Omit<React.HTMLAttributes<HTMLDivElement>, "onMouseMove">;

export function CardSpotlight({
  children,
  className,
  glowClassName,
  ...props
}: CardSpotlightProps) {
  const [spot, setSpot] = React.useState<{ x: string; y: string } | null>(null);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (reduced) return;
      const rect = event.currentTarget.getBoundingClientRect();
      setSpot({
        x: `${event.clientX - rect.left}px`,
        y: `${event.clientY - rect.top}px`,
      });
    },
    [reduced],
  );

  return (
    <div
      {...props}
      onMouseMove={handleMouseMove}
      className={cn(
        "group/spotlight relative isolate rounded-xl border border-border bg-card p-6 text-card-foreground",
        className,
      )}
    >
      <div
        aria-hidden="true"
        // Radius pendar dapat diatur pemanggil lewat `--cp-card-spot-r`.
        // Posisi default 50%/50% dipakai saat belum ada gerakan kursor —
        // itulah yang tampil pada state focus-within.
        style={
          spot
            ? ({
                "--cp-card-spot-x": spot.x,
                "--cp-card-spot-y": spot.y,
              } as React.CSSProperties)
            : undefined
        }
        className={cn(
          "pointer-events-none absolute -inset-px z-0 rounded-[inherit]",
          "bg-[radial-gradient(var(--cp-card-spot-r,320px)_circle_at_var(--cp-card-spot-x,50%)_var(--cp-card-spot-y,50%),oklch(var(--brand)_/_0.16),transparent_70%)]",
          "opacity-0 transition-opacity [transition-duration:300ms]",
          "group-hover/spotlight:opacity-100 group-focus-within/spotlight:opacity-100",
          "motion-reduce:hidden",
          glowClassName,
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
