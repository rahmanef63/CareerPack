import type { CSSProperties } from "react";
import { cn } from "@/shared/lib/utils";
import { ToolkitFeatureRow } from "./ToolkitFeatureRow";
import type { ToolkitCategory } from "../types/toolkit.types";

interface ToolkitCategoryCardProps {
  category: ToolkitCategory;
  style?: CSSProperties;
}

/** One of the 4 toolkit category cards: icon + title + tagline, feature rows, tinted tip. */
export function ToolkitCategoryCard({ category, style }: ToolkitCategoryCardProps) {
  const Icon = category.icon;
  return (
    <div
      className="animate-on-scroll opacity-0 flex flex-col gap-5 rounded-2xl border border-landing-line bg-landing-card p-6"
      style={style}
    >
      <div>
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm",
            category.chipClassName
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-landing-ink">
          {category.title}
        </h3>
        <p className="mt-1 text-sm text-landing-muted">{category.tagline}</p>
      </div>

      <div className="flex flex-col gap-4 border-t border-landing-line pt-5">
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
