import { ArrowUpRight, type Briefcase } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

type Tone = "sky" | "violet" | "emerald" | "amber";

const TONE_CLS: Record<Tone, string> = {
  sky: "text-info bg-info/20 dark:bg-info/20 dark:text-brand/80",
  violet: "text-brand bg-accent dark:bg-accent dark:text-brand/80",
  emerald:
    "text-success bg-success/20 dark:bg-success/20 dark:text-success/80",
  amber: "text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/80",
};

export function StatCard({
  icon: Icon, label, value, tone, sub,
}: {
  icon: typeof Briefcase;
  label: string;
  value: number | string;
  tone: Tone;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription className="text-xs">{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl font-bold tabular-nums">
            {value}
          </CardTitle>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            TONE_CLS[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      {sub && (
        <CardContent className="flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpRight className="h-3 w-3" /> {sub}
        </CardContent>
      )}
    </Card>
  );
}
