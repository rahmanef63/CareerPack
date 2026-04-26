import { cn } from "@/shared/lib/utils";

/**
 * Abstract geometric riff on the Indonesian batik-parang motif —
 * diagonal S-curves repeating on a 48px grid. Rendered as SVG so
 * strokes inherit `currentColor` and blend with theme tokens in any
 * preset. Use on hero backgrounds or empty states for a locally-
 * resonant texture that isn't literal batik.
 *
 * Default opacity is low (8%) — decorative only, never blocks content.
 * Always render `aria-hidden` — this is pure decoration.
 */
export function ParangPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        // Low opacity + currentColor so it takes the brand-tinted hue
        // of wherever it's placed without needing per-use color props.
        "text-brand/30",
        className,
      )}
    >
      <defs>
        <pattern
          id="careerpack-parang"
          x="0"
          y="0"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <path
            d="M0,48 Q24,24 48,0 M0,0 Q24,24 48,48"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#careerpack-parang)" />
    </svg>
  );
}
