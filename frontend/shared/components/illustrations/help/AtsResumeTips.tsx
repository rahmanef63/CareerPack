import { cn } from "@/shared/lib/utils";
import { Avatar, Check, Ring, Sheet, SkeletonLine, SkeletonLines } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Tips CV ramah ATS — lembar CV yang sedang dipindai garis brand, dengan
 * cincin skor bercentang menimpa sudut kanan bawah.
 */
export function AtsResumeTips({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Sheet x={235} y={40} w={290} h={370} fold={48} r={16} />

      <Avatar cx={292} cy={100} r={22} />
      <SkeletonLine x={340} y={88} w={140} h={13} className="fill-foreground/75" />
      <SkeletonLines x={340} y={116} w={145} h={8} lines={2} gap={12} tail={0.75} />

      <rect x={180} y={186} width={370} height={5} rx={2.5} ry={2.5} className="fill-brand" />
      <circle cx={222} cy={188.5} r={10} className="fill-brand" />

      <circle cx={272} cy={228} r={7} className="fill-brand" />
      <SkeletonLine x={296} y={222} w={150} h={12} className="fill-foreground/75" />
      <SkeletonLine x={296} y={242} w={130} h={7} />

      <circle cx={272} cy={278} r={7} className="fill-brand" />
      <SkeletonLine x={296} y={272} w={132} h={12} className="fill-foreground/75" />
      <SkeletonLine x={296} y={292} w={148} h={7} />

      <circle cx={272} cy={328} r={7} className="fill-brand" />
      <SkeletonLine x={296} y={322} w={158} h={12} className="fill-foreground/75" />
      <SkeletonLine x={296} y={342} w={122} h={7} />

      <circle cx={272} cy={378} r={7} className="fill-brand" />
      <SkeletonLine x={296} y={372} w={118} h={12} className="fill-foreground/75" />
      <SkeletonLine x={296} y={392} w={140} h={7} />

      <circle
        cx={555}
        cy={320}
        r={82}
        strokeWidth={2}
        className="fill-card stroke-border"
      />
      <Ring cx={555} cy={320} r={60} value={0.72} width={18} />
      <Check cx={555} cy={320} size={52} className="stroke-brand" />
    </svg>
  );
}
