import { cn } from "@/shared/lib/utils";
import {
  Check,
  Panel,
  Pill,
  Ring,
  Sheet,
  Sparkle,
  SkeletonLine,
  SkeletonLines,
} from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Generator CV — lembar CV di tengah, kartu saran AI di kiri (terhubung garis
 * putus-putus), skor ATS + pilihan template di kanan.
 * Menggantikan `public/features/cv-generator.webp` (1600x900).
 */
export function CvGenerator({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* penghubung saran ke lembar CV */}
      <path
        d="M 420 245 Q 502 245 552 302"
        strokeWidth={2}
        strokeDasharray="6 10"
        strokeLinecap="round"
        className="fill-none stroke-brand/50"
      />
      <path
        d="M 420 445 Q 502 445 552 466"
        strokeWidth={2}
        strokeDasharray="6 10"
        strokeLinecap="round"
        className="fill-none stroke-brand/50"
      />
      <path
        d="M 420 645 Q 502 645 552 622"
        strokeWidth={2}
        strokeDasharray="6 10"
        strokeLinecap="round"
        className="fill-none stroke-brand/50"
      />
      <circle cx={552} cy={302} r={7} className="fill-brand" />
      <circle cx={552} cy={466} r={7} className="fill-brand" />
      <circle cx={552} cy={622} r={7} className="fill-brand" />

      {/* saran AI 1 */}
      <Panel x={90} y={170} w={330} h={150} r={20} />
      <Panel x={118} y={198} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <Sparkle cx={142} cy={222} r={15} />
      <SkeletonLine x={182} y={206} w={148} h={12} />
      <SkeletonLine x={182} y={230} w={104} h={9} />
      <SkeletonLines x={118} y={266} w={274} h={9} lines={2} gap={12} tail={0.6} />
      <circle cx={410} cy={188} r={14} className="fill-brand" />

      {/* saran AI 2 */}
      <Panel x={90} y={370} w={330} h={150} r={20} />
      <Panel x={118} y={398} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <SkeletonLine x={130} y={412} w={24} h={7} className="fill-brand" />
      <SkeletonLine x={130} y={428} w={24} h={7} className="fill-brand" />
      <SkeletonLine x={182} y={406} w={148} h={12} />
      <SkeletonLine x={182} y={430} w={116} h={9} />
      <SkeletonLines x={118} y={466} w={274} h={9} lines={2} gap={12} tail={0.6} />
      <circle cx={410} cy={388} r={14} className="fill-brand" />

      {/* saran AI 3 */}
      <Panel x={90} y={570} w={330} h={150} r={20} />
      <Panel x={118} y={598} w={48} h={48} r={14} className="fill-brand/15 stroke-none" />
      <path d="M 128 622 L 142 614 L 156 622 L 142 630 Z" className="fill-brand" />
      <SkeletonLine x={182} y={606} w={148} h={12} />
      <SkeletonLine x={182} y={630} w={92} h={9} />
      <SkeletonLines x={118} y={666} w={274} h={9} lines={2} gap={12} tail={0.6} />
      <circle cx={410} cy={588} r={14} className="fill-brand" />

      {/* lembar CV */}
      <Sheet x={560} y={70} w={470} h={760} fold={62} r={20} />
      <rect x={596} y={106} width={398} height={124} rx={16} ry={16} className="fill-brand" />
      <SkeletonLine x={676} y={140} w={238} h={18} className="fill-brand-foreground/85" />
      <SkeletonLine x={726} y={174} w={138} h={11} className="fill-brand-foreground/55" />

      <circle cx={612} cy={284} r={12} className="fill-brand" />
      <SkeletonLine x={640} y={276} w={124} h={15} className="fill-muted-foreground/45" />
      <SkeletonLines x={640} y={314} w={354} h={9} lines={3} gap={13} tail={0.72} />

      <circle cx={612} cy={432} r={12} className="fill-brand" />
      <SkeletonLine x={640} y={424} w={98} h={15} className="fill-muted-foreground/45" />
      <Pill x={640} y={462} w={118} h={26} />
      <Pill x={772} y={462} w={94} h={26} />
      <Pill x={880} y={462} w={114} h={26} />
      <Pill x={640} y={502} w={100} h={26} />
      <Pill x={754} y={502} w={126} h={26} />

      <circle cx={612} cy={600} r={12} className="fill-brand" />
      <SkeletonLine x={640} y={592} w={132} h={15} className="fill-muted-foreground/45" />
      <SkeletonLines x={640} y={630} w={354} h={9} lines={2} gap={13} tail={0.56} />
      <rect x={640} y={702} width={354} height={2} className="fill-border" />
      <SkeletonLines x={640} y={728} w={354} h={9} lines={2} gap={13} tail={0.45} />

      {/* skor ATS */}
      <Panel x={1090} y={70} w={420} h={380} r={28} />
      <SkeletonLine x={1206} y={112} w={188} h={15} className="fill-muted-foreground/45" />
      <Ring cx={1300} cy={252} r={98} value={0.92} width={24} />
      <SkeletonLine x={1252} y={234} w={96} h={22} className="fill-foreground/55" />
      <SkeletonLine x={1276} y={268} w={48} h={9} />
      <Pill x={1214} y={386} w={172} h={34} className="fill-success/15" />
      <Check cx={1246} cy={403} size={18} />
      <SkeletonLine x={1268} y={398} w={102} h={10} className="fill-success/50" />

      {/* pilihan template */}
      <Panel x={1090} y={490} w={128} h={340} r={20} />
      <rect x={1104} y={504} width={100} height={56} rx={12} ry={12} className="fill-brand" />
      <SkeletonLines x={1106} y={586} w={96} h={7} lines={4} gap={12} tail={0.6} />

      <Panel x={1236} y={490} w={128} h={340} r={20} />
      <rect x={1250} y={504} width={100} height={56} rx={12} ry={12} className="fill-brand/55" />
      <SkeletonLines x={1252} y={586} w={96} h={7} lines={4} gap={12} tail={0.6} />

      <Panel x={1382} y={490} w={128} h={340} r={20} />
      <rect
        x={1396}
        y={504}
        width={100}
        height={56}
        rx={12}
        ry={12}
        className="fill-muted-foreground/45"
      />
      <SkeletonLines x={1398} y={586} w={96} h={7} lines={4} gap={12} tail={0.6} />
    </svg>
  );
}
