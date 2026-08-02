import { cn } from "@/shared/lib/utils";
import { CheckCircle, SkeletonLine, SkeletonLines } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Persiapan wawancara — dua balon percakapan saling berhadapan dengan papan
 * jalan berisi daftar persiapan tercentang di depannya.
 */
export function InterviewPrep({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <path
        d="M 124 70 H 366 A 24 24 0 0 1 390 94 V 276 A 24 24 0 0 1 366 300 H 216 L 152 348 L 166 300 H 124 A 24 24 0 0 1 100 276 V 94 A 24 24 0 0 1 124 70 Z"
        strokeWidth={3}
        className="fill-card stroke-muted-foreground/55"
      />
      <circle cx={155} cy={128} r={24} className="fill-brand-to" />
      <SkeletonLines x={196} y={112} w={140} h={10} lines={3} gap={10} tail={0.8} />
      <SkeletonLine x={130} y={205} w={230} h={10} className="fill-brand-to/50" />
      <circle cx={150} cy={258} r={9} className="fill-brand-to/50" />
      <circle cx={178} cy={258} r={9} className="fill-brand-to/50" />
      <circle cx={206} cy={258} r={9} className="fill-brand-to/50" />

      <path
        d="M 454 130 H 696 A 24 24 0 0 1 720 154 V 306 A 24 24 0 0 1 696 330 H 654 L 668 378 L 604 330 H 454 A 24 24 0 0 1 430 306 V 154 A 24 24 0 0 1 454 130 Z"
        strokeWidth={2.5}
        className="fill-brand/10 stroke-brand/55"
      />
      <circle cx={486} cy={185} r={24} className="fill-brand" />
      <SkeletonLines x={527} y={170} w={140} h={10} lines={3} gap={10} tail={0.8} />
      <SkeletonLine x={460} y={258} w={230} h={10} className="fill-brand/70" />
      <circle cx={482} cy={302} r={9} className="fill-brand/70" />
      <circle cx={510} cy={302} r={9} className="fill-brand/70" />
      <circle cx={538} cy={302} r={9} className="fill-brand/70" />

      <rect
        x={300}
        y={178}
        width={200}
        height={222}
        rx={22}
        ry={22}
        strokeWidth={2.5}
        className="fill-card stroke-muted-foreground/45"
      />
      <rect x={352} y={160} width={96} height={36} rx={12} ry={12} className="fill-brand" />
      <circle cx={400} cy={162} r={15} className="fill-brand" />

      <CheckCircle cx={343} cy={232} r={16} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={372} y={226} w={98} h={12} className="fill-foreground/75" />
      <CheckCircle cx={343} cy={276} r={16} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={372} y={270} w={86} h={12} className="fill-foreground/75" />
      <CheckCircle cx={343} cy={320} r={16} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={372} y={314} w={98} h={12} className="fill-foreground/75" />
      <CheckCircle cx={343} cy={364} r={16} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={372} y={358} w={78} h={12} className="fill-foreground/75" />
    </svg>
  );
}
