"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Archive, CheckCircle2, History, XCircle } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";

interface PastQuestAction {
  id: string;
  type: string;
  label: string;
  completed: boolean;
}

interface PastQuest {
  _id: Id<"careerQuests">;
  title: string;
  intent: string;
  etaMonths: number;
  status: "active" | "completed" | "abandoned";
  actions: PastQuestAction[];
  createdAt: number;
}

/**
 * Quest history — retrospective view of completed + abandoned quests.
 * Hidden when no past quests exist. Shows last 20 by recency.
 */
export function QuestHistory() {
  const quests = useQuery(api.engine.plan.queries.myQuests, { limit: 20 }) as
    | PastQuest[]
    | undefined;

  const past = useMemo(
    () => (quests ?? []).filter((q) => q.status !== "active"),
    [quests],
  );

  if (!quests || past.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-brand" />
          Riwayat Quest
          <Badge variant="outline" className="ml-1 text-[10px]">
            {past.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Quest yang sudah selesai atau ditinggalkan. Engine pakai
          telemetri ini buat refine prediksi path berikutnya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {past.map((q) => {
          const done = q.actions.filter((a) => a.completed).length;
          const pct = Math.round((done / Math.max(1, q.actions.length)) * 100);
          const isCompleted = q.status === "completed";
          const dateLabel = new Date(q.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <div
              key={q._id}
              className={cn(
                "rounded-md border px-2.5 py-2 text-xs",
                isCompleted
                  ? "border-emerald-300/40 bg-emerald-500/5"
                  : "border-border bg-card/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate font-semibold">{q.title}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[10px] italic text-muted-foreground">
                    &ldquo;{q.intent}&rdquo;
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[9px]",
                    isCompleted
                      ? "border-emerald-300/50 text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground",
                  )}
                >
                  {isCompleted ? "Selesai" : "Abandon"}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>{dateLabel}</span>
                <span>·</span>
                <span>
                  {done}/{q.actions.length} aksi ({pct}%)
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Archive className="h-2.5 w-2.5" />
                  ETA {q.etaMonths} bln
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
