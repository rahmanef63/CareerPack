import { cn } from "@/shared/lib/utils";

/**
 * Shared SVG primitive kit for the inline illustration set.
 *
 * Every illustration under `illustrations/<group>/` is an inline React `<svg>`
 * (never a file in `public/`) so that the OKLCH theme tokens on `:root` / `.dark`
 * reach it — a `.svg` loaded through `<img>` is an isolated document and CSS
 * custom properties do not cross that boundary.
 *
 * ponytail: no gradients, filters, masks, clipPaths, patterns or `<use>` anywhere
 * in this kit or its consumers. Every one of those needs an `id`, and ~30 inlined
 * SVGs on a single page means id collisions that silently repaint the wrong shape.
 * Depth comes from flat fills at varied alpha (fill-brand, fill-brand/40,
 * fill-brand/15) and rounded corners come from rx/ry, not clipPath.
 *
 * ponytail: no `<text>` either. Baked-in glyphs cannot be translated and this app
 * ships Indonesian copy — that is exactly why several source rasters had to be
 * crop-hacked. Skeleton "text" is rounded bars, see {@link SkeletonLine}.
 *
 * Colour rule: tokens only, via Tailwind `fill-*` / `stroke-*` utilities. Never a
 * hex, never `rgb()`/`hsl()`, never a `dark:` variant — the tokens already flip.
 *
 * Every primitive here renders **SVG child elements**. They only work inside an
 * `<svg>` root; rendering one standalone in HTML produces nothing visible.
 */

/** Props every illustration component takes — the whole public surface. */
export interface IllustrationProps {
  className?: string;
}

/** Geometry shared by the rectangular primitives. */
interface BoxProps {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

interface PanelProps extends BoxProps {
  /** Corner radius. House style: 8–24. */
  r?: number;
  /** Retints the panel. Carries both fill and stroke, e.g. `"fill-brand stroke-none"`. */
  className?: string;
}

/**
 * Rounded card / panel — the base surface of the UI-flavoured illustrations.
 * Must be rendered inside an `<svg>`.
 */
export function Panel({ x, y, w, h, r = 16, className }: PanelProps) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={r}
      ry={r}
      strokeWidth={2}
      className={cn("fill-card stroke-border", className)}
    />
  );
}

interface SheetProps extends BoxProps {
  /** Size of the dog-eared top-right corner. */
  fold?: number;
  r?: number;
  /** Retints the sheet body. */
  className?: string;
  /** Retints the folded corner flap. */
  foldClassName?: string;
}

/**
 * Document sheet with a folded top-right corner — CV, dokumen, surat.
 * Must be rendered inside an `<svg>`.
 */
export function Sheet({
  x,
  y,
  w,
  h,
  fold = 34,
  r = 12,
  className,
  foldClassName,
}: SheetProps) {
  const body = [
    `M ${x + r} ${y}`,
    `H ${x + w - fold}`,
    `L ${x + w} ${y + fold}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V ${y + r}`,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    "Z",
  ].join(" ");
  const flap = `M ${x + w - fold} ${y} L ${x + w} ${y + fold} H ${x + w - fold} Z`;

  return (
    <g>
      <path d={body} strokeWidth={2} className={cn("fill-card stroke-border", className)} />
      <path d={flap} className={cn("fill-brand/35 stroke-none", foldClassName)} />
    </g>
  );
}

interface FolderProps extends BoxProps {
  r?: number;
  /** Retints the folder body (the front face). */
  className?: string;
  /** Retints the tab peeking out behind. */
  tabClassName?: string;
}

/**
 * Folder — tab behind, body in front.
 *
 * ponytail: two overlapping rects instead of one notched path. The tab's bottom
 * rounding is simply covered by the body, which is cheaper to read and to edit
 * than an eight-command silhouette.
 *
 * Must be rendered inside an `<svg>`.
 */
export function Folder({ x, y, w, h, r = 16, className, tabClassName }: FolderProps) {
  const tabW = w * 0.42;
  const tabH = h * 0.2;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={tabW}
        height={tabH + r * 2}
        rx={r}
        ry={r}
        className={cn("fill-brand/45", tabClassName)}
      />
      <rect
        x={x}
        y={y + tabH}
        width={w}
        height={h - tabH}
        rx={r}
        ry={r}
        className={cn("fill-brand", className)}
      />
    </g>
  );
}

interface BriefcaseProps extends BoxProps {
  r?: number;
  /** Retints the case body. */
  className?: string;
  /** Retints the handle. Stroke-based, so pass `stroke-*` (keep `fill-none`). */
  handleClassName?: string;
}

/**
 * Briefcase — the recurring CareerPack motif (kontak, roadmap, agenda, portofolio).
 * Hand-rolling it per illustration guarantees six different briefcases; this is
 * the one that keeps them a family. Must be rendered inside an `<svg>`.
 */
export function Briefcase({
  x,
  y,
  w,
  h,
  r = 18,
  className,
  handleClassName,
}: BriefcaseProps) {
  const handleW = w * 0.3;
  const handleH = h * 0.28;
  const handleX = x + (w - handleW) / 2;
  const handleR = 12;
  const bodyY = y + handleH;
  const bodyH = h - handleH;

  const handle = [
    `M ${handleX} ${bodyY}`,
    `V ${y + handleR}`,
    `A ${handleR} ${handleR} 0 0 1 ${handleX + handleR} ${y}`,
    `H ${handleX + handleW - handleR}`,
    `A ${handleR} ${handleR} 0 0 1 ${handleX + handleW} ${y + handleR}`,
    `V ${bodyY}`,
  ].join(" ");

  return (
    <g>
      <path
        d={handle}
        strokeWidth={8}
        strokeLinecap="round"
        className={cn("fill-none stroke-brand", handleClassName)}
      />
      <rect
        x={x}
        y={bodyY}
        width={w}
        height={bodyH}
        rx={r}
        ry={r}
        className={cn("fill-brand", className)}
      />
      <rect
        x={x + w / 2 - w * 0.06}
        y={bodyY + bodyH * 0.32}
        width={w * 0.12}
        height={bodyH * 0.24}
        rx={5}
        ry={5}
        className="fill-card"
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Content stand-ins                                                   */
/* ------------------------------------------------------------------ */

interface SkeletonLineProps {
  x: number;
  y: number;
  w: number;
  /** Bar thickness; the pill radius is derived from it. */
  h?: number;
  className?: string;
}

/**
 * One line of stand-in copy — a rounded bar, never a glyph.
 * Must be rendered inside an `<svg>`.
 */
export function SkeletonLine({ x, y, w, h = 10, className }: SkeletonLineProps) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={h / 2}
      ry={h / 2}
      className={cn("fill-muted-foreground/25", className)}
    />
  );
}

interface SkeletonLinesProps extends SkeletonLineProps {
  /** How many bars to stack. */
  lines?: number;
  /** Vertical space between bars (not the pitch — pitch is `h + gap`). */
  gap?: number;
  /** Width of the final bar as a fraction of `w`, so the block reads as a paragraph. */
  tail?: number;
}

/**
 * A stacked paragraph of {@link SkeletonLine}s.
 *
 * ponytail: takes a `lines` NUMBER, not an array of widths. The illustration
 * bodies must stay static trees for the comparison-artifact extractor, and an
 * inline array literal is an expression. Mapping over a number inside the
 * primitive keeps the expression on this side of the boundary.
 *
 * Must be rendered inside an `<svg>`.
 */
export function SkeletonLines({
  x,
  y,
  w,
  h = 10,
  lines = 3,
  gap = 14,
  tail = 0.6,
  className,
}: SkeletonLinesProps) {
  return (
    <g>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine
          key={i}
          x={x}
          y={y + i * (h + gap)}
          w={i === lines - 1 && lines > 1 ? w * tail : w}
          h={h}
          className={className}
        />
      ))}
    </g>
  );
}

interface AvatarProps {
  cx: number;
  /** Centre of the head, not of the whole figure. */
  cy: number;
  /** Head radius; shoulders are derived from it. */
  r: number;
  className?: string;
}

/**
 * Person mark — head disc plus a shoulder dome. `className` tints both
 * (they inherit `fill` from the group). Must be rendered inside an `<svg>`.
 */
export function Avatar({ cx, cy, r, className }: AvatarProps) {
  const half = r * 1.05;
  const top = cy + r * 1.35;
  const bottom = top + r * 1.3;

  return (
    <g className={cn("fill-brand", className)}>
      <circle cx={cx} cy={cy} r={r} />
      <path
        d={`M ${cx - half} ${bottom} V ${top + half} A ${half} ${half} 0 0 1 ${cx + half} ${top + half} V ${bottom} Z`}
      />
    </g>
  );
}

interface PillProps {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
}

/**
 * Chip / tag / badge — skill chips, status labels, filter pills.
 * Must be rendered inside an `<svg>`.
 */
export function Pill({ x, y, w, h = 22, className }: PillProps) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={h / 2}
      ry={h / 2}
      className={cn("fill-brand/15", className)}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Status & progress                                                   */
/* ------------------------------------------------------------------ */

interface CheckProps {
  cx: number;
  cy: number;
  /** Width of the tick's bounding box. */
  size?: number;
  className?: string;
}

/**
 * Bare checkmark stroke. Must be rendered inside an `<svg>`.
 */
export function Check({ cx, cy, size = 20, className }: CheckProps) {
  const s = size / 2;

  return (
    <path
      d={`M ${cx - s} ${cy} L ${cx - s * 0.25} ${cy + s * 0.72} L ${cx + s} ${cy - s * 0.72}`}
      strokeWidth={Math.max(2, size * 0.16)}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("fill-none stroke-success", className)}
    />
  );
}

interface CheckCircleProps {
  cx: number;
  cy: number;
  r?: number;
  /** Retints the disc behind the tick. */
  className?: string;
  /** Retints the tick itself; pass `stroke-*`. */
  checkClassName?: string;
}

/**
 * Checklist marker — tinted disc with a tick, the form every checklist raster uses.
 * Must be rendered inside an `<svg>`.
 */
export function CheckCircle({
  cx,
  cy,
  r = 16,
  className,
  checkClassName,
}: CheckCircleProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className={cn("fill-success/15", className)} />
      <Check cx={cx} cy={cy} size={r * 1.05} className={checkClassName} />
    </g>
  );
}

interface ProgressTrackProps {
  x: number;
  y: number;
  w: number;
  /** 0–1, clamped. */
  value: number;
  h?: number;
  /** Retints the filled portion — the dominant shape. */
  className?: string;
  /** Retints the empty track behind it. */
  trackClassName?: string;
}

/**
 * Horizontal progress bar — roadmap milestones, kelengkapan dokumen, feedback scores.
 * Must be rendered inside an `<svg>`.
 */
export function ProgressTrack({
  x,
  y,
  w,
  value,
  h = 8,
  className,
  trackClassName,
}: ProgressTrackProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h / 2}
        ry={h / 2}
        className={cn("fill-muted", trackClassName)}
      />
      <rect
        x={x}
        y={y}
        width={w * clamp01(value)}
        height={h}
        rx={h / 2}
        ry={h / 2}
        className={cn("fill-brand", className)}
      />
    </g>
  );
}

interface RingProps {
  cx: number;
  cy: number;
  r: number;
  /** 0–1, clamped. Sweeps clockwise from 12 o'clock. */
  value: number;
  /** Ring thickness. */
  width?: number;
  /** Retints the swept arc. Pass `stroke-*`; keep `fill-none`. */
  className?: string;
  /** Retints the unswept track. */
  trackClassName?: string;
}

/**
 * Donut gauge — skor ATS, kesiapan, persentase kelengkapan.
 *
 * ponytail: the arc is a full circle with `strokeDasharray`, not a computed
 * elliptical-arc path. Dasharray is a plain attribute — no `id`, no `<defs>` —
 * and the sweep stays correct at any radius without arc-flag arithmetic.
 *
 * Must be rendered inside an `<svg>`.
 */
export function Ring({
  cx,
  cy,
  r,
  value,
  width = 14,
  className,
  trackClassName,
}: RingProps) {
  const circumference = 2 * Math.PI * r;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={width}
        className={cn("fill-none stroke-muted", trackClassName)}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={width}
        strokeDasharray={`${circumference * clamp01(value)} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        className={cn("fill-none stroke-brand", className)}
      />
    </g>
  );
}

/**
 * ponytail: decorative bar heights come from this fixed table rather than an
 * array prop — see the note on {@link SkeletonLines}. These charts are texture,
 * never data, so one house rhythm cycled across every cluster is the point.
 */
const BAR_RATIOS = [0.45, 0.8, 0.6, 1, 0.68, 0.9, 0.55];

interface BarClusterProps {
  x: number;
  /** Y of the baseline the bars grow upward from. */
  baseline: number;
  bars?: number;
  barWidth?: number;
  gap?: number;
  /** Height of the tallest bar. */
  height?: number;
  className?: string;
}

/**
 * Bar-chart cluster — statistik, insight, tren. `className` tints every bar
 * (they inherit `fill` from the group). Must be rendered inside an `<svg>`.
 */
export function BarCluster({
  x,
  baseline,
  bars = 5,
  barWidth = 18,
  gap = 12,
  height = 90,
  className,
}: BarClusterProps) {
  return (
    <g className={cn("fill-brand", className)}>
      {Array.from({ length: bars }, (_, i) => {
        const barHeight = height * BAR_RATIOS[i % BAR_RATIOS.length];
        return (
          <rect
            key={i}
            x={x + i * (barWidth + gap)}
            y={baseline - barHeight}
            width={barWidth}
            height={barHeight}
            rx={4}
            ry={4}
          />
        );
      })}
    </g>
  );
}

interface SparkleProps {
  cx: number;
  cy: number;
  /** Distance from centre to each of the four points. */
  r: number;
  className?: string;
}

/**
 * Four-point sparkle — the AI motif (Asisten AI, saran AI, pencocokan).
 * Must be rendered inside an `<svg>`.
 */
export function Sparkle({ cx, cy, r, className }: SparkleProps) {
  const waist = r * 0.28;
  const d = [
    `M ${cx} ${cy - r}`,
    `Q ${cx + waist} ${cy - waist} ${cx + r} ${cy}`,
    `Q ${cx + waist} ${cy + waist} ${cx} ${cy + r}`,
    `Q ${cx - waist} ${cy + waist} ${cx - r} ${cy}`,
    `Q ${cx - waist} ${cy - waist} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");

  return <path d={d} className={cn("fill-brand", className)} />;
}
