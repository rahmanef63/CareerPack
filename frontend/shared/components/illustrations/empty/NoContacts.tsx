import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Avatar, Briefcase, Panel } from "../primitives";

/**
 * Empty contact list — a briefcase with two blank name cards tucked in front,
 * neither of them carrying a person yet.
 */
export function NoContacts({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Briefcase x={252} y={96} w={296} h={290} />
      <rect x={252} y={262} width={296} height={10} rx={5} ry={5} className="fill-card/45" />

      {/* left name card, leaning out */}
      <g transform="rotate(-11 296 400)">
        <Panel x={198} y={286} w={196} h={248} r={22} />
        <Avatar cx={296} cy={366} r={36} />
      </g>

      {/* right name card, leaning the other way */}
      <g transform="rotate(9 506 396)">
        <Panel x={408} y={282} w={196} h={248} r={22} />
        <Avatar cx={506} cy={362} r={36} className="fill-brand/45" />
      </g>
    </svg>
  );
}
