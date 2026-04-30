"use client";

import { Code, Clock, BookOpen, Users, Check } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { BrowserCategory } from "./RoadmapBrowser";

interface RoadmapTableProps {
  rows: ReadonlyArray<BrowserCategory>;
  selectedId: string;
  onSelect: (id: string) => void;
  domainLabels: Record<string, string>;
  iconMap: Record<string, React.ElementType>;
}

/**
 * Compact table view of roadmap templates. Sticky-styled header so the
 * column meanings stay visible while scrolling. Mobile-friendly: hides
 * non-critical columns at narrow widths (`hidden md:table-cell`).
 */
export function RoadmapTable({ rows, selectedId, onSelect, domainLabels, iconMap }: RoadmapTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium">Roadmap</th>
            <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Domain</th>
            <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">Topik</th>
            <th className="text-right px-3 py-2.5 font-medium hidden md:table-cell">Jam</th>
            <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Level</th>
            <th className="text-right px-3 py-2.5 font-medium hidden lg:table-cell">Pengguna</th>
            <th className="text-right px-3 py-2.5 font-medium">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Code;
            const isSelected = selectedId === cat.id;
            return (
              <tr
                key={cat.id}
                className={cn(
                  "transition-colors hover:bg-muted/30",
                  isSelected && "bg-brand-muted/40",
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      cat.color,
                    )}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-foreground truncate">{cat.name}</span>
                        {!cat.isSystem && cat.authorName && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 leading-none">
                            by {cat.authorName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {domainLabels[cat.domain] ?? cat.domain}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right tabular-nums hidden md:table-cell">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <BookOpen className="w-3 h-3" />
                    {cat.nodeCount}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums hidden md:table-cell">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {cat.totalHours}
                  </span>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell">
                  <DifficultyBar mix={cat.difficultyMix} />
                </td>
                <td className="px-3 py-3 text-right tabular-nums hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {cat.popularity}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => onSelect(cat.id)}
                    className="h-7 text-xs"
                  >
                    {isSelected ? (
                      <><Check className="w-3 h-3 mr-1" /> Aktif</>
                    ) : (
                      "Pilih"
                    )}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface DifficultyBarProps {
  mix: { beginner: number; intermediate: number; advanced: number };
}

function DifficultyBar({ mix }: DifficultyBarProps) {
  const total = Math.max(1, mix.beginner + mix.intermediate + mix.advanced);
  const segs = [
    { key: "b", value: mix.beginner, color: "bg-success" },
    { key: "i", value: mix.intermediate, color: "bg-warning" },
    { key: "a", value: mix.advanced, color: "bg-destructive/70" },
  ];
  return (
    <div className="flex items-center gap-1.5 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
        {segs.map((s) => (
          <div
            key={s.key}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {mix.beginner}/{mix.intermediate}/{mix.advanced}
      </span>
    </div>
  );
}
