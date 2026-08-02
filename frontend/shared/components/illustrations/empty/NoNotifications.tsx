import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Briefcase } from "../primitives";

/**
 * Empty notification bell — the bell has rung but the tray underneath it
 * came back with nothing in it.
 */
export function NoNotifications({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* ring marks */}
      <path
        d="M 262 148 L 292 166"
        strokeWidth={12}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
      <path
        d="M 264 204 L 294 188"
        strokeWidth={12}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
      <path
        d="M 538 148 L 508 166"
        strokeWidth={12}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
      <path
        d="M 536 204 L 506 188"
        strokeWidth={12}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />

      {/* bell */}
      <circle cx={400} cy={132} r={17} className="fill-brand" />
      <path d="M 322 258 V 214 A 78 78 0 0 1 478 214 V 258 Z" className="fill-brand" />
      <circle cx={400} cy={288} r={26} className="fill-brand/50" />
      <rect x={300} y={248} width={200} height={28} rx={14} ry={14} className="fill-brand" />

      {/* empty tray */}
      <rect x={210} y={372} width={380} height={160} rx={28} ry={28} className="fill-brand" />
      <path
        d="M 234 420 L 260 380 H 540 L 566 420 H 462 L 448 448 H 352 L 338 420 Z"
        className="fill-card"
      />
      <Briefcase
        x={332}
        y={462}
        w={136}
        h={62}
        r={12}
        className="fill-card"
        handleClassName="fill-none stroke-card"
      />
    </svg>
  );
}
