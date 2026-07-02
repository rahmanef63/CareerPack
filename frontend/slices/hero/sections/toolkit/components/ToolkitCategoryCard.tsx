import { cn } from "@/shared/lib/utils";
import { chipIconTextClassName } from "../../../lib/chipContrast";
import { ToolkitFeatureRow } from "./ToolkitFeatureRow";
import type { ToolkitCategory } from "../types/toolkit.types";

interface ToolkitCategoryCardProps {
  category: ToolkitCategory;
}

/** One of the 4 toolkit category cards: icon + title + tagline, feature rows, tinted tip. */
export function ToolkitCategoryCard({ category }: ToolkitCategoryCardProps) {
  const Icon = category.icon;
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        category.hoverBorderClassName
      )}
    >
      <div>
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl shadow-sm",
            chipIconTextClassName(category.chipClassName),
            category.chipClassName
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
          {category.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{category.tagline}</p>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-5">
        {category.features.map((feature) => (
          <ToolkitFeatureRow
            key={feature.id}
            feature={feature}
            chipClassName={category.chipClassName}
          />
        ))}
      </div>

      <p className={cn("mt-auto rounded-xl px-3 py-2.5 text-xs leading-relaxed", category.tipClassName)}>
        {category.tip}
      </p>
    </div>
  );
}
