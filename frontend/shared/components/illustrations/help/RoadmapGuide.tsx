import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";

/**
 * Panduan roadmap karier — jalur putus-putus menanjak melewati tiga penanda
 * tahapan menuju bendera di puncak.
 */
export function RoadmapGuide({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <path
        d="M 254 398 C 320 406 350 358 396 332 C 446 306 452 272 478 240"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="20 18"
        className="fill-none stroke-brand"
      />
      <path
        d="M 500 224 C 545 150 620 148 668 224"
        strokeWidth={7}
        strokeLinecap="round"
        className="fill-none stroke-brand-to"
      />

      <path
        d="M 583 168 V 56"
        strokeWidth={8}
        strokeLinecap="round"
        className="fill-none stroke-brand-to"
      />
      <circle cx={583} cy={54} r={9} className="fill-brand-to" />
      <path d="M 590 62 H 654 L 642 82 L 654 102 H 590 Z" className="fill-brand" />
      <ellipse
        cx={583}
        cy={170}
        rx={22}
        ry={8}
        strokeWidth={5}
        className="fill-card stroke-brand-to"
      />

      <path d="M 197 352 L 214 396 L 231 352 Z" className="fill-brand-to" />
      <ellipse
        cx={214}
        cy={398}
        rx={36}
        ry={12}
        strokeWidth={6}
        className="fill-none stroke-brand-to"
      />
      <circle cx={214} cy={316} r={42} strokeWidth={7} className="fill-card stroke-brand-to" />
      <circle cx={214} cy={316} r={19} className="fill-brand" />

      <path d="M 384 290 L 396 328 L 408 290 Z" className="fill-brand-to" />
      <ellipse
        cx={396}
        cy={330}
        rx={27}
        ry={10}
        strokeWidth={6}
        className="fill-none stroke-brand-to"
      />
      <circle cx={396} cy={262} r={32} strokeWidth={7} className="fill-card stroke-brand-to" />
      <path
        d="M 396 247 L 399.7 256.9 L 410.3 257.4 L 402 264 L 404.8 274.1 L 396 268.3 L 387.2 274.1 L 390 264 L 381.7 257.4 L 392.3 256.9 Z"
        className="fill-brand"
      />

      <path d="M 468 206 L 478 238 L 488 206 Z" className="fill-brand-to" />
      <ellipse
        cx={478}
        cy={240}
        rx={23}
        ry={9}
        strokeWidth={6}
        className="fill-none stroke-brand-to"
      />
      <circle cx={478} cy={180} r={28} strokeWidth={7} className="fill-card stroke-brand-to" />
      <circle cx={478} cy={180} r={13} className="fill-brand" />
    </svg>
  );
}
