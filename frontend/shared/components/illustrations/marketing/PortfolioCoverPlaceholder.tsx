import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";

/**
 * Sampul portofolio bawaan — lapisan bentuk potong-kertas yang sengaja tenang
 * karena judul dan meta proyek duduk di atasnya.
 * Pengganti `portfolio/cover-placeholder.webp` (1200×800).
 */
export function PortfolioCoverPlaceholder({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1200 800"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <rect x={0} y={0} width={1200} height={800} className="fill-muted/40" />

      <rect x={500} y={-92} width={282} height={374} rx={118} ry={118} className="fill-brand/60" />

      <path
        d="M 0 0 H 516 V 92 C 516 210 402 194 380 302 C 356 432 190 428 132 542 C 92 618 46 690 0 702 Z"
        transform="translate(0 28)"
        className="fill-brand/20"
      />
      <path
        d="M 0 0 H 516 V 92 C 516 210 402 194 380 302 C 356 432 190 428 132 542 C 92 618 46 690 0 702 Z"
        className="fill-brand/45"
      />

      <rect x={920} y={262} width={340} height={338} rx={72} ry={72} className="fill-foreground/15" />

      <rect
        x={500}
        y={422}
        width={422}
        height={420}
        rx={112}
        ry={112}
        transform="translate(0 24)"
        className="fill-foreground/10"
      />
      <rect x={500} y={422} width={422} height={420} rx={112} ry={112} className="fill-foreground/30" />

      <rect x={930} y={452} width={336} height={392} rx={96} ry={96} className="fill-brand/40" />

      <rect x={232} y={584} width={306} height={302} rx={124} ry={124} className="fill-brand/30" />
    </svg>
  );
}
