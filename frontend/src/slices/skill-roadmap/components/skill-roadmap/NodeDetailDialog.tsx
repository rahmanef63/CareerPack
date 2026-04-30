"use client";

import { BookOpen, CheckCircle2, Clock, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { cn } from "@/shared/lib/utils";
import { getDifficultyLabel, getResourceIcon } from "../../lib/treeBuilder";
import type { SimpleRoadmapNode } from "../../types/builder";

interface Props {
  selectedNode: SimpleRoadmapNode | null;
  completedNodes: Set<string>;
  nodeIdToTitle: Map<string, string>;
  onClose: () => void;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
}

export function NodeDetailDialog({
  selectedNode, completedNodes, nodeIdToTitle, onClose, onToggle,
}: Props) {
  return (
    <Dialog open={!!selectedNode} onOpenChange={onClose}>
      <DialogContent size="2xl">
        {selectedNode && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  completedNodes.has(selectedNode.id) ? 'bg-success' : 'bg-brand',
                )}>
                  {completedNodes.has(selectedNode.id) ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-foreground" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-brand-foreground" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl">{selectedNode.title}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedNode.description || "Detail topik dan sumber belajar."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    selectedNode.difficulty === 'beginner' && 'bg-success/20 text-success',
                    selectedNode.difficulty === 'intermediate' && 'bg-warning/20 text-warning',
                    selectedNode.difficulty === 'advanced' && 'bg-destructive/10 text-destructive',
                  )}
                >
                  {getDifficultyLabel(selectedNode.difficulty)}
                </Badge>
                <Badge variant="secondary" className="bg-muted">
                  <Clock className="w-3 h-3 mr-1" />
                  {selectedNode.estimatedHours} jam
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Sumber Belajar</h4>
                <div className="space-y-3">
                  {selectedNode.resources.map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-brand hover:bg-brand-muted transition-all duration-200"
                      >
                        <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-brand" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{resource.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
                            {resource.free && (
                              <Badge variant="secondary" className="text-xs bg-success/20 text-success">Gratis</Badge>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {selectedNode.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Prasyarat</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.prerequisites.map((prereq) => (
                      <Badge
                        key={prereq}
                        variant="secondary"
                        className={cn(completedNodes.has(prereq) && 'bg-success/20 text-success')}
                      >
                        {nodeIdToTitle.get(prereq) ?? prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  className={cn(
                    'w-full',
                    completedNodes.has(selectedNode.id) ? 'bg-success hover:bg-success' : 'bg-brand hover:bg-brand',
                  )}
                  onClick={(e) => onToggle(selectedNode.id, e)}
                >
                  {completedNodes.has(selectedNode.id) ? (
                    <><CheckCircle2 className="w-5 h-5 mr-2" />Tandai Belum Selesai</>
                  ) : (
                    <><Play className="w-5 h-5 mr-2" />Tandai Selesai</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
