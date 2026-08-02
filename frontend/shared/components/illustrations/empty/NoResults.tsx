import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { SkeletonLines } from "../primitives";

/**
 * Search found nothing — a magnifier resting on a document whose page is
 * still blank behind the empty lens.
 */
export function NoResults({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* document with a cut bottom-right corner */}
      <path
        d="M 250 216 A 26 26 0 0 1 276 190 H 524 A 26 26 0 0 1 550 216 V 430 L 470 510 H 276 A 26 26 0 0 1 250 484 Z"
        className="fill-muted"
      />
      <path d="M 550 430 H 496 A 26 26 0 0 0 470 456 V 510 Z" className="fill-brand" />
      <SkeletonLines x={292} y={372} w={168} lines={2} gap={20} tail={0.55} />

      {/* magnifier handle */}
      <path
        d="M 476 256 L 566 346"
        strokeWidth={26}
        strokeLinecap="round"
        className="fill-none stroke-brand/55"
      />

      {/* lens */}
      <circle cx={400} cy={180} r={89} className="fill-background" />
      <circle cx={400} cy={180} r={100} strokeWidth={22} className="fill-none stroke-brand" />
    </svg>
  );
}
