"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  CompassIcon as Compass,
  Loader2,
  Sparkles,
  Target,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { Progress } from "@/shared/components/ui/progress";
import { notify } from "@/shared/lib/notify";
import { makeIdempotencyKey } from "@/shared/lib/idempotencyKey";
import { cn } from "@/shared/lib/utils";

interface QuestAction {
  id: string;
  type: string;
  label: string;
  payload?: unknown;
  completed: boolean;
  completedAt?: number;
}

interface ActiveQuest {
  _id: Id<"careerQuests">;
  title: string;
  intent: string;
  etaMonths: number;
  targetNodeSlug?: string;
  status: "active" | "completed" | "abandoned";
  actions: QuestAction[];
  createdAt: number;
}

const TYPE_LABELS: Record<string, string> = {
  study_skill: "Belajar skill",
  add_roadmap_node: "Tambah roadmap",
  tailor_cv: "Tailor CV",
  subscribe_listings: "Pantau lowongan",
  set_calendar_block: "Blok kalender",
  report_outcome: "Lapor hasil",
  prepare_documents: "Siapkan dokumen",
  generic: "Aksi",
};

/**
 * Action type → dashboard route. Quest's "Jalankan" button uses this
 * to navigate the user into the slice that owns the action. Returns
 * null for action types with no automatic landing target (generic).
 */
function routeForActionType(type: string): string | null {
  switch (type) {
    case "tailor_cv":
    case "subscribe_listings":
      return "/dashboard/matcher";
    case "add_roadmap_node":
    case "study_skill":
    case "report_outcome":
      return "/dashboard/skill-roadmap";
    case "set_calendar_block":
      return "/dashboard/calendar";
    case "prepare_documents":
      return "/dashboard/document-checklist";
    case "generic":
    default:
      return null;
  }
}

/**
 * Build deep-link query string from a payload, when it has a known
 * shape per action type. Defensive — payload is `unknown` because
 * the LLM may emit anything; we only forward keys we recognize.
 */
function payloadQueryString(type: string, payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const p = payload as Record<string, unknown>;
  const parts: string[] = [];
  const push = (k: string, v: unknown) => {
    if (typeof v === "string" && v.trim().length > 0) {
      parts.push(`${k}=${encodeURIComponent(v.trim())}`);
    }
  };
  switch (type) {
    case "study_skill":
    case "add_roadmap_node":
      push("skill", p.skill);
      push("node", p.nodeSlug ?? p.slug);
      break;
    case "tailor_cv":
      push("cvId", p.cvId);
      push("jobId", p.jobListingId ?? p.jobId);
      break;
    case "subscribe_listings":
      push("q", p.query ?? p.q);
      break;
    case "prepare_documents":
      push("country", p.country);
      break;
    case "set_calendar_block":
      push("title", p.title);
      break;
    default:
      break;
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/**
 * Career Quest panel — Phase 3 surface.
 *
 * Compose user intent → controlled-vocab DAG of cross-slice actions
 * via the constrained plan compiler. The user works through actions
 * as a checklist; engine refines its predictions from completion
 * telemetry (Phase 4 integration follows).
 */
export function QuestPanel({ targetNodeSlug }: { targetNodeSlug?: string }) {
  const router = useRouter();
  const quest = useQuery(api.engine.plan.queries.myActiveQuest, {}) as
    | ActiveQuest
    | null
    | undefined;
  const compile = useAction(api.engine.plan.actions.compile);
  const createQuest = useMutation(api.engine.plan.mutations.createQuest);
  const toggleAction = useMutation(api.engine.plan.mutations.toggleAction);
  const setStatus = useMutation(api.engine.plan.mutations.setStatus);

  const [intent, setIntent] = useState("");
  const [compiling, setCompiling] = useState(false);

  const handleCompile = async () => {
    if (intent.trim().length < 8) {
      notify.validation("Niat terlalu pendek (min 8 karakter)");
      return;
    }
    setCompiling(true);
    try {
      const plan = await compile({
        intent: intent.trim(),
        targetNodeSlug,
        idempotencyKey: makeIdempotencyKey("plan", [intent.trim(), targetNodeSlug]),
      });
      await createQuest({
        title: plan.title,
        intent: intent.trim(),
        etaMonths: plan.etaMonths,
        targetNodeSlug,
        actions: plan.actions.map((a) => ({
          id: a.id,
          type: a.type,
          label: a.label,
          payload: a.payload,
        })),
      });
      notify.success(`Quest "${plan.title}" dibuat — ${plan.actions.length} aksi siap dijalankan`);
      setIntent("");
    } catch (err) {
      notify.fromError(err, "Gagal compile plan");
    } finally {
      setCompiling(false);
    }
  };

  const handleToggle = async (actionId: string) => {
    if (!quest) return;
    try {
      await toggleAction({ questId: quest._id, actionId });
    } catch (err) {
      notify.fromError(err, "Gagal update aksi");
    }
  };

  const handleAbandon = async () => {
    if (!quest) return;
    try {
      await setStatus({ questId: quest._id, status: "abandoned" });
      notify.info("Quest ditinggalkan");
    } catch (err) {
      notify.fromError(err, "Gagal abandon");
    }
  };

  const handleComplete = async () => {
    if (!quest) return;
    try {
      await setStatus({ questId: quest._id, status: "completed" });
      notify.success("Quest selesai. 🎉");
    } catch (err) {
      notify.fromError(err, "Gagal selesaikan quest");
    }
  };

  if (quest === undefined) {
    return null;
  }

  if (quest === null) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-4 w-4 text-brand" />
            Career Quest
            <Badge variant="outline" className="ml-1 text-[10px]">
              plan compiler
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Tulis niat karier kamu — engine compile jadi checklist aksi
            terstruktur lintas slice (skill, kalender, CV tailor, lowongan,
            dokumen). Aksi dibatasi vocab terkontrol, bukan output bebas LLM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            placeholder="Mis. Saya mau pindah ke Senior Data Engineer di 18 bulan, fokus fintech, masih perlu naikkan SQL + Airflow."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="min-h-[80px] text-sm"
            maxLength={600}
          />
          <Button
            type="button"
            onClick={handleCompile}
            disabled={compiling || intent.trim().length < 8}
            className="w-full gap-2 bg-brand hover:bg-brand"
          >
            {compiling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses plan…
              </>
            ) : (
              <>
                <WandSparkles className="h-4 w-4" />
                Compile Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completedCount = quest.actions.filter((a) => a.completed).length;
  const progress = Math.round(
    (completedCount / Math.max(1, quest.actions.length)) * 100,
  );

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="h-4 w-4 text-brand" />
              <span className="truncate">{quest.title}</span>
            </CardTitle>
            <p className="mt-0.5 text-xs italic text-muted-foreground line-clamp-2">
              &ldquo;{quest.intent}&rdquo;
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1 text-[10px]">
            <Target className="h-3 w-3" />
            ETA {quest.etaMonths} bln
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {completedCount} / {quest.actions.length} aksi
            </span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <ul className="space-y-1.5">
          {quest.actions.map((a) => {
            const route = routeForActionType(a.type);
            const qs = route ? payloadQueryString(a.type, a.payload) : "";
            const target = route ? `${route}${qs}` : null;
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                  a.completed
                    ? "border-emerald-300/50 bg-emerald-500/5"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(a.id)}
                  className="shrink-0 pt-0.5"
                  aria-label={a.completed ? "Tandai belum selesai" : "Tandai selesai"}
                >
                  {a.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1",
                    a.completed && "text-muted-foreground line-through",
                  )}
                >
                  {a.label}
                  <Badge variant="outline" className="ml-1 text-[9px]">
                    {TYPE_LABELS[a.type] ?? a.type}
                  </Badge>
                </span>
                {target && !a.completed && (
                  <button
                    type="button"
                    onClick={() => router.push(target)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-brand hover:bg-brand/10"
                    title={`Buka ${target}`}
                  >
                    <span className="flex items-center gap-0.5">
                      Jalankan
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAbandon}
            className="gap-1.5 text-[11px] text-muted-foreground"
          >
            <Trash2 className="h-3 w-3" />
            Abandon
          </Button>
          {completedCount === quest.actions.length && (
            <Button
              type="button"
              onClick={handleComplete}
              size="sm"
              className="gap-1.5 bg-brand text-[11px] hover:bg-brand"
            >
              <Sparkles className="h-3 w-3" />
              Tandai selesai
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
