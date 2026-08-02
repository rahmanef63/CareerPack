import { cn } from "@/shared/lib/utils";
import {
  CheckCircle,
  Panel,
  Pill,
  ProgressTrack,
  Ring,
  Sparkle,
  SkeletonLine,
  SkeletonLines,
} from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Asisten AI — kartu saran di kiri, skor kesiapan di tengah, rekomendasi skill
 * di kanan. Menggantikan `public/features/ai-assistant.webp` (1600x900).
 */
export function AiAssistant({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* orbit */}
      <circle
        cx={800}
        cy={400}
        r={236}
        strokeWidth={2}
        strokeDasharray="3 16"
        strokeLinecap="round"
        className="fill-none stroke-border"
      />
      <circle cx={800} cy={164} r={11} className="fill-brand" />
      <circle cx={1036} cy={400} r={8} className="fill-brand/40" />
      <circle cx={564} cy={400} r={8} className="fill-brand/40" />

      {/* skor kesiapan */}
      <Ring cx={800} cy={400} r={150} value={0.78} width={30} />
      <Sparkle cx={800} cy={400} r={66} className="fill-brand/25" />
      <Sparkle cx={706} cy={314} r={18} className="fill-brand/50" />
      <Sparkle cx={894} cy={492} r={14} className="fill-brand/40" />

      {/* kartu saran resume */}
      <Panel x={100} y={190} w={400} h={190} r={24} />
      <Panel x={132} y={222} w={56} h={56} r={16} className="fill-brand/15 stroke-none" />
      <Sparkle cx={160} cy={250} r={17} />
      <SkeletonLine x={208} y={232} w={180} h={14} />
      <SkeletonLine x={208} y={258} w={116} h={10} />
      <SkeletonLines x={132} y={306} w={336} h={10} lines={2} gap={16} tail={0.55} />

      {/* kartu insight terverifikasi */}
      <Panel x={100} y={420} w={400} h={190} r={24} />
      <CheckCircle cx={162} cy={462} r={18} />
      <SkeletonLine x={200} y={455} w={190} h={12} />
      <CheckCircle cx={162} cy={516} r={18} />
      <SkeletonLine x={200} y={509} w={232} h={12} />
      <CheckCircle cx={162} cy={570} r={18} />
      <SkeletonLine x={200} y={563} w={158} h={12} />

      {/* kartu kecocokan pekerjaan */}
      <Panel x={1100} y={190} w={400} h={200} r={24} />
      <Panel x={1132} y={222} w={56} h={56} r={16} className="fill-brand/15 stroke-none" />
      <rect x={1150} y={240} width={20} height={20} rx={6} ry={6} className="fill-brand" />
      <SkeletonLine x={1208} y={232} w={166} h={14} />
      <SkeletonLine x={1208} y={258} w={104} h={10} />
      <Pill x={1382} y={228} w={86} h={24} className="fill-success/20" />
      <Pill x={1132} y={316} w={82} h={26} />
      <Pill x={1226} y={316} w={64} h={26} />
      <Pill x={1302} y={316} w={98} h={26} />

      {/* kartu rekomendasi skill */}
      <Panel x={1100} y={430} w={400} h={290} r={24} />
      <SkeletonLine x={1132} y={464} w={176} h={14} className="fill-muted-foreground/45" />
      <SkeletonLine x={1132} y={518} w={140} h={10} />
      <ProgressTrack x={1132} y={542} w={336} value={0.7} />
      <SkeletonLine x={1132} y={588} w={112} h={10} />
      <ProgressTrack x={1132} y={612} w={336} value={0.45} />
      <SkeletonLine x={1132} y={658} w={158} h={10} />
      <ProgressTrack x={1132} y={682} w={336} value={0.22} />

      {/* pita insight */}
      <Panel x={620} y={636} w={360} h={64} r={32} />
      <Sparkle cx={668} cy={668} r={15} />
      <SkeletonLine x={702} y={662} w={220} h={12} />
    </svg>
  );
}
