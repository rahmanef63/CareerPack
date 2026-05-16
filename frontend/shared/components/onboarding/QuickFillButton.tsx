"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/shared/components/ui/button";
import type { QuickFillScope } from "../../../../../convex/onboarding/types";
import { QuickFillDialog } from "./QuickFillDialog";

interface QuickFillButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Override the visible label. Default: "Isi Cepat dengan AI". */
  label?: string;
  /** Hide the icon — useful for compact placements. */
  hideIcon?: boolean;
  /**
   * Force a specific scope (skip pathname auto-detect). Useful when
   * the button is rendered outside the matching dashboard route
   * (e.g. inside a sub-tab that wants `cv` even though pathname is
   * `/dashboard`).
   */
  scope?: QuickFillScope;
  /**
   * Disable the pathname → scope mapping below and always default to
   * "all". Useful for the dashboard home hero where the user picks.
   */
  disableAutoScope?: boolean;
}

/**
 * Maps the active route to the most relevant scope so the dialog
 * opens with the right preset selected. Tested in plain string match
 * order (most-specific first).
 */
function scopeFromPathname(pathname: string | null): QuickFillScope {
  if (!pathname) return "all";
  if (pathname.startsWith("/dashboard/cv")) return "cv";
  if (pathname.startsWith("/dashboard/portfolio")) return "portfolio";
  if (pathname.startsWith("/dashboard/applications")) return "applications";
  if (pathname.startsWith("/dashboard/networking")) return "contacts";
  // Personal Branding + Settings + Profile editor — all map to profile.
  if (pathname.startsWith("/dashboard/personal-branding")) return "profile";
  if (pathname.startsWith("/dashboard/settings")) return "profile";
  // Career goals page (if/when added) would map here. For now goals
  // live inside dashboard-home, so /dashboard root keeps "all".
  return "all";
}

/**
 * Trigger for the Quick Fill flow. Drop in anywhere — page-header
 * `actions`, sidebar, modal trigger. Manages its own dialog state.
 *
 * By default the dialog opens with a scope that matches the active
 * route — e.g. on `/dashboard/cv` the "CV saja" preset is pre-
 * selected. User can change it in step 1 if they want broader fill.
 */
export function QuickFillButton({
  label = "Isi Cepat dengan AI",
  hideIcon = false,
  scope,
  disableAutoScope = false,
  className,
  variant = "default",
  size = "default",
  ...rest
}: QuickFillButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initialScope = useMemo<QuickFillScope>(() => {
    if (scope) return scope;
    if (disableAutoScope) return "all";
    return scopeFromPathname(pathname);
  }, [scope, disableAutoScope, pathname]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
        {...rest}
      >
        {!hideIcon && <Sparkles className="h-4 w-4" />}
        <span>{label}</span>
      </Button>
      <QuickFillDialog
        open={open}
        onOpenChange={setOpen}
        initialScope={initialScope}
      />
    </>
  );
}
