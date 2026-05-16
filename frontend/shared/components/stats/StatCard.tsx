import type { ElementType, ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

/**
 * Shared KPI / stat card — single source of truth for the
 * "label · big number · tinted icon · optional hint" pattern used on
 * DashboardHome, CareerDashboard, AdminPanel, and future dashboards.
 *
 * Replaces three near-identical local components (StatCard in
 * DashboardHome, StatCard in CareerDashboard, KpiCard in AdminPanel).
 * Each passed icon + label + value + a sub/hint; the only real
 * difference was the tinted icon box — now a `tone` prop.
 *
 * Usage:
 *   <StatCard
 *     icon={Briefcase}
 *     label="Total Lamaran"
 *     value={12}
 *     sub="Naik 20% minggu ini"
 *     tone="sky"
 *   />
 */
export type StatCardTone = "sky" | "violet" | "success" | "warning" | "brand" | "neutral";

const TONE_CLS: Record<StatCardTone, string> = {
  sky: "text-info bg-info/15 dark:bg-info/15 dark:text-info/80",
  violet: "text-brand bg-brand-muted dark:bg-brand-muted dark:text-brand/80",
  success: "text-success bg-success/15 dark:bg-success/15 dark:text-success/80",
  warning: "text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/80",
  brand: "text-brand bg-brand-muted dark:bg-brand-muted dark:text-brand/80",
  neutral: "text-muted-foreground bg-muted",
};

export interface StatCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  /** Secondary text under the value — plain string or JSX. */
  sub?: ReactNode;
  /** Icon chip color. Default = brand. */
  tone?: StatCardTone;
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "brand",
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
        <div className="min-w-0">
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="text-3xl font-bold mt-1 tabular-nums">
            {value}
          </CardTitle>
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            TONE_CLS[tone],
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </CardHeader>
      {sub !== undefined && sub !== null && sub !== "" && (
        <CardContent>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </CardContent>
      )}
    </Card>
  );
}
