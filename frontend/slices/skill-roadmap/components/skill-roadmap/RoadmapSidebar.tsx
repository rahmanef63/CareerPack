"use client";

import { Clock, ExternalLink, Lightbulb, Star, Trophy, X } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import { getResourceIcon } from "../../lib/treeBuilder";
import { NodeDetailBody } from "./NodeDetailBody";
import type { SimpleRoadmapNode } from "../../types/builder";

interface Props {
  completedSize: number;
  totalNodes: number;
  totalHours: number;
  roadmapData: SimpleRoadmapNode[];
  completedNodes: Set<string>;
  /**
   * Desktop-only detail surface. When a node is selected the rail swaps
   * its generic "Sumber Belajar" card for that topic's full detail —
   * below `lg` the same body renders in `NodeDetailDialog` instead, so
   * these stay optional.
   */
  selectedNode?: SimpleRoadmapNode | null;
  completedResources?: Set<string>;
  nodeIdToTitle?: Map<string, string>;
  onToggle?: (nodeId: string, e: React.MouseEvent) => void;
  onClearSelection?: () => void;
  className?: string;
}

export function RoadmapSidebar({
  completedSize,
  totalNodes,
  totalHours,
  roadmapData,
  completedNodes,
  selectedNode,
  completedResources,
  nodeIdToTitle,
  onToggle,
  onClearSelection,
  className,
}: Props) {
  const topNode = roadmapData.find((n) => !completedNodes.has(n.id)) ?? roadmapData[0];
  // One narrowing so the detail card can render without non-null assertions.
  const detail =
    selectedNode && completedResources && nodeIdToTitle && onToggle
      ? { node: selectedNode, completedResources, nodeIdToTitle, onToggle }
      : null;

  return (
    <aside aria-label="Progres dan detail topik" className={cn("space-y-4", className)}>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle as="h2" className="text-lg">Progres Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 p-3 bg-brand-muted rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <Trophy className="w-5 h-5 text-brand-muted-foreground shrink-0" aria-hidden />
                <span className="text-sm font-medium text-brand-muted-foreground">Topik Selesai</span>
              </div>
              <span className="font-bold tabular-nums text-brand-muted-foreground">{completedSize}</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="w-5 h-5 text-success shrink-0" aria-hidden />
                <span className="text-sm font-medium text-foreground">Estimasi Jam Belajar</span>
              </div>
              <span className="font-bold tabular-nums text-success-text">{totalHours}+</span>
            </div>
            <div className="flex items-center justify-between gap-2 p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <Star className="w-5 h-5 text-warning shrink-0" aria-hidden />
                <span className="text-sm font-medium text-foreground">Total Topik</span>
              </div>
              <span className="font-bold tabular-nums text-warning-text">{totalNodes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {detail ? (
        /* Selected topic — the desktop counterpart of NodeDetailDialog. */
        <Card className="border-brand">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle as="h2" className="text-lg">{detail.node.title}</CardTitle>
                {detail.node.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{detail.node.description}</p>
                )}
              </div>
              {onClearSelection && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={onClearSelection}
                  aria-label="Tutup detail topik"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <NodeDetailBody
              node={detail.node}
              completedNodes={completedNodes}
              completedResources={detail.completedResources}
              nodeIdToTitle={detail.nodeIdToTitle}
              onToggle={detail.onToggle}
            />
          </CardContent>
        </Card>
      ) : (
        /* Top resources from first uncompleted node */
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle as="h2" className="text-lg">Sumber Belajar</CardTitle>
          </CardHeader>
          <CardContent>
            {!topNode || topNode.resources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Pilih topik di roadmap untuk melihat sumber belajarnya.
              </p>
            ) : (
              <div className="space-y-3">
                {topNode.resources.slice(0, 3).map((resource) => {
                  const Icon = getResourceIcon(resource.type);
                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-brand hover:bg-brand-muted transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-brand-muted-foreground" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{resource.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs text-muted-foreground capitalize">{resource.type}</span>
                          {resource.free && (
                            <Badge variant="secondary" className="h-5 px-1.5 bg-success/20 text-success-text">
                              Gratis
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-brand-muted/60">
        <CardHeader className="pb-3">
          <CardTitle as="h2" className="flex items-center gap-3 text-base text-brand-muted-foreground">
            <span className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center shrink-0" aria-hidden>
              <Lightbulb className="w-5 h-5 text-brand-foreground" />
            </span>
            Tips Belajar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-brand-muted-foreground space-y-1">
            <li>• Belajar secara konsisten setiap hari</li>
            <li>• Praktikkan dengan membuat proyek nyata</li>
            <li>• Bergabung dengan komunitas praktisi</li>
            <li>• Dokumentasikan progres Anda</li>
          </ul>
        </CardContent>
      </Card>
    </aside>
  );
}
