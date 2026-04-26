"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowRight, Lightbulb } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { useApplications } from "@/shared/hooks/useApplications";
import { nextBestAction } from "@/shared/lib/nextBestAction";
import { api } from "../../../../../convex/_generated/api";
import { QuickActionsCard } from "./QuickActionsCard";

/**
 * "Aksi Hari Ini" — dashboard rail widget that surfaces ONE prioritized
 * recommendation per user session instead of four static shortcuts.
 *
 * Falls back to the original QuickActionsCard when there's no pressing
 * action (e.g. mature user with everything on track). This keeps the
 * rail useful without ever showing an empty/awkward "you're done" card.
 *
 * Reads from existing hooks — no new Convex queries. Logic lives in
 * shared/lib/nextBestAction.ts (pure, testable).
 */
export function NextActionCard() {
  const { applications } = useApplications();
  const cvList = useQuery(api.cv.queries.getUserCVs);
  const interviews = useQuery(api.mockInterview.queries.getUserInterviews);
  const roadmap = useQuery(api.roadmap.queries.getUserRoadmap);

  // Loading state — render the Quick Actions fallback rather than
  // a skeleton (gets the user something they can click immediately).
  if (
    cvList === undefined ||
    interviews === undefined ||
    roadmap === undefined
  ) {
    return <QuickActionsCard />;
  }

  const cv = cvList?.[0] ?? null;
  const action = nextBestAction({
    applications: applications ?? [],
    cv,
    interviews: interviews ?? [],
    roadmapProgress: roadmap?.progress ?? null,
  });

  if (!action) {
    return <QuickActionsCard />;
  }

  const Icon = action.icon;

  return (
    <Card className="border-brand/30 bg-gradient-to-br from-brand-muted/30 via-background to-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-brand" aria-hidden />
          Aksi Hari Ini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2.5">
          <span
            className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand"
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold leading-tight text-foreground">
              {action.title}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {action.body}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full bg-brand hover:bg-brand">
          <Link href={action.href}>
            {action.ctaLabel}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
