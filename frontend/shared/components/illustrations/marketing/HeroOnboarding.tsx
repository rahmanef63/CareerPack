import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import {
  Briefcase,
  Panel,
  Sheet,
  SkeletonLine,
  SkeletonLines,
  Sparkle,
} from "../primitives";

/**
 * Hero onboarding — sambutan di kiri, pratinjau dasbor di tengah, kartu roadmap
 * dan asisten AI di kanan, serta alur langkah putus-putus di bawah.
 * Pengganti `marketing/hero-onboarding.webp` (1600×900).
 */
export function HeroOnboarding({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* Tanda merek */}
      <rect x={76} y={50} width={30} height={18} rx={6} ry={6} className="fill-brand" />
      <rect x={60} y={66} width={62} height={62} rx={18} ry={18} className="fill-brand" />
      <rect x={78} y={82} width={26} height={32} rx={7} ry={7} className="fill-card" />
      <SkeletonLine x={138} y={84} w={116} h={24} className="fill-foreground/80" />
      <SkeletonLine x={262} y={84} w={84} h={24} className="fill-brand" />

      {/* Judul + subjudul + tombol ajakan */}
      <SkeletonLine x={64} y={250} w={300} h={46} className="fill-foreground/85" />
      <SkeletonLine x={64} y={314} w={332} h={46} className="fill-brand" />
      <SkeletonLines x={64} y={396} w={290} h={13} lines={2} gap={16} tail={0.6} />
      <rect x={64} y={464} width={288} height={70} rx={22} ry={22} className="fill-brand" />
      <Sparkle cx={106} cy={499} r={15} className="fill-card" />
      <SkeletonLine x={138} y={492} w={186} h={14} className="fill-card" />

      {/* Tekstur titik dekoratif */}
      <path
        d="M 70 634 a 5 5 0 1 0 0.1 0 M 108 634 a 5 5 0 1 0 0.1 0 M 146 634 a 5 5 0 1 0 0.1 0 M 184 634 a 5 5 0 1 0 0.1 0 M 70 672 a 5 5 0 1 0 0.1 0 M 108 672 a 5 5 0 1 0 0.1 0 M 146 672 a 5 5 0 1 0 0.1 0 M 184 672 a 5 5 0 1 0 0.1 0 M 70 710 a 5 5 0 1 0 0.1 0 M 108 710 a 5 5 0 1 0 0.1 0 M 146 710 a 5 5 0 1 0 0.1 0 M 184 710 a 5 5 0 1 0 0.1 0"
        className="fill-muted-foreground/25"
      />

      {/* Dasbor */}
      <Panel x={470} y={60} w={760} h={580} r={26} />
      <rect x={470} y={60} width={84} height={580} rx={26} ry={26} className="fill-brand" />
      <rect x={530} y={60} width={24} height={580} className="fill-brand" />
      <rect x={496} y={88} width={32} height={32} rx={9} ry={9} className="fill-brand-foreground/70" />
      <rect x={488} y={150} width={48} height={44} rx={13} ry={13} className="fill-brand-foreground/25" />
      <rect x={502} y={162} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground" />
      <rect x={496} y={218} width={32} height={28} rx={8} ry={8} className="fill-brand-foreground/30" />
      <rect x={496} y={272} width={32} height={28} rx={8} ry={8} className="fill-brand-foreground/30" />
      <rect x={496} y={326} width={32} height={28} rx={8} ry={8} className="fill-brand-foreground/30" />

      <SkeletonLine x={590} y={94} w={232} h={22} className="fill-foreground/70" />
      <SkeletonLine x={590} y={130} w={178} h={11} />

      <Panel x={590} y={170} w={612} h={192} r={18} className="fill-background stroke-border" />
      <SkeletonLine x={614} y={192} w={118} h={11} className="fill-foreground/50" />
      <Panel x={614} y={218} w={128} h={120} r={16} />
      <rect x={666} y={236} width={26} height={32} rx={7} ry={7} className="fill-brand" />
      <SkeletonLines x={640} y={282} w={76} h={10} lines={2} gap={12} tail={0.7} />
      <Panel x={762} y={218} w={128} h={120} r={16} />
      <rect x={812} y={240} width={30} height={24} rx={7} ry={7} className="fill-brand" />
      <SkeletonLines x={788} y={282} w={76} h={10} lines={2} gap={12} tail={0.7} />
      <Panel x={910} y={218} w={128} h={120} r={16} />
      <circle cx={974} cy={252} r={16} strokeWidth={5} className="fill-none stroke-brand" />
      <SkeletonLines x={936} y={282} w={76} h={10} lines={2} gap={12} tail={0.7} />
      <Panel x={1058} y={218} w={128} h={120} r={16} />
      <rect x={1108} y={240} width={30} height={24} rx={7} ry={7} className="fill-brand" />
      <SkeletonLines x={1084} y={282} w={76} h={10} lines={2} gap={12} tail={0.7} />

      <Panel x={590} y={380} w={382} h={238} r={18} className="fill-background stroke-border" />
      <SkeletonLine x={614} y={402} w={126} h={11} className="fill-foreground/50" />
      <rect x={614} y={436} width={18} height={22} rx={4} ry={4} className="fill-brand/45" />
      <rect x={614} y={486} width={18} height={22} rx={4} ry={4} className="fill-brand/45" />
      <rect x={614} y={536} width={18} height={22} rx={4} ry={4} className="fill-brand/45" />
      <SkeletonLines x={644} y={442} w={172} h={10} lines={3} gap={40} tail={0.82} />
      <SkeletonLine x={614} y={584} w={132} h={10} className="fill-brand" />

      {/* Kartu roadmap */}
      <Panel x={1250} y={140} w={310} h={250} r={22} />
      <SkeletonLine x={1276} y={166} w={122} h={13} className="fill-foreground/55" />
      <circle cx={1294} cy={214} r={18} className="fill-brand/15" />
      <SkeletonLines x={1326} y={202} w={172} h={9} lines={2} gap={12} tail={0.78} />
      <circle cx={1294} cy={272} r={18} className="fill-brand/15" />
      <SkeletonLines x={1326} y={260} w={172} h={9} lines={2} gap={12} tail={0.64} />
      <circle cx={1294} cy={330} r={18} className="fill-brand/15" />
      <SkeletonLines x={1326} y={318} w={172} h={9} lines={2} gap={12} tail={0.72} />

      {/* Kartu asisten AI */}
      <Panel x={1150} y={430} w={410} h={200} r={22} className="fill-brand-muted stroke-brand/25" />
      <SkeletonLine x={1178} y={458} w={128} h={14} className="fill-brand" />
      <Sparkle cx={1326} cy={465} r={12} />
      <SkeletonLines x={1178} y={496} w={192} h={9} lines={3} gap={12} tail={0.68} />
      <rect x={1178} y={566} width={162} height={40} rx={20} ry={20} className="fill-card" />
      <SkeletonLine x={1206} y={582} w={106} h={10} className="fill-brand" />
      <Panel x={1408} y={482} w={104} h={92} r={28} />
      <circle cx={1434} cy={524} r={11} className="fill-brand" />
      <circle cx={1486} cy={524} r={11} className="fill-brand" />
      <rect x={1456} y={462} width={8} height={22} rx={4} ry={4} className="fill-border" />

      {/* Alur langkah */}
      <path
        d="M 352 542 C 320 592 296 640 288 676 M 302 728 C 380 788 442 732 486 712 M 562 706 C 622 692 666 708 724 702 M 802 688 C 862 676 918 670 964 654 M 1040 616 C 1064 600 1082 586 1098 572"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="2 14"
        className="fill-none stroke-brand/45"
      />
      <path d="M 1078 560 L 1112 566 L 1088 594 Z" className="fill-brand/45" />

      <circle cx={262} cy={716} r={40} strokeWidth={3} className="fill-card stroke-brand/50" />
      <circle cx={262} cy={706} r={13} className="fill-brand" />
      <path d="M 250 713 L 274 713 L 262 734 Z" className="fill-brand" />
      <SkeletonLines x={196} y={776} w={132} h={10} lines={3} gap={12} tail={0.72} />

      <circle cx={522} cy={704} r={40} strokeWidth={3} className="fill-card stroke-border" />
      <rect x={504} y={682} width={18} height={12} rx={4} ry={4} className="fill-brand" />
      <rect x={504} y={692} width={36} height={26} rx={7} ry={7} className="fill-brand" />
      <SkeletonLines x={456} y={764} w={132} h={10} lines={3} gap={12} tail={0.66} />

      <circle cx={762} cy={690} r={40} strokeWidth={3} className="fill-card stroke-border" />
      <circle cx={762} cy={690} r={17} strokeWidth={5} className="fill-none stroke-brand" />
      <circle cx={762} cy={690} r={5} className="fill-brand" />
      <SkeletonLines x={696} y={750} w={132} h={10} lines={3} gap={12} tail={0.74} />

      <circle cx={1002} cy={640} r={40} strokeWidth={3} className="fill-card stroke-border" />
      <rect x={988} y={614} width={28} height={13} rx={5} ry={5} className="fill-brand" />
      <rect x={982} y={625} width={40} height={30} rx={9} ry={9} className="fill-brand" />
      <SkeletonLines x={936} y={700} w={132} h={10} lines={3} gap={12} tail={0.6} />

      {/* Kelompok objek kanan bawah */}
      <Briefcase
        x={1164}
        y={702}
        w={206}
        h={168}
        r={20}
        className="fill-muted-foreground/20"
        handleClassName="fill-none stroke-muted-foreground/30"
      />
      <Sheet
        x={1334}
        y={734}
        w={152}
        h={136}
        fold={26}
        r={10}
        className="fill-card stroke-border stroke-2"
        foldClassName="fill-brand/25"
      />
      <SkeletonLines x={1358} y={776} w={104} h={8} lines={3} gap={12} tail={0.6} />
    </svg>
  );
}
