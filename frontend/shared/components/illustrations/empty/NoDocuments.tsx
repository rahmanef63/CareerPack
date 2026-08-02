import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Sheet, SkeletonLines } from "../primitives";

/**
 * Empty document folder — one blank sheet slipped into a folder that is
 * otherwise holding nothing, keyhole facing front.
 */
export function NoDocuments({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* folder back panel */}
      <rect x={182} y={160} width={436} height={320} rx={26} ry={26} className="fill-brand/50" />

      {/* the single blank sheet inside */}
      <Sheet x={252} y={96} w={296} h={290} fold={76} foldClassName="fill-brand/55" />
      <SkeletonLines x={288} y={168} w={180} lines={3} gap={14} />

      {/* folder front panel, notched like a tab */}
      <path
        d="M 170 320 A 30 30 0 0 1 200 290 H 322 L 352 336 H 600 A 30 30 0 0 1 630 366 V 494 A 30 30 0 0 1 600 524 H 200 A 30 30 0 0 1 170 494 Z"
        className="fill-brand"
      />

      {/* keyhole */}
      <rect x={372} y={370} width={56} height={44} rx={14} ry={14} className="fill-card/70" />
      <rect x={388} y={408} width={24} height={44} rx={12} ry={12} className="fill-card/70" />
    </svg>
  );
}
