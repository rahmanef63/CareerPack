import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Panel, SkeletonLines } from "../primitives";

/**
 * Empty job-application board — an inbox tray with nothing filed in it,
 * two blank lamaran sheets still waiting behind it.
 */
export function NoApplications({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* blank lamaran sheets stacked behind the tray */}
      <Panel x={252} y={100} w={148} h={180} r={16} />
      <SkeletonLines x={278} y={132} w={96} lines={3} gap={12} />
      <Panel x={412} y={84} w={148} h={196} r={16} />
      <SkeletonLines x={438} y={116} w={96} lines={3} gap={12} />

      {/* tray body */}
      <rect x={168} y={206} width={464} height={268} rx={30} ry={30} className="fill-brand" />

      {/* the empty slot inside it */}
      <path
        d="M 204 362 L 246 264 H 554 L 596 362 H 466 L 448 396 H 352 L 334 362 Z"
        className="fill-card"
      />

      {/* divider rails */}
      <path
        d="M 322 266 L 306 358"
        strokeWidth={16}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
      <path
        d="M 478 266 L 494 358"
        strokeWidth={16}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
    </svg>
  );
}
