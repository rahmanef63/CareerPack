import Link from "next/link";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { chipIconTextClassName } from "../../../lib/chipContrast";
import type { ToolkitFeature } from "../types/toolkit.types";

interface ToolkitFeatureRowProps {
  feature: ToolkitFeature;
  /** Category accent applied to this row's icon chip + AI badge. */
  chipClassName: string;
}

/**
 * One feature line inside a category card: icon chip + real label + authored
 * description. Links to the feature's real dashboard route (RouteGuard sends
 * anonymous visitors to /login, same as every other CTA on this page).
 */
export function ToolkitFeatureRow({ feature, chipClassName }: ToolkitFeatureRowProps) {
  const Icon = feature.icon;
  const chipTextClassName = chipIconTextClassName(chipClassName);
  return (
    <Link
      href={feature.href}
      className="group flex items-start gap-3 rounded-lg -m-1 p-1 transition-colors duration-150 hover:bg-background"
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          chipTextClassName,
          chipClassName
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-foreground group-hover:underline">
            {feature.label}
          </span>
          {feature.badge && (
            <Badge
              variant="secondary"
              className={cn(
                "h-auto shrink-0 border-transparent px-1.5 py-0 text-[9px] font-bold",
                chipTextClassName,
                chipClassName
              )}
            >
              {feature.badge}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
      </div>
    </Link>
  );
}
