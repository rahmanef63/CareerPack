import { cn } from "@/shared/lib/utils";
import { BarCluster, Folder, Panel, SkeletonLines } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Panduan portofolio — kisi enam kartu karya (tata letak, grafik, gambar,
 * kode, statistik, berkas) dengan lencana tautan berbagi di kartu terakhir.
 */
export function PortfolioGuide({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 450"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <Panel x={153} y={65} w={150} h={150} r={14} />
      <rect x={175} y={88} width={106} height={14} rx={7} ry={7} className="fill-brand" />
      <rect x={175} y={112} width={48} height={42} rx={8} ry={8} className="fill-brand" />
      <rect
        x={233}
        y={112}
        width={48}
        height={42}
        rx={8}
        ry={8}
        strokeWidth={2.5}
        className="fill-none stroke-border"
      />
      <SkeletonLines x={175} y={165} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <Panel x={325} y={65} w={150} h={150} r={14} />
      <circle cx={400} cy={118} r={38} className="fill-brand/25" />
      <path d="M 400 118 L 400 80 A 38 38 0 0 1 438 118 Z" className="fill-brand" />
      <SkeletonLines x={347} y={165} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <Panel x={497} y={65} w={150} h={150} r={14} />
      <rect
        x={519}
        y={88}
        width={106}
        height={68}
        rx={10}
        ry={10}
        strokeWidth={2.5}
        className="fill-none stroke-border"
      />
      <path d="M 528 148 L 556 116 L 578 140 L 594 126 L 616 148 Z" className="fill-brand" />
      <circle cx={602} cy={106} r={9} className="fill-brand" />
      <SkeletonLines x={519} y={165} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <Panel x={153} y={235} w={150} h={150} r={14} />
      <path
        d="M 200 268 L 178 296 L 200 324"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
      <path
        d="M 256 268 L 278 296 L 256 324"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-brand"
      />
      <path
        d="M 236 262 L 220 330"
        strokeWidth={7}
        strokeLinecap="round"
        className="fill-none stroke-brand"
      />
      <SkeletonLines x={175} y={335} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <Panel x={325} y={235} w={150} h={150} r={14} />
      <BarCluster x={356} baseline={326} bars={3} barWidth={20} gap={14} height={68} />
      <SkeletonLines x={347} y={335} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <Panel x={497} y={235} w={150} h={150} r={14} className="fill-card stroke-brand" />
      <Folder x={530} y={262} w={88} h={68} r={12} />
      <SkeletonLines x={519} y={335} w={106} h={8} lines={2} gap={10} tail={0.65} />

      <circle cx={634} cy={340} r={40} className="fill-brand" />
      <g transform="rotate(-35 634 340)">
        <rect
          x={608}
          y={330}
          width={32}
          height={20}
          rx={10}
          ry={10}
          strokeWidth={5}
          className="fill-none stroke-card"
        />
        <rect
          x={628}
          y={330}
          width={32}
          height={20}
          rx={10}
          ry={10}
          strokeWidth={5}
          className="fill-none stroke-card"
        />
      </g>
    </svg>
  );
}
