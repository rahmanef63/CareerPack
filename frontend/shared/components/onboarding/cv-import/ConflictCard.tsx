"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/components/ui/toggle-group";
import { cn } from "@/shared/lib/utils";
import type { Conflict, DiffRow, Side } from "@/shared/lib/cv-merge";

const EMPTY = "(kosong)";

export interface ConflictCardProps {
  conflict: Conflict;
  decision: Side | undefined;
  onChoose: (id: string, side: Side) => void;
}

/**
 * One difference, one decision. Both sides are legitimate user data, so
 * neither is struck through and neither is pre-selected as the "right" one —
 * the card opens on the stored value and only an explicit tap moves it.
 */
export function ConflictCard({ conflict, decision, onChoose }: ConflictCardProps) {
  const isLong = conflict.kind === "longText";
  const isRecord = conflict.kind === "record";

  const mine = (
    <ValueBlock
      title="Yang sekarang"
      value={conflict.mine}
      chosen={decision === "mine"}
      scrollable={isLong}
    />
  );
  const theirs = (
    <ValueBlock
      title="Dari CV"
      value={conflict.theirs}
      chosen={decision === "theirs"}
      scrollable={isLong}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight text-foreground">
            {conflict.label}
          </p>
          {conflict.sublabel && (
            <p className="mt-0.5 text-sm text-muted-foreground">{conflict.sublabel}</p>
          )}
        </div>
        {conflict.ambiguous && (
          <Badge variant="outline" className="gap-1 border-warning text-warning-text">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            Cocok &gt;1 entri
          </Badge>
        )}
      </div>

      {isRecord ? (
        // A record diff is wide by nature — the per-field list sits between the
        // two summaries so one job stays one decision instead of five.
        <div className="space-y-2">
          {mine}
          {conflict.rows && conflict.rows.length > 0 ? (
            <DiffRows rows={conflict.rows} />
          ) : (
            <Arrow />
          )}
          {theirs}
        </div>
      ) : (
        <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
          {mine}
          <Arrow className="lg:mt-8" />
          {theirs}
        </div>
      )}

      <ToggleGroup
        type="single"
        variant="outline"
        className="w-full"
        value={decision}
        aria-label={`Pilih nilai untuk ${conflict.label}`}
        onValueChange={(next) => {
          // ToggleGroup emits "" when the active item is tapped again, which
          // would silently un-decide a difference the user already resolved.
          if (next) onChoose(conflict.id, next as Side);
        }}
      >
        {/* h-11 overrides toggleVariants' 36 px default — below the 44 px
            touch target the drawer is designed around. */}
        <ToggleGroupItem value="mine" className="h-11 flex-1">
          Yang sekarang
        </ToggleGroupItem>
        <ToggleGroupItem value="theirs" className="h-11 flex-1">
          Dari CV
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      className={cn("mx-auto h-4 w-4 shrink-0 rotate-90 text-brand lg:rotate-0", className)}
      aria-hidden
    />
  );
}

function ValueBlock({
  title,
  value,
  chosen,
  scrollable,
}: {
  title: string;
  value: string;
  chosen: boolean;
  scrollable: boolean;
}) {
  const text = value.trim();
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div
        className={cn(
          "rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed",
          scrollable && "max-h-32 overflow-y-auto whitespace-pre-wrap",
          chosen && "bg-success/10 ring-2 ring-brand",
        )}
      >
        {text === "" ? <span className="text-muted-foreground">{EMPTY}</span> : text}
      </div>
    </div>
  );
}

function DiffRows({ rows }: { rows: DiffRow[] }) {
  return (
    <dl className="space-y-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {row.label}
          </dt>
          <dd className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">{row.mine.trim() || EMPTY}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-brand" aria-hidden />
            <span className="font-medium text-foreground">
              {row.theirs.trim() || EMPTY}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
