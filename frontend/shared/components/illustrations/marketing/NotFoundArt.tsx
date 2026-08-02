import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import { Sheet, SkeletonLine, SkeletonLines } from "../primitives";

/**
 * Halaman 404 — map folder terbuka dengan satu dokumen yang terlepas dan
 * melayang keluar mengikuti jejak putus-putus. Pengganti `marketing/404.webp`
 * (1000×750).
 */
export function NotFoundArt({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1000 750"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      <ellipse cx={430} cy={628} rx={215} ry={22} className="fill-muted-foreground/10" />

      <rect x={214} y={294} width={168} height={64} rx={22} ry={22} className="fill-brand" />
      <rect x={214} y={330} width={392} height={262} rx={24} ry={24} className="fill-brand" />
      <rect x={228} y={372} width={378} height={222} rx={22} ry={22} className="fill-brand-to" />

      <path
        d="M 614 392 C 700 420 780 372 824 306 C 844 276 858 256 866 244"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="2 16"
        className="fill-none stroke-brand/60"
      />
      <circle cx={872} cy={240} r={14} className="fill-brand" />

      <Sheet
        x={548}
        y={126}
        w={238}
        h={256}
        fold={42}
        r={14}
        className="fill-card stroke-border stroke-2"
        foldClassName="fill-brand/30"
      />
      <rect x={578} y={166} width={46} height={46} rx={11} ry={11} className="fill-brand" />
      <SkeletonLine x={638} y={182} w={104} h={12} />
      <SkeletonLines x={578} y={244} w={168} h={10} lines={3} gap={14} tail={0.72} />
      <SkeletonLine x={578} y={326} w={112} h={12} className="fill-brand" />
    </svg>
  );
}
