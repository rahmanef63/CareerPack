import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import {
  Panel,
  Pill,
  Ring,
  SkeletonLine,
  SkeletonLines,
  Sparkle,
} from "../primitives";

/**
 * Hero marketing utama — kolom kiri berisi tanda merek, judul, dan deret fitur;
 * kolom kanan menumpuk kartu produk (CV, lamaran, roadmap, asisten AI,
 * portofolio). Pengganti `marketing/hero.webp` (1600×840).
 */
export function HeroAbstract({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 840"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* Tanda merek */}
      <rect x={64} y={94} width={24} height={36} rx={6} ry={6} className="fill-brand/40" />
      <rect x={96} y={74} width={24} height={56} rx={6} ry={6} className="fill-brand/70" />
      <rect x={128} y={54} width={28} height={76} rx={7} ry={7} className="fill-brand" />
      <SkeletonLine x={178} y={78} w={148} h={24} className="fill-foreground/80" />
      <SkeletonLine x={336} y={78} w={106} h={24} className="fill-brand" />

      {/* Judul + subjudul */}
      <SkeletonLine x={64} y={196} w={590} h={54} className="fill-foreground/85" />
      <SkeletonLine x={64} y={272} w={512} h={54} className="fill-foreground/85" />
      <SkeletonLine x={64} y={348} w={428} h={54} className="fill-brand" />
      <SkeletonLines x={64} y={446} w={468} h={14} lines={2} gap={18} tail={0.78} />

      {/* Deret fitur */}
      <rect x={64} y={536} width={64} height={64} rx={18} ry={18} className="fill-brand/10" />
      <rect x={85} y={552} width={22} height={32} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={64} y={618} w={64} h={9} />

      <rect x={182} y={536} width={64} height={64} rx={18} ry={18} className="fill-brand/10" />
      <rect x={206} y={552} width={16} height={12} rx={4} ry={4} className="fill-brand" />
      <rect x={198} y={562} width={32} height={24} rx={7} ry={7} className="fill-brand" />
      <SkeletonLine x={182} y={618} w={64} h={9} />

      <rect x={300} y={536} width={64} height={64} rx={18} ry={18} className="fill-brand/10" />
      <path
        d="M 316 578 L 330 562 L 340 572 L 356 552"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
      <SkeletonLine x={300} y={618} w={64} h={9} />

      <rect x={418} y={536} width={64} height={64} rx={18} ry={18} className="fill-brand/10" />
      <Sparkle cx={450} cy={568} r={19} />
      <SkeletonLine x={418} y={618} w={64} h={9} />

      <rect x={536} y={536} width={64} height={64} rx={18} ry={18} className="fill-brand/10" />
      <rect x={552} y={550} width={20} height={12} rx={4} ry={4} className="fill-brand" />
      <rect x={552} y={558} width={32} height={26} rx={7} ry={7} className="fill-brand" />
      <SkeletonLine x={536} y={618} w={64} h={9} />

      {/* Bilah klaim AI */}
      <rect x={64} y={690} width={520} height={68} rx={22} ry={22} className="fill-brand/10" />
      <Sparkle cx={104} cy={724} r={16} />
      <SkeletonLine x={140} y={718} w={382} h={12} />

      {/* Kartu CV */}
      <Panel x={724} y={48} w={430} h={452} r={22} />
      <rect x={752} y={74} width={22} height={28} rx={5} ry={5} className="fill-brand/70" />
      <SkeletonLine x={790} y={82} w={162} h={13} className="fill-foreground/55" />
      <Panel x={748} y={122} w={382} h={352} r={16} className="fill-background stroke-border" />
      <rect x={748} y={122} width={382} height={58} rx={16} ry={16} className="fill-brand" />
      <rect x={748} y={152} width={382} height={28} className="fill-brand" />
      <SkeletonLine x={772} y={143} w={168} h={14} className="fill-background/75" />
      <SkeletonLine x={772} y={208} w={86} h={9} className="fill-brand/60" />
      <SkeletonLines x={772} y={230} w={112} h={8} lines={4} gap={12} tail={0.68} />
      <SkeletonLine x={920} y={208} w={86} h={9} className="fill-brand/60" />
      <SkeletonLines x={920} y={230} w={186} h={8} lines={5} gap={12} tail={0.55} />
      <SkeletonLine x={772} y={344} w={86} h={9} className="fill-brand/60" />
      <SkeletonLines x={772} y={366} w={112} h={8} lines={3} gap={12} tail={0.7} />
      <SkeletonLine x={920} y={344} w={86} h={9} className="fill-brand/60" />
      <SkeletonLines x={920} y={366} w={186} h={8} lines={4} gap={12} tail={0.6} />

      {/* Kartu pelacak lamaran */}
      <Panel x={1178} y={48} w={362} h={452} r={22} />
      <rect x={1206} y={76} width={28} height={22} rx={6} ry={6} className="fill-brand/70" />
      <SkeletonLine x={1246} y={80} w={148} h={13} className="fill-foreground/55" />
      <Ring cx={1268} cy={218} r={56} value={0.68} width={18} />
      <circle cx={1368} cy={168} r={7} className="fill-brand" />
      <SkeletonLine x={1386} y={163} w={104} h={10} />
      <circle cx={1368} cy={204} r={7} className="fill-brand/55" />
      <SkeletonLine x={1386} y={199} w={92} h={10} />
      <circle cx={1368} cy={240} r={7} className="fill-warning" />
      <SkeletonLine x={1386} y={235} w={110} h={10} />
      <circle cx={1368} cy={276} r={7} className="fill-success" />
      <SkeletonLine x={1386} y={271} w={78} h={10} />
      <rect x={1206} y={318} width={306} height={2} className="fill-border" />
      <SkeletonLine x={1206} y={350} w={126} h={11} className="fill-foreground/45" />
      <SkeletonLine x={1206} y={372} w={84} h={8} />
      <Pill x={1392} y={348} w={92} h={24} />
      <SkeletonLine x={1206} y={418} w={112} h={11} className="fill-foreground/45" />
      <SkeletonLine x={1206} y={440} w={92} h={8} />
      <Pill x={1392} y={416} w={92} h={24} className="fill-success/20" />

      {/* Kartu roadmap */}
      <Panel x={724} y={530} w={286} h={270} r={22} />
      <path
        d="M 752 574 L 764 560 L 774 570 L 790 552"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
      <SkeletonLine x={806} y={558} w={128} h={13} className="fill-foreground/55" />
      <circle cx={756} cy={630} r={12} className="fill-brand" />
      <SkeletonLine x={782} y={624} w={124} h={10} />
      <Pill x={922} y={620} w={62} h={20} className="fill-success/20" />
      <circle cx={756} cy={684} r={12} className="fill-brand" />
      <SkeletonLine x={782} y={678} w={106} h={10} />
      <Pill x={922} y={674} w={62} h={20} className="fill-success/20" />
      <circle cx={756} cy={738} r={11} strokeWidth={3} className="fill-none stroke-border" />
      <SkeletonLine x={782} y={732} w={132} h={10} />
      <Pill x={922} y={728} w={62} h={20} />

      {/* Kartu asisten AI */}
      <Panel x={1034} y={530} w={254} h={270} r={22} />
      <Sparkle cx={1064} cy={566} r={16} />
      <SkeletonLine x={1090} y={559} w={116} h={13} className="fill-foreground/55" />
      <rect x={1088} y={600} width={172} height={54} rx={14} ry={14} className="fill-brand/10" />
      <SkeletonLines x={1104} y={616} w={140} h={8} lines={2} gap={10} tail={0.7} />
      <rect x={1054} y={670} width={200} height={66} rx={14} ry={14} className="fill-muted-foreground/10" />
      <SkeletonLines x={1070} y={686} w={168} h={8} lines={3} gap={10} tail={0.55} />
      <Panel x={1054} y={752} w={200} h={32} r={16} className="fill-background stroke-border" />
      <rect x={1222} y={758} width={24} height={20} rx={7} ry={7} className="fill-brand" />

      {/* Kartu portofolio */}
      <Panel x={1312} y={530} w={228} h={270} r={22} />
      <rect x={1336} y={554} width={20} height={10} rx={4} ry={4} className="fill-brand/70" />
      <rect x={1336} y={560} width={30} height={22} rx={6} ry={6} className="fill-brand/70" />
      <SkeletonLine x={1378} y={562} w={110} h={13} className="fill-foreground/55" />
      <rect x={1336} y={604} width={180} height={98} rx={12} ry={12} className="fill-brand/20" />
      <rect x={1354} y={628} width={102} height={58} rx={8} ry={8} className="fill-card" />
      <SkeletonLine x={1336} y={720} w={148} h={11} className="fill-foreground/45" />
      <SkeletonLines x={1336} y={744} w={180} h={8} lines={2} gap={10} tail={0.65} />
      <SkeletonLine x={1336} y={784} w={88} h={9} className="fill-brand" />
    </svg>
  );
}
