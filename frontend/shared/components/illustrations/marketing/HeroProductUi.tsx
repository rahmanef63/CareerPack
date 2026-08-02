import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";
import {
  Panel,
  Pill,
  ProgressTrack,
  Sheet,
  SkeletonLine,
  SkeletonLines,
  Sparkle,
} from "../primitives";

/**
 * Hero antarmuka produk — satu jendela aplikasi penuh: bilah sisi gelap, bilah
 * atas dengan pencarian, dan lima kartu fitur bernomor.
 * Pengganti `marketing/hero-product-ui.webp` (1600×900).
 */
export function HeroProductUi({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* Dekorasi luar jendela */}
      <Sheet
        x={40}
        y={470}
        w={104}
        h={148}
        fold={30}
        r={8}
        className="fill-none stroke-brand/50 stroke-2"
        foldClassName="fill-brand/15"
      />
      <path
        d="M 34 660 a 5 5 0 1 0 0.1 0 M 66 660 a 5 5 0 1 0 0.1 0 M 98 660 a 5 5 0 1 0 0.1 0 M 130 660 a 5 5 0 1 0 0.1 0 M 34 692 a 5 5 0 1 0 0.1 0 M 66 692 a 5 5 0 1 0 0.1 0 M 98 692 a 5 5 0 1 0 0.1 0 M 130 692 a 5 5 0 1 0 0.1 0 M 34 724 a 5 5 0 1 0 0.1 0 M 66 724 a 5 5 0 1 0 0.1 0 M 98 724 a 5 5 0 1 0 0.1 0 M 130 724 a 5 5 0 1 0 0.1 0"
        className="fill-muted-foreground/25"
      />
      <Sheet
        x={1470}
        y={320}
        w={104}
        h={148}
        fold={30}
        r={8}
        className="fill-none stroke-brand/50 stroke-2"
        foldClassName="fill-brand/15"
      />
      <rect
        x={1478}
        y={500}
        width={96}
        height={96}
        rx={20}
        ry={20}
        strokeWidth={2}
        className="fill-none stroke-border"
      />
      <rect
        x={1450}
        y={548}
        width={96}
        height={96}
        rx={20}
        ry={20}
        strokeWidth={2}
        className="fill-none stroke-brand/40"
      />

      {/* Jendela aplikasi */}
      <Panel x={150} y={52} w={1300} h={796} r={30} />

      {/* Bilah sisi */}
      <rect x={150} y={156} width={200} height={692} rx={30} ry={30} className="fill-brand" />
      <rect x={150} y={156} width={200} height={44} className="fill-brand" />
      <rect x={320} y={156} width={30} height={692} className="fill-brand" />

      {/* Tanda merek */}
      <rect x={182} y={104} width={14} height={22} rx={4} ry={4} className="fill-brand/40" />
      <rect x={200} y={92} width={14} height={34} rx={4} ry={4} className="fill-brand/70" />
      <rect x={218} y={80} width={16} height={46} rx={5} ry={5} className="fill-brand" />
      <SkeletonLine x={246} y={96} w={56} h={16} className="fill-foreground/80" />
      <SkeletonLine x={308} y={96} w={34} h={16} className="fill-brand" />

      {/* Menu bilah sisi */}
      <rect x={166} y={184} width={168} height={46} rx={13} ry={13} className="fill-brand-foreground/25" />
      <rect x={186} y={198} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground" />
      <SkeletonLine x={218} y={202} w={88} h={11} className="fill-brand-foreground/90" />
      <rect x={186} y={256} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground/60" />
      <SkeletonLine x={218} y={260} w={80} h={11} className="fill-brand-foreground/45" />
      <rect x={186} y={310} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground/60" />
      <SkeletonLine x={218} y={314} w={94} h={11} className="fill-brand-foreground/45" />
      <rect x={186} y={364} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground/60" />
      <SkeletonLine x={218} y={368} w={72} h={11} className="fill-brand-foreground/45" />
      <rect x={186} y={418} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground/60" />
      <SkeletonLine x={218} y={422} w={90} h={11} className="fill-brand-foreground/45" />
      <rect x={186} y={472} width={20} height={20} rx={5} ry={5} className="fill-brand-foreground/60" />
      <SkeletonLine x={218} y={476} w={76} h={11} className="fill-brand-foreground/45" />
      <rect x={186} y={522} width={148} height={2} className="fill-brand-foreground/25" />

      {/* Kartu promo di bilah sisi */}
      <rect x={166} y={628} width={168} height={182} rx={18} ry={18} className="fill-brand-foreground/10" />
      <rect x={190} y={664} width={12} height={20} rx={3} ry={3} className="fill-brand-foreground/70" />
      <rect x={208} y={654} width={12} height={30} rx={3} ry={3} className="fill-brand-foreground" />
      <SkeletonLines x={190} y={704} w={116} h={11} lines={3} gap={12} tail={0.62} className="fill-brand-foreground/55" />
      <circle cx={196} cy={780} r={6} className="fill-brand-foreground" />
      <circle cx={216} cy={780} r={6} className="fill-brand-foreground/35" />
      <circle cx={236} cy={780} r={6} className="fill-brand-foreground/35" />

      {/* Bilah atas */}
      <SkeletonLine x={388} y={86} w={182} h={22} className="fill-foreground/70" />
      <SkeletonLine x={388} y={120} w={244} h={11} />
      <Panel x={784} y={86} w={412} h={46} r={23} className="fill-background stroke-border" />
      <circle cx={816} cy={107} r={9} strokeWidth={3} className="fill-none stroke-muted-foreground/60" />
      <SkeletonLine x={838} y={104} w={172} h={10} />
      <rect x={1150} y={97} width={26} height={24} rx={7} ry={7} className="fill-muted" />
      <path
        d="M 1252 118 V 104 A 14 14 0 0 1 1280 104 V 118 H 1288 H 1244 Z"
        strokeWidth={3}
        strokeLinejoin="round"
        className="fill-none stroke-muted-foreground/60"
      />
      <circle cx={1284} cy={92} r={7} className="fill-brand" />
      <circle cx={1348} cy={108} r={27} className="fill-brand" />
      <circle cx={1348} cy={100} r={9} className="fill-brand-foreground" />
      <rect x={1334} y={114} width={28} height={13} rx={6} ry={6} className="fill-brand-foreground" />
      <path
        d="M 1400 102 L 1410 112 L 1420 102"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-none stroke-muted-foreground/60"
      />

      {/* Kartu 1 — CV */}
      <Panel x={388} y={164} w={330} h={332} r={20} />
      <rect x={412} y={188} width={32} height={32} rx={9} ry={9} className="fill-brand" />
      <SkeletonLine x={454} y={196} w={158} h={15} className="fill-foreground/55" />
      <SkeletonLines x={412} y={240} w={278} h={9} lines={2} gap={12} tail={0.62} />
      <Panel x={412} y={292} w={282} h={152} r={14} className="fill-background stroke-border" />
      <rect
        x={430}
        y={308}
        width={94}
        height={120}
        rx={10}
        ry={10}
        strokeWidth={2}
        className="fill-card stroke-brand"
      />
      <circle cx={477} cy={344} r={17} className="fill-brand/25" />
      <SkeletonLines x={444} y={382} w={66} h={7} lines={3} gap={9} tail={0.6} />
      <SkeletonLines x={544} y={314} w={132} h={8} lines={5} gap={12} tail={0.55} />
      <Pill x={412} y={458} w={80} h={26} />
      <Pill x={500} y={458} w={96} h={26} className="fill-muted" />
      <Pill x={604} y={458} w={80} h={26} className="fill-muted" />

      {/* Kartu 2 — pelacak lamaran */}
      <Panel x={738} y={164} w={330} h={332} r={20} />
      <rect x={762} y={188} width={32} height={32} rx={9} ry={9} className="fill-brand" />
      <SkeletonLine x={804} y={196} w={182} h={15} className="fill-foreground/55" />
      <SkeletonLines x={762} y={240} w={278} h={9} lines={2} gap={12} tail={0.72} />
      <Pill x={762} y={292} w={82} h={26} />
      <Pill x={852} y={292} w={82} h={26} className="fill-muted" />
      <Pill x={942} y={292} w={82} h={26} className="fill-success/20" />
      <rect x={762} y={338} width={30} height={30} rx={8} ry={8} className="fill-muted" />
      <SkeletonLine x={802} y={346} w={124} h={10} />
      <Pill x={946} y={340} w={78} h={24} />
      <rect x={762} y={392} width={30} height={30} rx={8} ry={8} className="fill-muted" />
      <SkeletonLine x={802} y={400} w={108} h={10} />
      <Pill x={946} y={394} w={78} h={24} className="fill-success/20" />
      <SkeletonLine x={762} y={456} w={136} h={10} className="fill-brand" />

      {/* Kartu 3 — roadmap */}
      <Panel x={1088} y={164} w={330} h={332} r={20} />
      <rect x={1112} y={188} width={32} height={32} rx={9} ry={9} className="fill-brand" />
      <SkeletonLine x={1154} y={196} w={148} h={15} className="fill-foreground/55" />
      <SkeletonLines x={1112} y={240} w={278} h={9} lines={2} gap={12} tail={0.66} />
      <SkeletonLine x={1112} y={294} w={154} h={11} className="fill-foreground/45" />
      <SkeletonLine x={1300} y={294} w={90} h={11} className="fill-brand" />
      <ProgressTrack x={1112} y={320} w={278} value={0.72} h={10} />
      <circle cx={1126} cy={362} r={14} className="fill-brand" />
      <SkeletonLine x={1152} y={356} w={122} h={10} />
      <SkeletonLine x={1300} y={356} w={90} h={9} />
      <circle cx={1126} cy={404} r={14} className="fill-brand" />
      <SkeletonLine x={1152} y={398} w={104} h={10} />
      <SkeletonLine x={1300} y={398} w={90} h={9} />
      <circle cx={1126} cy={446} r={13} strokeWidth={3} className="fill-none stroke-border" />
      <SkeletonLine x={1152} y={440} w={132} h={10} />
      <SkeletonLine x={1300} y={440} w={90} h={9} />

      {/* Kartu 4 — asisten AI */}
      <Panel x={388} y={516} w={500} h={306} r={20} />
      <rect x={412} y={540} width={32} height={32} rx={9} ry={9} className="fill-brand" />
      <SkeletonLine x={454} y={548} w={186} h={15} className="fill-foreground/55" />
      <Sparkle cx={848} cy={556} r={16} />
      <SkeletonLine x={412} y={592} w={444} h={9} />
      <circle cx={442} cy={654} r={28} className="fill-brand" />
      <Sparkle cx={442} cy={654} r={13} className="fill-brand-foreground" />
      <Panel x={488} y={628} w={368} h={52} r={14} className="fill-background stroke-border" />
      <SkeletonLine x={510} y={649} w={188} h={10} />
      <Pill x={412} y={706} w={112} h={30} className="fill-muted" />
      <Pill x={534} y={706} w={124} h={30} className="fill-muted" />
      <Pill x={668} y={706} w={104} h={30} className="fill-muted" />
      <Panel x={412} y={756} w={444} h={46} r={14} className="fill-background stroke-border" />
      <SkeletonLine x={436} y={774} w={198} h={10} />
      <rect x={798} y={764} width={34} height={30} rx={10} ry={10} className="fill-brand" />

      {/* Kartu 5 — portofolio */}
      <Panel x={908} y={516} w={510} h={306} r={20} />
      <rect x={932} y={540} width={32} height={32} rx={9} ry={9} className="fill-brand" />
      <SkeletonLine x={974} y={548} w={170} h={15} className="fill-foreground/55" />
      <SkeletonLine x={932} y={592} w={420} h={9} />
      <Panel x={932} y={626} w={286} h={176} r={14} className="fill-background stroke-border" />
      <circle cx={952} cy={646} r={5} className="fill-muted-foreground/40" />
      <circle cx={968} cy={646} r={5} className="fill-muted-foreground/40" />
      <circle cx={984} cy={646} r={5} className="fill-muted-foreground/40" />
      <SkeletonLine x={952} y={674} w={104} h={13} className="fill-foreground/55" />
      <SkeletonLine x={952} y={696} w={130} h={13} className="fill-brand" />
      <rect x={952} y={726} width={78} height={60} rx={10} ry={10} className="fill-brand/70" />
      <rect x={1042} y={726} width={78} height={60} rx={10} ry={10} className="fill-brand/25" />
      <rect x={1132} y={726} width={70} height={60} rx={10} ry={10} className="fill-muted" />
      <rect x={1248} y={634} width={20} height={20} rx={5} ry={5} className="fill-brand/60" />
      <SkeletonLine x={1278} y={639} w={116} h={10} />
      <rect x={1248} y={678} width={20} height={20} rx={5} ry={5} className="fill-brand/60" />
      <SkeletonLine x={1278} y={683} w={100} h={10} />
      <rect x={1248} y={722} width={20} height={20} rx={5} ry={5} className="fill-brand/60" />
      <SkeletonLine x={1278} y={727} w={112} h={10} />
      <SkeletonLine x={1248} y={776} w={132} h={11} className="fill-brand" />
    </svg>
  );
}
