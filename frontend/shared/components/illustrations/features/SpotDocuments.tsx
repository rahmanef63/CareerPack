import { cn } from "@/shared/lib/utils";
import { Briefcase, CheckCircle, Folder, Sheet, Sparkle, SkeletonLine } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Periksa Dokumen — lembar ceklis di depan, koper karier di kiri, map dokumen
 * dan kaca pembesar di kanan.
 * Menggantikan `public/features/spot-documents.webp` (900x711).
 */
export function SpotDocuments({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 900 711"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* koper karier */}
      <Briefcase
        x={48}
        y={352}
        w={236}
        h={272}
        className="fill-brand-to"
        handleClassName="fill-none stroke-brand-to"
      />

      {/* busur dekoratif */}
      <path
        d="M 686 192 A 156 156 0 0 1 826 336"
        strokeWidth={6}
        strokeDasharray="2 18"
        strokeLinecap="round"
        className="fill-none stroke-border"
      />
      <Sparkle cx={736} cy={268} r={36} />

      {/* lembar ceklis */}
      <Sheet x={236} y={24} w={390} h={616} fold={76} r={20} />
      <rect x={316} y={112} width={34} height={42} rx={10} ry={10} className="fill-brand-to" />
      <rect x={356} y={88} width={34} height={66} rx={10} ry={10} className="fill-brand/60" />
      <rect x={396} y={64} width={38} height={90} rx={10} ry={10} className="fill-brand" />
      <SkeletonLine x={316} y={194} w={196} h={12} className="fill-brand" />

      <CheckCircle cx={336} cy={282} r={27} className="fill-brand" checkClassName="stroke-brand-foreground" />
      <SkeletonLine x={388} y={270} w={200} h={13} />
      <SkeletonLine x={388} y={296} w={140} h={11} />

      <CheckCircle cx={336} cy={372} r={27} className="fill-brand" checkClassName="stroke-brand-foreground" />
      <SkeletonLine x={388} y={360} w={200} h={13} />
      <SkeletonLine x={388} y={386} w={116} h={11} />

      <CheckCircle
        cx={336}
        cy={462}
        r={27}
        className="fill-muted"
        checkClassName="stroke-muted-foreground/60"
      />
      <SkeletonLine x={388} y={450} w={158} h={13} />
      <SkeletonLine x={388} y={476} w={96} h={11} />

      <SkeletonLine x={316} y={548} w={170} h={12} />

      {/* dokumen mengintip dari map */}
      <rect
        x={676}
        y={372}
        width={152}
        height={128}
        rx={14}
        ry={14}
        strokeWidth={2}
        className="fill-muted stroke-border"
      />
      <SkeletonLine x={700} y={400} w={104} h={10} />
      <SkeletonLine x={700} y={422} w={76} h={10} />

      {/* map dokumen */}
      <Folder x={560} y={430} w={270} h={210} r={18} />

      {/* kaca pembesar */}
      <circle
        cx={628}
        cy={548}
        r={76}
        strokeWidth={14}
        className="fill-card stroke-brand-to"
      />
      <Sparkle cx={628} cy={548} r={30} />
      <path
        d="M 682 602 L 748 668"
        strokeWidth={22}
        strokeLinecap="round"
        className="fill-none stroke-brand-to"
      />
    </svg>
  );
}
