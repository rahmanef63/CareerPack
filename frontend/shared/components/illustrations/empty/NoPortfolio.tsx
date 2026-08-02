import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Briefcase, Panel, SkeletonLine } from "../primitives";

/**
 * Empty portfolio grid — three frames lined up under the briefcase, each one
 * still holding only the outline of a karya that has not been uploaded.
 */
export function NoPortfolio({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Briefcase
        x={268}
        y={86}
        w={264}
        h={206}
        r={20}
        handleClassName="fill-none stroke-brand/55"
      />
      <rect x={268} y={206} width={264} height={8} rx={4} ry={4} className="fill-card/30" />

      {/* frame one */}
      <Panel x={130} y={256} w={172} h={252} r={22} className="fill-card stroke-brand" />
      <path
        d="M 174 316 A 12 12 0 0 1 186 304 H 236 L 262 330 V 400 A 12 12 0 0 1 250 412 H 186 A 12 12 0 0 1 174 400 Z"
        strokeWidth={2}
        strokeDasharray="10 10"
        strokeLinejoin="round"
        className="fill-none stroke-muted-foreground/50"
      />
      <SkeletonLine x={174} y={444} w={88} />

      {/* frame two */}
      <Panel x={314} y={256} w={172} h={252} r={22} className="fill-card stroke-brand" />
      <path
        d="M 358 316 A 12 12 0 0 1 370 304 H 420 L 446 330 V 400 A 12 12 0 0 1 434 412 H 370 A 12 12 0 0 1 358 400 Z"
        strokeWidth={2}
        strokeDasharray="10 10"
        strokeLinejoin="round"
        className="fill-none stroke-muted-foreground/50"
      />
      <SkeletonLine x={358} y={444} w={88} />

      {/* frame three */}
      <Panel x={498} y={256} w={172} h={252} r={22} className="fill-card stroke-brand" />
      <path
        d="M 542 316 A 12 12 0 0 1 554 304 H 604 L 630 330 V 400 A 12 12 0 0 1 618 412 H 554 A 12 12 0 0 1 542 400 Z"
        strokeWidth={2}
        strokeDasharray="10 10"
        strokeLinejoin="round"
        className="fill-none stroke-muted-foreground/50"
      />
      <SkeletonLine x={542} y={444} w={88} />
    </svg>
  );
}
