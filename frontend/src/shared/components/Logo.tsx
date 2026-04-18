"use client";

import { cn } from "@/shared/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * CareerPack brand mark — target ring pierced by an upward arrow.
 * Reads as: target + on-point + progress / upward trajectory.
 */
export function BrandMark({
  size = 22,
  className,
  stroke = "currentColor",
  strokeWidth = 2.4,
}: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="12" />
      <circle cx="16" cy="16" r="6.5" />
      <path d="M7 25 L22 10" />
      <path d="M22 10 L15 10 M22 10 L22 17" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  showText?: boolean;
  text?: string;
  variant?: "gradient" | "solid";
  className?: string;
}

/**
 * Brand lockup: gradient tile with mark + optional wordmark.
 * `variant="gradient"` uses the sky→violet diagonal that the design
 * system applies to all primary brand surfaces.
 */
export function Logo({
  size = 32,
  showText = true,
  text = "CareerPack",
  variant = "gradient",
  className,
}: LogoProps) {
  const tileBg =
    variant === "gradient"
      ? "bg-gradient-to-br from-sky-500 to-indigo-500"
      : "bg-sky-600";
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "rounded-xl flex items-center justify-center text-white shadow-md",
          tileBg
        )}
        style={{
          width: size,
          height: size,
          boxShadow: "0 10px 24px -8px rgba(14,165,233,0.4)",
        }}
      >
        <BrandMark size={size * 0.6} stroke="#fff" strokeWidth={2.4} />
      </span>
      {showText && (
        <span
          className="font-extrabold text-foreground tracking-tight"
          style={{ fontSize: size * 0.55, letterSpacing: "-0.02em" }}
        >
          {text}
        </span>
      )}
    </div>
  );
}
