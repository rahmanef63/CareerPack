import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { SkeletonLine, SkeletonLines } from "../primitives";

/**
 * Sampul profil bawaan — sisi kiri sengaja dibiarkan kosong karena foto dan
 * nama pengguna menumpang di sana; klaster objek ringan berkumpul di kanan.
 * Pengganti `profile/cover-default.webp` (1600×500).
 */
export function ProfileCoverDefault({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 500"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <rect x={0} y={0} width={1600} height={500} className="fill-muted/40" />

      {/* Sisi kiri: hanya bentuk lembut */}
      <rect x={-70} y={396} width={258} height={200} rx={100} ry={100} className="fill-muted-foreground/10" />
      <circle cx={212} cy={500} r={26} className="fill-brand/40" />

      {/* Klaster kanan */}
      <path d="M 1340 236 V 78 A 158 158 0 0 1 1498 236 Z" className="fill-brand/55" />
      <rect x={1466} y={236} width={140} height={286} rx={30} ry={30} className="fill-muted-foreground/10" />
      <rect x={838} y={-24} width={176} height={150} rx={14} ry={14} className="fill-brand/60" />

      <path
        d="M 896 156 a 9 9 0 1 0 0.1 0 M 896 194 a 9 9 0 1 0 0.1 0 M 896 232 a 9 9 0 1 0 0.1 0"
        className="fill-foreground/55"
      />
      <path
        d="M 934 156 a 9 9 0 1 0 0.1 0 M 934 194 a 9 9 0 1 0 0.1 0 M 934 232 a 9 9 0 1 0 0.1 0"
        className="fill-brand"
      />
      <path
        d="M 972 156 a 9 9 0 1 0 0.1 0 M 972 194 a 9 9 0 1 0 0.1 0 M 972 232 a 9 9 0 1 0 0.1 0"
        className="fill-muted-foreground/30"
      />

      <rect x={1172} y={382} width={262} height={190} rx={92} ry={92} className="fill-foreground/20" />
      <rect x={1318} y={398} width={48} height={102} rx={9} ry={9} className="fill-brand/70" />
      <rect x={1378} y={352} width={48} height={148} rx={9} ry={9} className="fill-brand" />
      <rect x={1438} y={304} width={48} height={196} rx={9} ry={9} className="fill-foreground/55" />

      <rect x={1032} y={8} width={272} height={402} rx={28} ry={28} className="fill-muted-foreground/10" />
      <rect x={1070} y={56} width={62} height={62} rx={15} ry={15} className="fill-foreground/60" />
      <SkeletonLine x={1156} y={74} w={118} h={13} className="fill-muted-foreground/35" />
      <SkeletonLines x={1070} y={152} w={210} h={10} lines={3} gap={22} tail={0.9} className="fill-muted-foreground/35" />
      <rect x={1220} y={280} width={54} height={54} rx={13} ry={13} className="fill-brand" />

      <path d="M 900 368 A 74 74 0 0 1 900 470 A 74 74 0 0 1 900 368 Z" className="fill-muted-foreground/20" />
      <path d="M 956 360 A 70 70 0 0 1 956 464 A 70 70 0 0 1 956 360 Z" className="fill-foreground/45" />
    </svg>
  );
}
