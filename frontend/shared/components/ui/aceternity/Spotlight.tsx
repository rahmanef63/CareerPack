/**
 * Spotlight — ported from Aceternity UI
 * https://ui.aceternity.com/components/spotlight
 *
 * Sapuan cahaya diagonal (elips ber-blur) untuk menarik perhatian ke satu
 * area — dipakai sebagai ornamen di belakang hero / section marketing.
 *
 * Changed vs upstream:
 * - **Dep removed.** Upstream memakai keyframe `animate-spotlight` yang harus
 *   didaftarkan sendiri di config. Di sini entrance dipakai lewat utility
 *   `tailwindcss-animate` yang sudah terpasang (`animate-in fade-in-0
 *   zoom-in-50 delay-700 duration-1000 fill-mode-both`) — nol keyframe baru.
 * - **Palette retokenised.** `fill={fill || "white"}` diganti
 *   `fill="currentColor"` + prop `fillClassName` berisi token warna
 *   (default `text-brand`), jadi warnanya ikut preset tema, bukan putih mati.
 * - **Reduced motion.** `motion-reduce:animate-none` — elemen langsung tampil
 *   di posisi akhirnya (opacity/scale natural), tidak tertahan oleh delay.
 * - **Filter id.** Upstream memakai id statis `filter`; di sini bisa dioper
 *   lewat prop `id` supaya dua Spotlight di satu halaman tidak berbagi id DOM.
 *
 * Server Component — tanpa state, tanpa "use client".
 */
import { cn } from "@/shared/lib/utils";

export type SpotlightProps = {
  /** Kelas posisi/ukuran, mis. `-top-40 left-0 md:-top-20 md:left-60`. */
  className?: string;
  /**
   * Token warna sebagai kelas Tailwind. Elips memakai `currentColor`, jadi
   * apa pun `text-*` di sini yang menentukan warnanya.
   */
  fillClassName?: string;
  /** Prefix id untuk `<filter>`. Ganti bila ada >1 Spotlight per halaman. */
  id?: string;
};

export function Spotlight({
  className,
  fillClassName = "text-brand",
  id = "cp-spotlight",
}: SpotlightProps) {
  const filterId = `${id}-blur`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn(
        "pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%]",
        // Entrance: fade + zoom lembut, tertunda sebentar supaya konten hero
        // sempat terbaca lebih dulu. `fill-mode-both` menahan state awal
        // selama delay, kalau tidak elemen sempat berkedip penuh.
        "animate-in fade-in-0 zoom-in-50 fill-mode-both delay-700 duration-1000",
        "motion-reduce:animate-none",
        fillClassName,
        className,
      )}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter={`url(#${filterId})`}>
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill="currentColor"
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id={filterId}
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  );
}
