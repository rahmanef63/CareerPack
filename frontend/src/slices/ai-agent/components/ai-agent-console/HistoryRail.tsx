"use client";

import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import type { ChatSession } from "./types";

interface Props {
  sessions: ChatSession[];
  activeId: string;
  mobileHistoryOpen: boolean;
  onStartNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryRail({
  sessions, activeId, mobileHistoryOpen,
  onStartNew, onSelect, onDelete,
}: Props) {
  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 border-r border-border bg-muted/30 flex-col",
        "hidden md:flex",
        mobileHistoryOpen && "absolute inset-y-0 left-0 z-10 flex w-72 bg-card shadow-xl md:static md:shadow-none",
      )}
      aria-label="Riwayat percakapan"
    >
      <div className="p-3 border-b border-border">
        <Button
          onClick={onStartNew}
          className="w-full justify-start"
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Percakapan Baru
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-0.5">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "w-full group flex items-start gap-2 p-2 rounded-md text-left transition-colors",
                  s.id === activeId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60",
                )}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {s.title || "Percakapan"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.messages.length} pesan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  aria-label={`Hapus percakapan ${s.title}`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </aside>
  );
}
