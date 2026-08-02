/**
 * Meteors — ported from Aceternity UI
 * https://ui.aceternity.com/components/meteors
 *
 * Hujan meteor dekoratif: titik kecil dengan ekor gradien yang meluncur
 * diagonal melintasi container. Murni CSS.
 *
 * Changed vs upstream:
 * - **Dep removed.** Upstream membungkus semuanya dalam `motion.div` hanya
 *   untuk fade-in sekali jalan. Dibuang — tidak ada yang hilang secara visual.
 * - **Hydration fix.** Upstream mengacak `animationDelay` dan
 *   `animationDuration` dengan `Math.random()` saat render. Di aplikasi SSR
 *   nilai di server dan di klien selalu berbeda, jadi React melaporkan
 *   hydration mismatch pada setiap meteor. Di sini posisi, delay, dan durasi
 *   diambil dari {@link METEOR_TRACKS} — array tetap dan deterministik, jadi
 *   markup server dan klien identik. Konsekuensinya pola hujan sama di setiap
 *   muat halaman; untuk ornamen latar itu tidak terasa.
 * - **Palette retokenised.** Titik abu slate dan ekor biru-abu yang di-hardcode
 *   upstream diganti token `brand`, jadi warnanya ikut preset tema.
 *   (Nama kelas upstream sengaja tidak dikutip persis di sini — scanner
 *   Tailwind ikut membaca komentar dan akan menerbitkan CSS mati untuknya.)
 * - **Reduced motion.** Blok global di `App.css` memaksa
 *   `animation-duration: 0.01ms` + `iteration-count: 1`, yang akan melempar
 *   semua meteor ke akhir lintasannya (opacity 0) dan membuat lapisan ini
 *   kosong tanpa alasan yang jelas. Karena itu stylesheet komponen mematikan
 *   animasinya sendiri dengan `animation: none !important` dan menyisakan
 *   sebaran garis statis yang tetap enak dilihat.
 *
 * Server Component — tanpa state, tanpa `"use client"`.
 *
 * Keyframe-nya di-inline lewat `<style href precedence>` (React 19 mengangkat
 * dan men-dedupe tag ini ke `<head>`, jadi merender banyak `<Meteors>` tetap
 * menghasilkan satu blok CSS). Ini satu-satunya keyframe di direktori ini yang
 * tidak punya padanan utility Tailwind.
 */
import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Lintasan meteor — DETERMINISTIK dengan sengaja (lihat catatan hydration di
 * atas). `left`/`top` adalah titik awal relatif terhadap container.
 */
const METEOR_TRACKS = [
  { left: "-6%", top: "-4%", delay: "0s", duration: "6.2s" },
  { left: "8%", top: "12%", delay: "1.4s", duration: "8.1s" },
  { left: "16%", top: "-8%", delay: "3.1s", duration: "5.4s" },
  { left: "24%", top: "22%", delay: "0.7s", duration: "9.3s" },
  { left: "31%", top: "4%", delay: "4.2s", duration: "6.8s" },
  { left: "39%", top: "-10%", delay: "2.3s", duration: "7.5s" },
  { left: "46%", top: "16%", delay: "5.6s", duration: "5.9s" },
  { left: "53%", top: "2%", delay: "1.1s", duration: "8.7s" },
  { left: "61%", top: "-6%", delay: "3.8s", duration: "6.1s" },
  { left: "68%", top: "26%", delay: "0.4s", duration: "9.8s" },
  { left: "74%", top: "8%", delay: "4.9s", duration: "5.6s" },
  { left: "81%", top: "-2%", delay: "2.7s", duration: "7.2s" },
  { left: "88%", top: "18%", delay: "6.1s", duration: "6.5s" },
  { left: "94%", top: "6%", delay: "1.8s", duration: "8.4s" },
  { left: "12%", top: "34%", delay: "5.2s", duration: "7.9s" },
  { left: "35%", top: "30%", delay: "3.4s", duration: "6.7s" },
  { left: "58%", top: "38%", delay: "0.9s", duration: "9.1s" },
  { left: "79%", top: "32%", delay: "4.6s", duration: "5.8s" },
  { left: "21%", top: "44%", delay: "2.1s", duration: "8.9s" },
  { left: "66%", top: "48%", delay: "6.4s", duration: "7.1s" },
] as const;

/**
 * Keyframe asli Aceternity (`meteor-effect`), disalin apa adanya kecuali jarak
 * tempuhnya. Rotasi 215deg dipasang juga sebagai transform statis di kelas
 * dasar supaya meteor tetap miring ketika animasinya dimatikan.
 */
const METEOR_STYLES = `
.cp-meteor {
  transform: rotate(215deg);
  animation-name: cp-meteor-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@keyframes cp-meteor-fall {
  0%   { transform: rotate(215deg) translateX(0);      opacity: 1; }
  70%  { opacity: 1; }
  100% { transform: rotate(215deg) translateX(-620px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .cp-meteor {
    animation: none !important;
    opacity: 0.5 !important;
  }
}
`;

export type MeteorsProps = {
  /** Jumlah meteor. Dibatasi oleh panjang {@link METEOR_TRACKS} (20). */
  count?: number;
  /** Kelas untuk tiap meteor — mis. mengganti warna atau panjang ekor. */
  className?: string;
  /** Kelas untuk lapisan pembungkus. */
  containerClassName?: string;
};

export function Meteors({
  count = 12,
  className,
  containerClassName,
}: MeteorsProps) {
  const tracks = METEOR_TRACKS.slice(
    0,
    Math.max(0, Math.min(count, METEOR_TRACKS.length)),
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        containerClassName,
      )}
    >
      <style href="cp-aceternity-meteors" precedence="default">
        {METEOR_STYLES}
      </style>
      {tracks.map((track) => (
        <span
          key={`${track.left}-${track.top}`}
          style={{
            left: track.left,
            top: track.top,
            animationDelay: track.delay,
            animationDuration: track.duration,
          }}
          className={cn(
            "cp-meteor absolute h-0.5 w-0.5 rounded-full bg-brand/70",
            "shadow-[0_0_0_1px_oklch(var(--brand)_/_0.10)]",
            "before:absolute before:top-1/2 before:h-px before:w-[50px] before:-translate-y-1/2",
            "before:bg-gradient-to-r before:from-brand/70 before:to-transparent before:content-['']",
            className,
          )}
        />
      ))}
    </div>
  );
}
