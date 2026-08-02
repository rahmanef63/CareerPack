import { cn } from "@/shared/lib/utils";
import { Panel, Pill, SkeletonLine } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Pelacak Lamaran — papan kanban empat kolom berisi kartu lamaran.
 * Menggantikan `public/features/job-tracker.webp` (1600x900).
 */
export function JobTracker({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* kolom 1 — tersimpan */}
      <Panel x={110} y={140} w={320} h={640} r={24} className="fill-muted/40 stroke-border/60" />
      <SkeletonLine x={138} y={180} w={112} h={13} className="fill-muted-foreground/45" />
      <circle cx={396} cy={186} r={13} className="fill-brand/20" />

      <Panel x={130} y={232} w={280} h={124} r={16} />
      <rect x={154} y={254} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={202} y={260} w={132} h={13} />
      <SkeletonLine x={202} y={284} w={92} h={9} />
      <Pill x={154} y={310} w={84} h={22} />

      <Panel x={130} y={372} w={280} h={124} r={16} />
      <rect x={154} y={394} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={202} y={400} w={110} h={13} />
      <SkeletonLine x={202} y={424} w={84} h={9} />
      <Pill x={154} y={450} w={72} h={22} />

      <Panel x={130} y={512} w={280} h={124} r={16} />
      <rect x={154} y={534} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={202} y={540} w={126} h={13} />
      <SkeletonLine x={202} y={564} w={76} h={9} />
      <Pill x={154} y={590} w={90} h={22} />

      {/* kolom 2 — dilamar */}
      <Panel x={470} y={140} w={320} h={640} r={24} className="fill-muted/40 stroke-border/60" />
      <SkeletonLine x={498} y={180} w={98} h={13} className="fill-muted-foreground/45" />
      <circle cx={756} cy={186} r={13} className="fill-brand/20" />

      <Panel x={490} y={232} w={280} h={124} r={16} />
      <rect x={514} y={254} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={562} y={260} w={140} h={13} />
      <SkeletonLine x={562} y={284} w={90} h={9} />
      <Pill x={514} y={310} w={96} h={22} className="fill-info/20" />

      <Panel x={490} y={372} w={280} h={124} r={16} />
      <rect x={514} y={394} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={562} y={400} w={118} h={13} />
      <SkeletonLine x={562} y={424} w={98} h={9} />
      <Pill x={514} y={450} w={80} h={22} className="fill-info/20" />

      <Panel x={490} y={512} w={280} h={124} r={16} />
      <rect x={514} y={534} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={562} y={540} w={132} h={13} />
      <SkeletonLine x={562} y={564} w={72} h={9} />
      <Pill x={514} y={590} w={88} h={22} className="fill-info/20" />

      {/* kolom 3 — wawancara */}
      <Panel x={830} y={140} w={320} h={640} r={24} className="fill-muted/40 stroke-border/60" />
      <SkeletonLine x={858} y={180} w={126} h={13} className="fill-muted-foreground/45" />
      <circle cx={1116} cy={186} r={13} className="fill-brand/20" />

      <Panel x={850} y={232} w={280} h={124} r={16} />
      <rect x={874} y={254} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={922} y={260} w={128} h={13} />
      <SkeletonLine x={922} y={284} w={94} h={9} />
      <Pill x={874} y={310} w={82} h={22} className="fill-warning/25" />

      <Panel x={850} y={372} w={280} h={124} r={16} />
      <rect x={874} y={394} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={922} y={400} w={106} h={13} />
      <SkeletonLine x={922} y={424} w={80} h={9} />
      <Pill x={874} y={450} w={76} h={22} className="fill-warning/25" />

      {/* kolom 4 — penawaran */}
      <Panel x={1190} y={140} w={320} h={640} r={24} className="fill-muted/40 stroke-border/60" />
      <SkeletonLine x={1218} y={180} w={88} h={13} className="fill-muted-foreground/45" />
      <circle cx={1476} cy={186} r={13} className="fill-brand/20" />

      <Panel x={1210} y={232} w={280} h={124} r={16} />
      <rect x={1234} y={254} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={1282} y={260} w={136} h={13} />
      <SkeletonLine x={1282} y={284} w={86} h={9} />
      <Pill x={1234} y={310} w={98} h={22} className="fill-success/25" />

      <Panel x={1210} y={372} w={280} h={124} r={16} />
      <rect x={1234} y={394} width={36} height={36} rx={10} ry={10} className="fill-brand/25" />
      <SkeletonLine x={1282} y={400} w={114} h={13} />
      <SkeletonLine x={1282} y={424} w={92} h={9} />
      <Pill x={1234} y={450} w={86} h={22} className="fill-success/25" />
    </svg>
  );
}
