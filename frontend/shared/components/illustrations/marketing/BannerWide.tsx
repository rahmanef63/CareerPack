import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import {
  Briefcase,
  CheckCircle,
  Panel,
  Sheet,
  SkeletonLine,
  SkeletonLines,
} from "../primitives";

/**
 * Pita lebar untuk kepala halaman — deretan objek CareerPack (map, dokumen,
 * koper, kartu profil, berkas terverifikasi) berdiri di satu garis dasar.
 * Pengganti `marketing/banner-wide.webp` (1800×562).
 */
export function BannerWide({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1800 562"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* Bentuk latar yang tenang */}
      <path d="M 640 498 A 262 262 0 0 1 1164 498 Z" className="fill-muted/60" />
      <path d="M 1408 498 A 186 186 0 0 1 1780 498 Z" className="fill-muted/50" />
      <rect x={80} y={362} width={140} height={136} rx={36} ry={36} className="fill-muted/60" />
      <path
        d="M 100 214 a 5 5 0 1 0 0.1 0 M 140 214 a 5 5 0 1 0 0.1 0 M 180 214 a 5 5 0 1 0 0.1 0 M 220 214 a 5 5 0 1 0 0.1 0 M 100 254 a 5 5 0 1 0 0.1 0 M 140 254 a 5 5 0 1 0 0.1 0 M 180 254 a 5 5 0 1 0 0.1 0 M 220 254 a 5 5 0 1 0 0.1 0 M 100 294 a 5 5 0 1 0 0.1 0 M 140 294 a 5 5 0 1 0 0.1 0 M 180 294 a 5 5 0 1 0 0.1 0 M 220 294 a 5 5 0 1 0 0.1 0"
        className="fill-muted-foreground/25"
      />
      <rect x={60} y={496} width={1680} height={3} rx={1.5} ry={1.5} className="fill-border" />

      {/* Map + dokumen di dalamnya */}
      <rect x={252} y={252} width={150} height={58} rx={20} ry={20} className="fill-brand-to" />
      <rect x={252} y={282} width={336} height={216} rx={24} ry={24} className="fill-brand-to" />
      <Sheet
        x={330}
        y={158}
        w={182}
        h={176}
        fold={32}
        r={12}
        className="fill-card stroke-border stroke-2"
        foldClassName="fill-brand/20"
      />
      <rect
        x={356}
        y={190}
        width={34}
        height={34}
        rx={8}
        ry={8}
        strokeWidth={3}
        className="fill-none stroke-brand"
      />
      <SkeletonLine x={402} y={200} w={72} h={9} />
      <SkeletonLines x={356} y={248} w={132} h={8} lines={3} gap={11} tail={0.7} />
      <rect
        x={262}
        y={330}
        width={340}
        height={168}
        rx={24}
        ry={24}
        strokeWidth={3}
        className="fill-card stroke-brand"
      />

      {/* Koper */}
      <Briefcase
        x={478}
        y={362}
        w={190}
        h={136}
        r={18}
        className="fill-card stroke-foreground/70 stroke-2"
        handleClassName="fill-none stroke-foreground/70"
      />
      <rect x={562} y={432} width={24} height={26} rx={7} ry={7} className="fill-brand" />

      {/* Kartu profil */}
      <Panel x={700} y={266} w={380} h={184} r={22} />
      <circle cx={752} cy={318} r={26} className="fill-muted" />
      <SkeletonLines x={798} y={300} w={176} h={10} lines={2} gap={14} tail={0.86} />
      <SkeletonLine x={798} y={346} w={112} h={11} className="fill-brand" />
      <circle cx={780} cy={418} r={6} className="fill-brand" />
      <circle cx={802} cy={418} r={6} className="fill-muted-foreground/30" />
      <circle cx={824} cy={418} r={6} className="fill-muted-foreground/20" />

      {/* Berkas terverifikasi */}
      <Sheet
        x={1140}
        y={110}
        w={300}
        h={388}
        fold={64}
        r={10}
        className="fill-card stroke-brand stroke-2"
        foldClassName="fill-brand/20"
      />
      <rect x={1180} y={170} width={56} height={56} rx={13} ry={13} className="fill-brand" />
      <SkeletonLines x={1180} y={264} w={218} h={10} lines={2} gap={20} tail={0.82} />
      <SkeletonLine x={1180} y={336} w={118} h={11} className="fill-brand" />
      <SkeletonLines x={1180} y={378} w={146} h={10} lines={2} gap={20} tail={0.78} />
      <CheckCircle
        cx={1376}
        cy={440}
        r={34}
        className="fill-card stroke-border stroke-2"
        checkClassName="stroke-brand"
      />

      {/* Kartu palet warna */}
      <Panel x={1486} y={226} w={176} h={64} r={18} />
      <rect x={1508} y={243} width={30} height={30} rx={8} ry={8} className="fill-brand-to" />
      <rect x={1546} y={243} width={30} height={30} rx={8} ry={8} className="fill-brand" />
      <rect x={1584} y={243} width={30} height={30} rx={8} ry={8} className="fill-muted" />
      <rect x={1622} y={243} width={30} height={30} rx={8} ry={8} className="fill-muted-foreground/60" />
    </svg>
  );
}
