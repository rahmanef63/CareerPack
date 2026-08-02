import { cn } from "@/shared/lib/utils";

/**
 * Narrative progress indicator — a tiny walking character moves
 * along a dashed timeline as the user's score climbs. Four milestone
 * dots (25/50/75/100) fill in as passed. At 100 the walker strikes a
 * small celebration pose.
 *
 * Replaces the generic progress bar on the CV score card + anywhere
 * else we want to make progress feel like a journey. Pure SVG, uses
 * currentColor + theme tokens — no external lib, no canvas.
 *
 * Accessibility: the whole block is role="progressbar" with aria-*
 * attributes; the walker itself is aria-hidden decoration.
 */
export interface ProgressWalkerProps {
  value: number;        // 0..100
  label?: string;       // a11y label
  className?: string;
}

export function ProgressWalker({
  value,
  label = "Kelengkapan",
  className,
}: ProgressWalkerProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const celebrating = clamped >= 100;
  // Horizontal space: 24px padding each side, 352px travel on a
  // 400-wide viewBox.
  const x = 24 + 3.52 * clamped;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full", className)}
    >
      <svg
        viewBox="0 0 400 60"
        className="block w-full h-12 text-brand"
        aria-hidden
      >
        {/* Dashed timeline track */}
        <line
          x1="24"
          y1="40"
          x2="376"
          y2="40"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 5"
          opacity="0.35"
        />

        {/* Filled portion */}
        <line
          x1="24"
          y1="40"
          x2={x}
          y2="40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transition: "all 600ms cubic-bezier(0.2,0.8,0.25,1)" }}
        />

        {/* Milestone dots */}
        {[25, 50, 75, 100].map((m) => {
          const dotX = 24 + 3.52 * m;
          const reached = clamped >= m;
          return (
            <circle
              key={m}
              cx={dotX}
              cy="40"
              r="3.5"
              fill={reached ? "currentColor" : "oklch(var(--border))"}
              stroke={reached ? "currentColor" : "oklch(var(--muted-foreground))"}
              strokeWidth="1"
              style={{ transition: "fill 300ms" }}
            />
          );
        })}

        {/* Walker — stylized stick figure, head + torso + stride legs */}
        <g
          transform={`translate(${x}, 40)`}
          style={{ transition: "transform 600ms cubic-bezier(0.2,0.8,0.25,1)" }}
        >
          {/* Ground shadow */}
          <ellipse cx="0" cy="2" rx="7" ry="1.4" fill="currentColor" opacity="0.18" />
          {/* Head */}
          <circle cx="0" cy="-20" r="4" fill="currentColor" />
          {/* Torso */}
          <line
            x1="0"
            y1="-16"
            x2="0"
            y2="-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {celebrating ? (
            // Arms up — celebration
            <>
              <line x1="0" y1="-12" x2="-5" y2="-20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="0" y1="-12" x2="5" y2="-20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              {/* Legs planted */}
              <line x1="0" y1="-5" x2="-3" y2="0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="3" y2="0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              {/* Spark */}
              <text x="0" y="-28" textAnchor="middle" fontSize="10" fill="currentColor">
                🎉
              </text>
            </>
          ) : (
            // Arms swinging, legs mid-stride
            <>
              <line x1="0" y1="-12" x2="-4" y2="-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="0" y1="-12" x2="4" y2="-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="-4" y2="0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="0" y1="-5" x2="3" y2="-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
