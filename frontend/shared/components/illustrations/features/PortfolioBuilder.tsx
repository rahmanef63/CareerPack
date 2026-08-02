import { cn } from "@/shared/lib/utils";
import { Avatar, Panel, Pill, SkeletonLine, SkeletonLines } from "../primitives";
import type { IllustrationProps } from "../primitives";

/**
 * Portofolio — kartu profil dan tautan publik di atas, grid karya di bawah.
 * Menggantikan `public/features/portfolio-builder.webp` (1600x900).
 */
export function PortfolioBuilder({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* kartu profil */}
      <Panel x={90} y={90} w={800} h={250} r={28} />
      <circle cx={210} cy={215} r={82} className="fill-brand/15" />
      <Avatar cx={210} cy={188} r={35} />
      <SkeletonLine x={330} y={148} w={290} h={18} className="fill-foreground/55" />
      <SkeletonLine x={330} y={186} w={196} h={11} />
      <SkeletonLine x={330} y={212} w={244} h={11} />
      <rect x={330} y={252} width={520} height={2} className="fill-border" />
      <circle cx={340} cy={292} r={8} className="fill-brand/50" />
      <SkeletonLine x={360} y={286} w={92} h={11} />
      <circle cx={500} cy={292} r={8} className="fill-brand/50" />
      <SkeletonLine x={520} y={286} w={92} h={11} />
      <circle cx={660} cy={292} r={8} className="fill-brand/50" />
      <SkeletonLine x={680} y={286} w={92} h={11} />

      {/* judul + tautan publik */}
      <SkeletonLine x={930} y={116} w={262} h={22} className="fill-foreground/55" />
      <SkeletonLines x={930} y={164} w={520} h={11} lines={2} gap={16} tail={0.62} />
      <Panel x={930} y={240} w={580} h={100} r={24} />
      <circle cx={982} cy={290} r={24} className="fill-brand" />
      <ellipse
        cx={982}
        cy={290}
        rx={9}
        ry={23}
        strokeWidth={2}
        className="fill-none stroke-card"
      />
      <SkeletonLine x={1024} y={282} w={118} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={1170} y={284} w={200} h={11} className="fill-brand/45" />
      <rect x={1440} y={276} width={28} height={28} rx={9} ry={9} className="fill-brand/15" />

      {/* karya 1 */}
      <Panel x={90} y={380} w={460} h={225} r={20} />
      <rect x={106} y={396} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <path d="M 118 514 L 118 442 A 72 72 0 0 1 190 514 Z" className="fill-brand" />
      <circle cx={470} cy={448} r={30} className="fill-brand-to" />
      <SkeletonLine x={106} y={548} w={168} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={106} y={572} w={244} h={9} />
      <Pill x={420} y={556} w={114} h={26} />

      {/* karya 2 */}
      <Panel x={570} y={380} w={460} h={225} r={20} />
      <rect x={586} y={396} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <path d="M 598 514 L 598 408 L 704 514 Z" className="fill-brand/70" />
      <circle cx={900} cy={461} r={42} className="fill-brand-to" />
      <SkeletonLine x={586} y={548} w={146} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={586} y={572} w={216} h={9} />
      <Pill x={900} y={556} w={114} h={26} />

      {/* karya 3 */}
      <Panel x={1050} y={380} w={460} h={225} r={20} />
      <rect x={1066} y={396} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <rect x={1290} y={412} width={148} height={92} rx={10} ry={10} className="fill-brand" />
      <rect
        x={1352}
        y={432}
        width={88}
        height={84}
        rx={10}
        ry={10}
        strokeWidth={2}
        className="fill-card stroke-brand"
      />
      <SkeletonLine x={1066} y={548} w={182} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={1066} y={572} w={228} h={9} />
      <Pill x={1380} y={556} w={114} h={26} />

      {/* karya 4 */}
      <Panel x={90} y={635} w={460} h={225} r={20} />
      <rect x={106} y={651} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <circle cx={210} cy={716} r={48} className="fill-brand" />
      <rect x={300} y={672} width={200} height={90} rx={12} ry={12} className="fill-brand-to" />
      <SkeletonLine x={106} y={803} w={158} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={106} y={827} w={232} h={9} />
      <Pill x={420} y={811} w={114} h={26} />

      {/* karya 5 */}
      <Panel x={570} y={635} w={460} h={225} r={20} />
      <rect x={586} y={651} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <path d="M 598 770 V 730 H 646 V 700 H 694 V 670 H 742 V 770 Z" className="fill-brand/70" />
      <circle cx={920} cy={716} r={40} className="fill-brand-to" />
      <SkeletonLine x={586} y={803} w={174} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={586} y={827} w={206} h={9} />
      <Pill x={900} y={811} w={114} h={26} />

      {/* karya 6 */}
      <Panel x={1050} y={635} w={460} h={225} r={20} />
      <rect x={1066} y={651} width={428} height={130} rx={12} ry={12} className="fill-brand/15" />
      <path d="M 1078 716 A 62 62 0 0 1 1202 716 Z" className="fill-brand" />
      <rect
        x={1300}
        y={676}
        width={150}
        height={80}
        rx={12}
        ry={12}
        className="fill-brand-to"
      />
      <SkeletonLine x={1066} y={803} w={192} h={13} className="fill-muted-foreground/45" />
      <SkeletonLine x={1066} y={827} w={238} h={9} />
      <Pill x={1380} y={811} w={114} h={26} />
    </svg>
  );
}
