import { cn } from "@/shared/lib/utils";
import {
  Avatar,
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
 * Simulasi Wawancara — percakapan tanya-jawab dengan AI di kiri, panel skor
 * kesiapan dan rincian feedback di kanan.
 * Menggantikan `public/features/mock-interview.webp` (1600x900).
 */
export function MockInterview({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* panel percakapan */}
      <Panel x={90} y={110} w={880} h={680} r={28} />

      {/* pertanyaan AI */}
      <circle cx={162} cy={200} r={30} className="fill-brand/15" />
      <Sparkle cx={162} cy={200} r={16} />
      <rect x={210} y={158} width={460} height={132} rx={26} ry={26} className="fill-muted" />
      <SkeletonLines x={242} y={192} w={396} h={11} lines={3} gap={14} tail={0.62} />

      {/* jawaban pengguna */}
      <rect x={430} y={330} width={460} height={112} rx={26} ry={26} className="fill-brand" />
      <SkeletonLines
        x={462}
        y={364}
        w={396}
        h={11}
        lines={2}
        gap={16}
        tail={0.55}
        className="fill-brand-foreground/60"
      />
      <circle cx={930} cy={360} r={30} className="fill-brand/20" />
      <Avatar cx={930} cy={350} r={11} className="fill-brand/70" />

      {/* AI sedang menyusun balasan */}
      <circle cx={162} cy={528} r={30} className="fill-brand/15" />
      <Sparkle cx={162} cy={528} r={16} />
      <rect x={210} y={490} width={230} height={76} rx={26} ry={26} className="fill-muted" />
      <circle cx={258} cy={528} r={9} className="fill-muted-foreground/35" />
      <circle cx={292} cy={528} r={9} className="fill-muted-foreground/35" />
      <circle cx={326} cy={528} r={9} className="fill-muted-foreground/35" />

      {/* kontrol rekaman */}
      <circle cx={438} cy={694} r={28} className="fill-muted" />
      <rect x={428} y={686} width={20} height={16} rx={5} ry={5} className="fill-muted-foreground/50" />
      <circle cx={530} cy={694} r={42} className="fill-brand" />
      <rect x={520} y={666} width={20} height={32} rx={10} ry={10} className="fill-brand-foreground" />
      <path
        d="M 506 690 V 698 A 24 24 0 0 0 554 698 V 690 H 546 V 698 A 16 16 0 0 1 514 698 V 690 Z"
        className="fill-brand-foreground"
      />
      <rect x={526} y={716} width={8} height={12} rx={4} ry={4} className="fill-brand-foreground" />
      <circle cx={622} cy={694} r={28} className="fill-muted" />
      <circle cx={622} cy={694} r={9} className="fill-muted-foreground/50" />

      {/* panel feedback */}
      <Panel x={1030} y={110} w={480} h={680} r={28} />
      <SkeletonLine x={1070} y={150} w={204} h={15} className="fill-muted-foreground/45" />
      <Ring cx={1270} cy={306} r={100} value={0.82} width={26} />
      <SkeletonLine x={1222} y={288} w={96} h={22} className="fill-foreground/55" />
      <SkeletonLine x={1246} y={322} w={48} h={9} />

      <SkeletonLine x={1070} y={464} w={140} h={11} />
      <ProgressTrack x={1070} y={488} w={400} value={0.85} />
      <SkeletonLine x={1070} y={534} w={168} h={11} />
      <ProgressTrack x={1070} y={558} w={400} value={0.8} />
      <SkeletonLine x={1070} y={604} w={124} h={11} />
      <ProgressTrack x={1070} y={628} w={400} value={0.78} />
      <SkeletonLine x={1070} y={674} w={156} h={11} />
      <ProgressTrack x={1070} y={698} w={400} value={0.7} />
      <Pill x={1070} y={734} w={400} h={38} />
    </svg>
  );
}
