import { cn } from "@/shared/lib/utils";
import type { IllustrationProps } from "../primitives";

/**
 * No interview sessions yet — an empty speech bubble wearing a briefcase
 * handle, with the microphone still idle at the bottom.
 */
export function NoInterviews({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 800 600"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {/* briefcase handle riding on top of the bubble */}
      <path
        d="M 340 122 V 94 A 24 24 0 0 1 364 70 H 436 A 24 24 0 0 1 460 94 V 122"
        strokeWidth={9}
        strokeLinecap="round"
        className="fill-none stroke-brand-to"
      />

      {/* empty conversation bubble */}
      <path
        d="M 196 122 H 604 A 36 36 0 0 1 640 158 V 404 A 36 36 0 0 1 604 440 H 340 L 272 510 L 258 440 H 196 A 36 36 0 0 1 160 404 V 158 A 36 36 0 0 1 196 122 Z"
        strokeWidth={7}
        strokeLinejoin="round"
        className="fill-card stroke-brand-to"
      />

      {/* clasp */}
      <rect x={376} y={100} width={48} height={44} rx={12} ry={12} className="fill-brand" />

      {/* idle microphone */}
      <circle cx={400} cy={430} r={86} className="fill-brand/15" />
      <path
        d="M 342 424 A 58 58 0 0 0 458 424"
        strokeWidth={9}
        strokeLinecap="round"
        className="fill-none stroke-brand/70"
      />
      <rect x={372} y={352} width={56} height={112} rx={28} ry={28} className="fill-brand" />
      <rect x={392} y={478} width={16} height={40} rx={8} ry={8} className="fill-brand/70" />
      <rect x={356} y={512} width={88} height={16} rx={8} ry={8} className="fill-brand/70" />
    </svg>
  );
}
