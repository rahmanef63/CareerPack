import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Briefcase } from "../primitives";

/**
 * Empty calendar — a month grid with no agenda on any date, the career
 * briefcase parked behind it.
 */
export function NoEvents({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Briefcase
        x={100}
        y={372}
        w={210}
        h={124}
        r={14}
        className="fill-brand/70"
        handleClassName="fill-none stroke-brand/70"
      />
      <rect x={100} y={444} width={210} height={8} rx={4} ry={4} className="fill-card/50" />

      {/* hanger pins peeking above the header */}
      <rect x={305} y={118} width={22} height={50} rx={11} ry={11} className="fill-brand/55" />
      <rect x={540} y={118} width={22} height={50} rx={11} ry={11} className="fill-brand/55" />

      {/* calendar card */}
      <rect
        x={245}
        y={155}
        width={380}
        height={360}
        rx={26}
        ry={26}
        strokeWidth={2}
        className="fill-card stroke-border"
      />
      {/* header band — two rects so only the top corners round, no clipping shape */}
      <rect x={245} y={155} width={380} height={70} rx={26} ry={26} className="fill-brand" />
      <rect x={245} y={192} width={380} height={33} className="fill-brand" />

      {/* month grid, every cell blank */}
      <rect x={275} y={255} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={341} y={255} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={407} y={255} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={473} y={255} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={539} y={255} width={52} height={44} rx={10} ry={10} className="fill-muted" />

      <rect x={275} y={313} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={341} y={313} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={407} y={313} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={473} y={313} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={539} y={313} width={52} height={44} rx={10} ry={10} className="fill-muted" />

      <rect x={275} y={371} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={341} y={371} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={407} y={371} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={473} y={371} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={539} y={371} width={52} height={44} rx={10} ry={10} className="fill-muted" />

      <rect x={275} y={429} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={341} y={429} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={407} y={429} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={473} y={429} width={52} height={44} rx={10} ry={10} className="fill-muted" />
      <rect x={539} y={429} width={52} height={44} rx={10} ry={10} className="fill-brand/25" />
    </svg>
  );
}
