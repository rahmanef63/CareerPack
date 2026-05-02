"use client";

import { useState } from "react";
import { Building2, ExternalLink, GripVertical, Plus } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";

import type { Application, ApplicationStatus } from "../types";
import { STATUS_META } from "../constants/status";

interface ApplicationKanbanProps {
  applications: Application[];
  isLoading: boolean;
  onStatusChange: (app: Application, status: ApplicationStatus) => Promise<void>;
  onSelect?: (app: Application) => void;
  onAdd?: () => void;
}

/**
 * Drag-drop kanban — five visible columns (skips "withdrawn" — rare,
 * showed as inline badge on the rejected card if present). Uses
 * native HTML5 drag events to avoid a react-dnd dependency.
 */
const COLUMN_ORDER: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

export function ApplicationKanban({
  applications,
  isLoading,
  onStatusChange,
  onSelect,
  onAdd,
}: ApplicationKanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<ApplicationStatus | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, app: Application) => {
    setDragId(app.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", app.id);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(status);
  };

  const handleDrop = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    setDropTarget(null);
    setDragId(null);
    if (!id) return;
    const app = applications.find((a) => a.id === id);
    if (!app || app.status === status) return;
    setPendingId(id);
    try {
      await onStatusChange(app, status);
    } catch {
      // hook already toasts
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {COLUMN_ORDER.map((s) => (
          <Skeleton key={s} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {COLUMN_ORDER.map((status) => {
        const meta = STATUS_META[status];
        const cards = applications.filter((a) => a.status === status);
        const isTarget = dropTarget === status;
        return (
          <section
            key={status}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={() => setDropTarget(null)}
            onDrop={(e) => handleDrop(e, status)}
            className={cn(
              "flex flex-col rounded-xl border bg-muted/30 transition-colors",
              isTarget ? "border-brand bg-brand-muted/30 ring-2 ring-brand/40" : "border-border",
            )}
          >
            <header className="flex items-center justify-between border-b border-border/60 px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge className={cn("border-0 text-[10px] uppercase", meta.className)}>
                  {meta.label}
                </Badge>
                <span className="text-muted-foreground tabular-nums">{cards.length}</span>
              </div>
              {status === "applied" && onAdd && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={onAdd}
                  aria-label="Tambah lamaran"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </header>

            <div className="flex-1 space-y-2 p-2 min-h-[140px]">
              {cards.length === 0 ? (
                <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                  {isTarget ? "Lepas di sini" : "—"}
                </p>
              ) : (
                cards.map((app) => (
                  <article
                    key={app.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, app)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelect?.(app)}
                    className={cn(
                      "group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing",
                      dragId === app.id && "opacity-50",
                      pendingId === app.id && "animate-pulse",
                      "hover:shadow-md",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="line-clamp-2 text-sm font-medium leading-tight">
                          {app.position}
                        </h4>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="line-clamp-1">{app.company}</span>
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {formatShortDate(app.appliedDate)}
                          </span>
                          {app.link && (
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-muted-foreground hover:text-brand"
                              aria-label="Buka link lamaran"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function formatShortDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

