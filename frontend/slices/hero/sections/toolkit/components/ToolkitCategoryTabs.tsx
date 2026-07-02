import { cn } from "@/shared/lib/utils";
import { chipIconTextClassName } from "../../../lib/chipContrast";
import type { ToolkitCategory } from "../types/toolkit.types";

interface ToolkitCategoryTabsProps {
  categories: ToolkitCategory[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

/** Pill row that switches which toolkit category's full detail is shown
 * below, instead of rendering all 4 categories expanded at once. */
export function ToolkitCategoryTabs({ categories, activeIndex, onSelect }: ToolkitCategoryTabsProps) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {categories.map((category, index) => {
        const Icon = category.icon;
        const isActive = index === activeIndex;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(index)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150",
              isActive
                ? cn("border-transparent shadow-sm", chipIconTextClassName(category.chipClassName), category.chipClassName)
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {category.title}
          </button>
        );
      })}
    </div>
  );
}
