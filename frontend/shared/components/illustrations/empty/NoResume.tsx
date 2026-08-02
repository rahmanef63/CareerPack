import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Sheet, SkeletonLines } from "../primitives";

/**
 * No CV yet — a blank sheet with an add badge clipped to its corner.
 */
export function NoResume({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Sheet x={230} y={110} w={300} h={380} fold={76} r={20} />
      <SkeletonLines x={272} y={224} w={196} lines={4} gap={22} tail={0.5} />

      {/* add badge */}
      <circle cx={540} cy={430} r={78} className="fill-brand" />
      <rect x={530} y={386} width={20} height={88} rx={10} ry={10} className="fill-card" />
      <rect x={496} y={420} width={88} height={20} rx={10} ry={10} className="fill-card" />
    </svg>
  );
}
