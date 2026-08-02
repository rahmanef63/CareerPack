import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Edge-faded infinite marquee. Pure CSS — no hooks, no measurement, no deps,
 * so it stays a Server Component and costs nothing on the client.
 *
 * Pauses on hover and on focus-within (see `.marquee-root` in App.css), and
 * degrades to a plain horizontally-scrollable row under
 * `prefers-reduced-motion: reduce`.
 *
 * SPACING RULE — read before touching the markup:
 * put horizontal padding on each individual TILE (`px-3` on the child), never
 * a `gap-*` on the track or on a copy wrapper. The loop works because
 * translateX(-50%) equals exactly one copy's width; a gap between the two copy
 * wrappers adds width the -50% doesn't account for, and the strip visibly jumps
 * once per cycle.
 *
 * ponytail: CSS-only, no IntersectionObserver pause — an offscreen marquee
 * still burns compositor frames. Add one only if a profile says it matters.
 */
export interface MarqueeProps {
  children: React.ReactNode;
  /** seconds for one full pass. default 45 */
  durationSec?: number;
  /** scroll left-to-right instead of right-to-left */
  reverse?: boolean;
  className?: string;
}

// Fade both ends into the section background so tiles enter/leave without a
// hard clip. Inline rather than a utility because Tailwind 3 has no mask-image
// scale and the two prefixed properties must stay in sync.
const EDGE_FADE =
  "linear-gradient(to right, transparent, black 6%, black 94%, transparent)";

export function Marquee({
  children,
  durationSec = 45,
  reverse,
  className,
}: MarqueeProps): React.JSX.Element {
  return (
    <div className={cn("marquee-root relative", className)}>
      <div
        className="marquee-viewport overflow-hidden"
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
      >
        {/* w-max so the track sizes to its content, not the viewport —
            otherwise -50% would be half the *viewport* and the seam drifts. */}
        <div
          className={cn(
            "flex w-max will-change-transform",
            reverse ? "animate-marquee-reverse" : "animate-marquee",
          )}
          style={
            { "--marquee-duration": `${durationSec}s` } as React.CSSProperties
          }
        >
          {/* Exactly two copies. Copy #2 is the one scrolling into view as
              copy #1 leaves; at -50% they swap places pixel-for-pixel, which
              is why neither wrapper may carry a gap. */}
          <div className="flex shrink-0 items-center">{children}</div>
          <div className="flex shrink-0 items-center" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
