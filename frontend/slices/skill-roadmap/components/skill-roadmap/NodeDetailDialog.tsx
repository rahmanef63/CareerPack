"use client";

import { BookOpen, CheckCircle2 } from "lucide-react";
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogDescription as DialogDescription,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { cn } from "@/shared/lib/utils";
import { NodeDetailBody } from "./NodeDetailBody";
import type { SimpleRoadmapNode } from "../../types/builder";

interface Props {
  selectedNode: SimpleRoadmapNode | null;
  completedNodes: Set<string>;
  /** `"<skillId>|<resourceTitle>"` for each resource marked done. The
   *  `roadmap.toggle-resource` AI skill wrote this flag to Convex from day
   *  one and nothing ever rendered it, so the action looked like a no-op. */
  completedResources: Set<string>;
  nodeIdToTitle: Map<string, string>;
  onClose: () => void;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
}

/**
 * Topic detail as a modal. Used on viewports below `lg` — at `lg` and
 * up `SkillRoadmap` renders the same body inline in the right rail
 * instead, so the tree stays visible while the detail is read.
 */
export function NodeDetailDialog({
  selectedNode, completedNodes, completedResources, nodeIdToTitle, onClose, onToggle,
}: Props) {
  return (
    <Dialog open={!!selectedNode} onOpenChange={onClose}>
      <DialogContent size="2xl">
        {selectedNode && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  completedNodes.has(selectedNode.id) ? 'bg-success' : 'bg-brand',
                )} aria-hidden>
                  {completedNodes.has(selectedNode.id) ? (
                    <CheckCircle2 className="w-6 h-6 text-success-foreground" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-brand-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl">{selectedNode.title}</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {selectedNode.description || "Detail topik dan sumber belajar."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <NodeDetailBody
              node={selectedNode}
              completedNodes={completedNodes}
              completedResources={completedResources}
              nodeIdToTitle={nodeIdToTitle}
              onToggle={onToggle}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
