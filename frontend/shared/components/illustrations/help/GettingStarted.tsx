import { cn } from "@/shared/lib/utils";
import { Sheet, SkeletonLine, SkeletonLines } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Mulai dari sini — kotak berkas terbuka berisi CV, map, dan buku panduan,
 * dengan lencana bendera start di sudut kanan bawah.
 */
export function GettingStarted({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <rect
        x={210}
        y={124}
        width={132}
        height={140}
        rx={14}
        ry={14}
        transform="rotate(-12 276 194)"
        className="fill-brand/45"
      />

      <g transform="rotate(9 500 190)">
        <rect
          x={444}
          y={118}
          width={118}
          height={144}
          rx={14}
          ry={14}
          className="fill-foreground/80"
        />
        <path d="M 512 118 H 540 V 166 L 526 154 L 512 166 Z" className="fill-brand" />
      </g>

      <Sheet x={300} y={58} w={190} h={200} fold={34} r={12} />
      <circle cx={330} cy={96} r={14} className="fill-brand" />
      <SkeletonLines x={356} y={83} w={104} h={8} lines={3} gap={9} tail={0.7} />

      <circle cx={330} cy={148} r={6} className="fill-brand" />
      <SkeletonLine x={350} y={144} w={106} h={8} className="fill-muted-foreground/40" />
      <circle cx={330} cy={183} r={6} className="fill-brand" />
      <SkeletonLine x={350} y={179} w={92} h={8} className="fill-muted-foreground/40" />
      <circle cx={330} cy={218} r={6} className="fill-brand" />
      <SkeletonLine x={350} y={214} w={106} h={8} className="fill-muted-foreground/40" />

      <rect x={234} y={204} width={328} height={38} rx={19} ry={19} className="fill-brand/60" />
      <rect x={252} y={230} width={292} height={164} rx={24} ry={24} className="fill-brand" />
      <path
        d="M 344 262 V 298 A 16 16 0 0 0 360 314 H 436 A 16 16 0 0 0 452 298 V 262"
        strokeWidth={9}
        strokeLinecap="round"
        className="fill-none stroke-card"
      />

      <circle cx={598} cy={332} r={64} strokeWidth={2.5} className="fill-card stroke-border" />
      <rect x={566} y={352} width={64} height={18} rx={6} ry={6} className="fill-brand-to" />
      <rect x={592} y={288} width={9} height={68} rx={4.5} ry={4.5} className="fill-brand-to" />
      <path d="M 601 292 H 644 L 634 306 L 644 320 H 601 Z" className="fill-brand" />
    </svg>
  );
}
