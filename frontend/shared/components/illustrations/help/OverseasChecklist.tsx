import { cn } from "@/shared/lib/utils";
import { CheckCircle, SkeletonLine } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Checklist kerja ke luar negeri — paspor berisi boarding pass, globe di
 * dudukannya, dan tiga baris persyaratan yang sudah tercentang.
 */
export function OverseasChecklist({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <rect x={425} y={296} width={10} height={62} rx={5} ry={5} className="fill-muted-foreground" />
      <path d="M 396 394 L 412 356 H 448 L 464 394 Z" className="fill-muted-foreground" />

      <circle
        cx={430}
        cy={210}
        r={112}
        strokeWidth={3}
        className="fill-card stroke-muted-foreground/60"
      />
      <ellipse
        cx={392}
        cy={158}
        rx={46}
        ry={24}
        transform="rotate(-16 392 158)"
        className="fill-brand/65"
      />
      <ellipse
        cx={466}
        cy={214}
        rx={26}
        ry={48}
        transform="rotate(10 466 214)"
        className="fill-brand/65"
      />
      <ellipse
        cx={388}
        cy={254}
        rx={30}
        ry={20}
        transform="rotate(20 388 254)"
        className="fill-brand/65"
      />
      <ellipse
        cx={430}
        cy={210}
        rx={50}
        ry={112}
        strokeWidth={2}
        className="fill-none stroke-muted-foreground/30"
      />
      <path d="M 318 210 H 542" strokeWidth={2} className="fill-none stroke-muted-foreground/30" />

      <g transform="rotate(-6 272 176)">
        <rect
          x={214}
          y={130}
          width={116}
          height={94}
          rx={12}
          ry={12}
          strokeWidth={2.5}
          className="fill-card stroke-border"
        />
        <SkeletonLine x={232} y={150} w={74} h={9} className="fill-brand/70" />
        <SkeletonLine x={232} y={170} w={56} h={7} />
      </g>

      <rect x={196} y={196} width={150} height={200} rx={16} ry={16} className="fill-brand-to" />
      <circle cx={271} cy={272} r={36} strokeWidth={4} className="fill-none stroke-background" />
      <ellipse cx={271} cy={272} rx={16} ry={36} strokeWidth={3} className="fill-none stroke-background" />
      <path d="M 235 272 H 307" strokeWidth={3} className="fill-none stroke-background" />
      <rect x={247} y={334} width={48} height={26} rx={7} ry={7} className="fill-background/70" />

      <CheckCircle cx={610} cy={132} r={26} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={648} y={118} w={86} h={11} className="fill-foreground/70" />
      <SkeletonLine x={648} y={137} w={60} h={11} className="fill-foreground/70" />

      <CheckCircle cx={610} cy={224} r={26} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={648} y={210} w={86} h={11} className="fill-foreground/70" />
      <SkeletonLine x={648} y={229} w={60} h={11} className="fill-foreground/70" />

      <CheckCircle cx={610} cy={316} r={26} className="fill-brand" checkClassName="stroke-card" />
      <SkeletonLine x={648} y={302} w={86} h={11} className="fill-foreground/70" />
      <SkeletonLine x={648} y={321} w={60} h={11} className="fill-foreground/70" />
    </svg>
  );
}
