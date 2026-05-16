import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Optional icon shown above the title. */
  icon?: LucideIcon;
  /** Primary headline (e.g. "Belum ada lamaran"). */
  title: string;
  /** Optional supporting copy below the title. */
  description?: React.ReactNode;
  /** Optional CTA button (e.g. "Tambah lamaran"). */
  action?: EmptyStateAction;
  /** Tone the visual padding/density to context. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PAD: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "py-6 px-4 gap-2",
  md: "py-10 px-6 gap-3",
  lg: "py-16 px-8 gap-4",
};

const ICON_SIZE: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

/**
 * Single SSOT for the "Belum ada …" empty-state pattern. Replaces
 * 48+ inline copies across slices, each with bespoke wrapping.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        PAD[size],
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={cn("text-muted-foreground", ICON_SIZE[size])}
          aria-hidden="true"
        />
      ) : null}
      <h3 className={cn(
        "font-medium",
        size === "sm" ? "text-sm" : "text-base",
      )}>
        {title}
      </h3>
      {description ? (
        <p className={cn(
          "text-muted-foreground max-w-md",
          size === "sm" ? "text-xs" : "text-sm",
        )}>
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          type="button"
          size={size === "sm" ? "sm" : "default"}
          onClick={action.onClick}
          className="mt-2"
        >
          {action.icon ? <action.icon className="w-4 h-4" /> : null}
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
