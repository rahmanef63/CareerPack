import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Briefcase } from "../primitives";

/**
 * No skill roadmap yet — stepping stones climbing toward a flag that has
 * been planted but never walked to.
 */
export function NoRoadmap({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* flag pole, planted behind the case */}
      <rect x={500} y={104} width={10} height={196} rx={5} ry={5} className="fill-brand/60" />
      <path d="M 510 110 H 606 L 578 145 L 606 180 H 510 Z" className="fill-brand" />

      <Briefcase
        x={470}
        y={232}
        w={190}
        h={112}
        r={14}
        handleClassName="fill-none stroke-brand/60"
      />
      <rect x={470} y={296} width={190} height={8} rx={4} ry={4} className="fill-card/45" />

      {/* stepping stones, all still empty */}
      <rect x={378} y={326} width={100} height={22} rx={11} ry={11} className="fill-muted" />
      <circle cx={430} cy={304} r={32} className="fill-brand/45" />

      <rect x={300} y={390} width={130} height={26} rx={13} ry={13} className="fill-muted" />
      <circle cx={365} cy={366} r={38} className="fill-brand" />

      <rect x={210} y={460} width={140} height={28} rx={14} ry={14} className="fill-muted" />
      <circle cx={280} cy={432} r={44} className="fill-brand/45" />
    </svg>
  );
}
