import { cn } from "@/shared/lib/utils";
import { CheckCircle, Panel, ProgressTrack, Ring, SkeletonLine } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Roadmap Skill — jalur milestone bertahap di atas, kartu tahapan berisi
 * daftar tugas dan progres di bawah.
 * Menggantikan `public/features/skill-roadmap.webp` (1600x900).
 */
export function SkillRoadmap({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* judul + progres keseluruhan */}
      <SkeletonLine x={100} y={104} w={300} h={20} className="fill-foreground/55" />
      <SkeletonLine x={100} y={144} w={214} h={12} />
      <SkeletonLine x={1160} y={116} w={168} h={14} className="fill-muted-foreground/45" />
      <SkeletonLine x={1160} y={146} w={124} h={10} />
      <Ring cx={1420} cy={150} r={62} value={0.72} width={18} />

      {/* jalur milestone */}
      <ProgressTrack x={140} y={330} w={1320} value={0.72} h={10} />
      <circle cx={245} cy={335} r={40} className="fill-background" />
      <CheckCircle cx={245} cy={335} r={30} className="fill-brand" checkClassName="stroke-card" />
      <circle cx={615} cy={335} r={40} className="fill-background" />
      <CheckCircle cx={615} cy={335} r={30} className="fill-brand" checkClassName="stroke-card" />
      <circle cx={985} cy={335} r={40} className="fill-background" />
      <CheckCircle cx={985} cy={335} r={30} className="fill-brand" checkClassName="stroke-card" />
      <circle cx={1355} cy={335} r={40} className="fill-background" />
      <circle
        cx={1355}
        cy={335}
        r={30}
        strokeWidth={4}
        className="fill-card stroke-brand/40"
      />
      <circle cx={1355} cy={335} r={12} className="fill-brand/30" />

      <SkeletonLine x={200} y={252} w={90} h={12} className="fill-muted-foreground/45" />
      <SkeletonLine x={570} y={252} w={90} h={12} className="fill-muted-foreground/45" />
      <SkeletonLine x={940} y={252} w={90} h={12} className="fill-muted-foreground/45" />
      <SkeletonLine x={1310} y={252} w={90} h={12} className="fill-muted-foreground/45" />

      {/* tahap 1 */}
      <Panel x={90} y={420} w={310} h={380} r={24} />
      <Panel x={118} y={456} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <rect x={134} y={470} width={16} height={20} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={182} y={472} w={124} h={14} className="fill-muted-foreground/45" />
      <circle cx={128} cy={560} r={11} className="fill-brand" />
      <SkeletonLine x={152} y={554} w={176} h={11} />
      <circle cx={128} cy={610} r={11} className="fill-brand" />
      <SkeletonLine x={152} y={604} w={148} h={11} />
      <circle cx={128} cy={660} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={152} y={654} w={162} h={11} />
      <ProgressTrack x={118} y={740} w={254} value={0.75} />

      {/* tahap 2 */}
      <Panel x={460} y={420} w={310} h={380} r={24} />
      <Panel x={488} y={456} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <rect x={504} y={470} width={16} height={20} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={552} y={472} w={108} h={14} className="fill-muted-foreground/45" />
      <circle cx={498} cy={560} r={11} className="fill-brand" />
      <SkeletonLine x={522} y={554} w={190} h={11} />
      <circle cx={498} cy={610} r={11} className="fill-brand" />
      <SkeletonLine x={522} y={604} w={156} h={11} />
      <circle cx={498} cy={660} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={522} y={654} w={140} h={11} />
      <ProgressTrack x={488} y={740} w={254} value={0.6} />

      {/* tahap 3 */}
      <Panel x={830} y={420} w={310} h={380} r={24} />
      <Panel x={858} y={456} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <rect x={874} y={470} width={16} height={20} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={922} y={472} w={132} h={14} className="fill-muted-foreground/45" />
      <circle cx={868} cy={560} r={11} className="fill-brand" />
      <SkeletonLine x={892} y={554} w={168} h={11} />
      <circle cx={868} cy={610} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={892} y={604} w={182} h={11} />
      <circle cx={868} cy={660} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={892} y={654} w={146} h={11} />
      <ProgressTrack x={858} y={740} w={254} value={0.4} />

      {/* tahap 4 */}
      <Panel x={1200} y={420} w={310} h={380} r={24} />
      <Panel x={1228} y={456} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <rect x={1244} y={470} width={16} height={20} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={1292} y={472} w={116} h={14} className="fill-muted-foreground/45" />
      <circle cx={1238} cy={560} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={1262} y={554} w={158} h={11} />
      <circle cx={1238} cy={610} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={1262} y={604} w={174} h={11} />
      <circle cx={1238} cy={660} r={11} strokeWidth={2} className="fill-none stroke-border" />
      <SkeletonLine x={1262} y={654} w={136} h={11} />
      <ProgressTrack x={1228} y={740} w={254} value={0.15} />
    </svg>
  );
}
