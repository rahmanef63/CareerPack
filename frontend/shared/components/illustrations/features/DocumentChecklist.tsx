import { cn } from "@/shared/lib/utils";
import { CheckCircle, Panel, Pill, Ring, SkeletonLine } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Ceklis Dokumen — daftar dokumen dengan penanda status di kiri, ringkasan
 * kelengkapan (cincin + legenda) di kanan.
 * Menggantikan `public/features/document-checklist.webp` (1600x900).
 */
export function DocumentChecklist({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* daftar dokumen */}
      <Panel x={90} y={120} w={930} h={660} r={28} />
      <SkeletonLine x={132} y={152} w={210} h={15} className="fill-muted-foreground/45" />
      <Pill x={800} y={146} w={162} h={28} className="fill-muted" />

      <Panel x={132} y={210} w={64} h={64} r={18} className="fill-brand/15 stroke-none" />
      <rect x={152} y={226} width={24} height={32} rx={7} ry={7} className="fill-brand/55" />
      <SkeletonLine x={224} y={220} w={252} h={14} />
      <SkeletonLine x={224} y={248} w={168} h={10} />
      <Pill x={520} y={218} w={78} h={22} />
      <CheckCircle cx={930} cy={242} r={19} />
      <rect x={132} y={302} width={830} height={2} className="fill-border" />

      <Panel x={132} y={328} w={64} h={64} r={18} className="fill-brand/15 stroke-none" />
      <rect x={152} y={344} width={24} height={32} rx={7} ry={7} className="fill-brand/55" />
      <SkeletonLine x={224} y={338} w={196} h={14} />
      <SkeletonLine x={224} y={366} w={230} h={10} />
      <Pill x={520} y={336} w={62} h={22} />
      <CheckCircle cx={930} cy={360} r={19} />
      <rect x={132} y={420} width={830} height={2} className="fill-border" />

      <Panel x={132} y={446} w={64} h={64} r={18} className="fill-brand/15 stroke-none" />
      <rect x={152} y={462} width={24} height={32} rx={7} ry={7} className="fill-brand/55" />
      <SkeletonLine x={224} y={456} w={278} h={14} />
      <SkeletonLine x={224} y={484} w={190} h={10} />
      <Pill x={540} y={454} w={70} h={22} />
      <circle cx={930} cy={478} r={19} className="fill-warning/20" />
      <rect x={926} y={468} width={8} height={14} rx={4} ry={4} className="fill-warning" />
      <circle cx={930} cy={488} r={4} className="fill-warning" />
      <rect x={132} y={538} width={830} height={2} className="fill-border" />

      <Panel x={132} y={564} w={64} h={64} r={18} className="fill-brand/15 stroke-none" />
      <rect x={152} y={580} width={24} height={32} rx={7} ry={7} className="fill-brand/55" />
      <SkeletonLine x={224} y={574} w={214} h={14} />
      <SkeletonLine x={224} y={602} w={148} h={10} />
      <Pill x={520} y={572} w={84} h={22} />
      <CheckCircle cx={930} cy={596} r={19} />
      <rect x={132} y={656} width={830} height={2} className="fill-border" />

      <Panel x={132} y={682} w={64} h={64} r={18} className="fill-brand/15 stroke-none" />
      <rect x={152} y={698} width={24} height={32} rx={7} ry={7} className="fill-brand/55" />
      <SkeletonLine x={224} y={692} w={240} h={14} />
      <SkeletonLine x={224} y={720} w={176} h={10} />
      <Pill x={520} y={690} w={66} h={22} />
      <circle cx={930} cy={714} r={19} className="fill-destructive/15" />
      <path
        d="M 922 706 L 938 722 M 938 706 L 922 722"
        strokeWidth={3}
        strokeLinecap="round"
        className="fill-none stroke-destructive"
      />

      {/* ringkasan kelengkapan */}
      <Panel x={1080} y={120} w={430} h={360} r={28} />
      <SkeletonLine x={1120} y={158} w={190} h={14} className="fill-muted-foreground/45" />
      <Ring cx={1295} cy={312} r={98} value={0.67} width={26} />
      <SkeletonLine x={1247} y={294} w={96} h={22} className="fill-foreground/55" />
      <SkeletonLine x={1271} y={328} w={48} h={9} />

      {/* legenda status */}
      <Panel x={1080} y={510} w={430} h={270} r={28} />
      <circle cx={1122} cy={566} r={10} className="fill-success" />
      <SkeletonLine x={1148} y={560} w={152} h={12} />
      <SkeletonLine x={1398} y={561} w={72} h={10} />
      <circle cx={1122} cy={626} r={10} className="fill-warning" />
      <SkeletonLine x={1148} y={620} w={188} h={12} />
      <SkeletonLine x={1398} y={621} w={72} h={10} />
      <circle cx={1122} cy={686} r={10} className="fill-destructive" />
      <SkeletonLine x={1148} y={680} w={126} h={12} />
      <SkeletonLine x={1398} y={681} w={72} h={10} />
      <rect x={1112} y={722} width={366} height={2} className="fill-border" />
      <SkeletonLine x={1112} y={742} w={104} h={12} className="fill-muted-foreground/45" />
      <SkeletonLine x={1374} y={742} w={104} h={12} className="fill-muted-foreground/45" />
    </svg>
  );
}
