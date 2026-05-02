"use client";

import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { notify } from "@/shared/lib/notify";
import { publish } from "@/shared/lib/aiActionBus";
import { SKILLS_BY_ID } from "@/shared/lib/sliceRegistry";
import { ACTION_META, type AgentAction } from "../lib/agentActions";
import { SuccessCheck } from "@/shared/components/interactions/MicroInteractions";

interface ApproveActionCardProps {
  action: AgentAction;
  onResolved?: (applied: boolean) => void;
}

interface ResolvedMeta {
  label: string;
  description: string;
  cta: string;
}

/** Resolve display meta for an action. Manifest skills (registry)
 *  win over the legacy ACTION_META map; both fall back to a generic
 *  "Tindakan AI / Terapkan" label when neither matches. */
function resolveMeta(action: AgentAction): ResolvedMeta {
  const skill = SKILLS_BY_ID.get(action.type);
  if (skill) {
    return {
      label: skill.label,
      description: skill.description,
      cta: skill.cta ?? "Terapkan",
    };
  }
  const legacy = ACTION_META[action.type as keyof typeof ACTION_META];
  if (legacy) return legacy;
  return {
    label: "Tindakan AI",
    description: "Terapkan tindakan ini.",
    cta: "Terapkan",
  };
}

export function ApproveActionCard({ action, onResolved }: ApproveActionCardProps) {
  const [state, setState] = useState<"pending" | "applied" | "dismissed">("pending");
  const meta = resolveMeta(action);

  const apply = () => {
    publish(action);
    setState("applied");
    notify.success(`${meta.label} diterapkan`);
    onResolved?.(true);
  };

  const dismiss = () => {
    setState("dismissed");
    onResolved?.(false);
  };

  return (
    <div className="border border-border rounded-xl p-3 bg-background/60 backdrop-blur-sm space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-muted dark:bg-brand/20 text-brand dark:text-brand flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
          <ActionPreview action={action} />
        </div>
      </div>

      {state === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={apply} className="flex-1 bg-brand hover:bg-brand">
            <Check className="w-4 h-4 mr-1" /> {meta.cta}
          </Button>
          <Button size="sm" variant="outline" onClick={dismiss}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {state === "applied" && (
        <div className="flex items-center gap-2 text-sm text-success dark:text-success/80 font-medium">
          <SuccessCheck size={20} /> Diterapkan
        </div>
      )}

      {state === "dismissed" && (
        <div className="text-xs text-muted-foreground italic">Dilewati</div>
      )}
    </div>
  );
}

function ActionPreview({ action }: { action: AgentAction }) {
  switch (action.type) {
    case "cv.fillExperience":
      return (
        <div className="mt-1 text-xs text-foreground/80 bg-muted/40 rounded-md p-2 space-y-0.5">
          <p>
            <span className="font-medium">{action.payload.position}</span> @ {action.payload.company}
          </p>
          <p className="text-muted-foreground line-clamp-2">{action.payload.description}</p>
        </div>
      );
    case "cv.improveSummary":
      return (
        <p className="mt-1 text-xs text-foreground/80 bg-muted/40 rounded-md p-2 line-clamp-3">
          {action.payload.summary}
        </p>
      );
    case "cv.addSkills":
      return (
        <div className="mt-1 flex flex-wrap gap-1">
          {action.payload.skills.map((s) => (
            <span
              key={s.name}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/80"
            >
              {s.name}
            </span>
          ))}
        </div>
      );
    case "roadmap.generate":
      return (
        <p className="mt-1 text-xs text-muted-foreground">
          Target: <span className="font-medium text-foreground/80">{action.payload.goal}</span> · {action.payload.months} bulan
        </p>
      );
    case "interview.startSession":
      return (
        <p className="mt-1 text-xs text-muted-foreground">
          Topik: <span className="font-medium text-foreground/80">{action.payload.topic}</span>
        </p>
      );
    case "match.recommend":
      return (
        <ul className="mt-1 text-xs text-foreground/80 space-y-0.5 list-disc list-inside">
          {action.payload.jobs.slice(0, 3).map((j) => (
            <li key={j.company}>
              <span className="font-medium">{j.role}</span> · {j.company}
            </li>
          ))}
        </ul>
      );
    default:
      // Manifest-skill envelope — payload is a key/value bag. Render
      // each populated field on its own line. Truncate long strings
      // so the approval card stays compact.
      return <GenericPayloadPreview payload={(action as { payload: Record<string, unknown> }).payload} />;
  }
}

function GenericPayloadPreview({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 text-xs text-foreground/80 bg-muted/40 rounded-md p-2 space-y-0.5">
      {entries.map(([k, v]) => (
        <p key={k} className="break-words">
          <span className="font-medium">{k}:</span>{" "}
          {String(v).length > 160 ? String(v).slice(0, 160) + "..." : String(v)}
        </p>
      ))}
    </div>
  );
}
