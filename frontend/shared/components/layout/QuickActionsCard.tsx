import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  PRIMARY_NAV,
  MORE_APPS,
  type NavId,
  type NavItem,
} from "./navConfig";

/**
 * Right-rail widget — shortcut tiles to core flows. Items are looked
 * up by id from the navConfig SSoT (PRIMARY_NAV + MORE_APPS), so
 * labels, hrefs, and icons stay in lockstep with the sidebar and
 * bottom nav. Changing the label or URL in navConfig propagates here
 * automatically — no duplicated strings.
 */

const ALL_LOOKUP: ReadonlyArray<NavItem> = [...PRIMARY_NAV, ...MORE_APPS];

/** Default shortcuts shown on DashboardHome. Override via `ids` prop. */
const DEFAULT_IDS: ReadonlyArray<NavId> = ["cv", "checklist", "interview", "roadmap"];

/**
 * Per-id icon chip tint. Decorative only — falls back to neutral for
 * any id we haven't explicitly styled. Kept local because hue is
 * presentation-specific to THIS card; putting hue on every navConfig
 * entry would leak rail-widget concerns into the nav SSoT.
 */
const HUE_BY_ID: Partial<Record<NavId, string>> = {
  cv: "text-brand bg-brand-muted",
  checklist: "text-success bg-success/15",
  interview: "text-warning bg-warning/15",
  roadmap: "text-info bg-info/15",
  calendar: "text-brand bg-brand-muted",
  applications: "text-info bg-info/15",
  portfolio: "text-warning bg-warning/15",
  networking: "text-success bg-success/15",
  matcher: "text-brand bg-brand-muted",
};

const DEFAULT_HUE = "text-foreground bg-muted";

export interface QuickActionsCardProps {
  /** Nav ids to surface. Defaults to CV / Checklist / Interview / Roadmap. */
  ids?: ReadonlyArray<NavId>;
  title?: string;
  className?: string;
}

export function QuickActionsCard({
  ids = DEFAULT_IDS,
  title = "Pintasan Cepat",
  className,
}: QuickActionsCardProps) {
  const items = ids
    .map((id) => ALL_LOOKUP.find((n) => n.id === id))
    .filter((n): n is NavItem => Boolean(n));

  if (items.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const hue = HUE_BY_ID[item.id as NavId] ?? DEFAULT_HUE;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-2 py-2",
                    "hover:bg-muted/60 transition-colors",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-md",
                      hue,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
