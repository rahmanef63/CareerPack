import type { TrustStripItem } from "../types/toolkit.types";

interface TrustStripCellProps {
  item: TrustStripItem;
}

/** One icon + title + description cell inside the bottom trust strip. */
export function TrustStripCell({ item }: TrustStripCellProps) {
  const Icon = item.icon;
  return (
    <div className="group flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-landing-paper-2 text-landing-blue transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-landing-ink">{item.title}</p>
        <p className="text-xs text-landing-muted">{item.description}</p>
      </div>
    </div>
  );
}
