/* eslint-disable @next/next/no-img-element -- brand assets are static SVGs;
   next/image can't optimise SVG (dangerouslyAllowSVG is off in next.config). */
import { cn } from "@/shared/lib/utils";

// Intrinsic viewBox dimensions of the shipped SVGs. Passed as width/height
// attributes so the browser knows the aspect ratio before the file loads
// (no layout shift) while CSS drives the actual height.
const MARK = { w: 675, h: 527 }; // 1.28:1 — NOT square
const LOGO = { w: 1077, h: 212 }; // 5.08:1 lockup

/**
 * Light/dark asset pair. Swap is pure CSS (`darkMode: "class"`), so no
 * theme read in JS and no hydration flicker. The dark twin is
 * aria-hidden with empty alt so screen readers announce the brand once.
 */
function AssetPair({
  light,
  dark,
  box,
  height,
  className,
}: {
  light: string;
  dark: string;
  box: { w: number; h: number };
  height: number;
  className?: string;
}) {
  const style = { height, width: "auto" as const };
  return (
    <>
      <img
        src={light}
        alt="CareerPack"
        width={box.w}
        height={box.h}
        style={style}
        className={cn("block dark:hidden", className)}
      />
      <img
        src={dark}
        alt=""
        aria-hidden="true"
        width={box.w}
        height={box.h}
        style={style}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** CareerPack icon mark. `size` is the HEIGHT — width follows the 1.28:1 ratio. */
export function BrandMark({ size = 22, className }: BrandMarkProps) {
  return (
    <AssetPair
      light="/brand/mark.svg"
      dark="/brand/mark-mono-dark.svg"
      box={MARK}
      height={size}
      className={className}
    />
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Full brand lockup. `size` is the HEIGHT of the lockup (5.08:1 wide).
 * ponytail: no `showText` knob — callers that want the bare icon import
 * `BrandMark` directly.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <AssetPair
      light="/brand/logo.svg"
      dark="/brand/logo-mono-dark.svg"
      box={LOGO}
      height={size}
      className={className}
    />
  );
}
