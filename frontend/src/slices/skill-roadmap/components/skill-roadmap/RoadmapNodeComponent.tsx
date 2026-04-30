"use client";

import {
  BookOpen, CheckCircle2, ChevronRight, Circle, Clock, Lock, Play, Swords,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { SimpleRoadmapNode } from "../../types/builder";
import { getDifficultyLabel } from "../../lib/treeBuilder";

interface RoadmapNodeProps {
  node: SimpleRoadmapNode;
  level?: number;
  completedNodes: Set<string>;
  activeQuestId?: string | null;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
  onSelect: (node: SimpleRoadmapNode) => void;
}

/**
 * Module-level — keeps React from unmounting/remounting nodes on parent
 * re-render.
 */
export function RoadmapNodeComponent({
  node, level = 0, completedNodes, activeQuestId, onToggle, onSelect,
}: RoadmapNodeProps) {
  const isCompleted = completedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isLocked =
    node.prerequisites.length > 0 &&
    !node.prerequisites.every((p) => completedNodes.has(p));
  const isActive = node.id === activeQuestId;
  const isBoss = node.difficulty === 'advanced';

  return (
    <div className={cn('relative', level > 0 && 'ml-4 mt-4 sm:ml-8')}>
      {level > 0 && (
        <div className="absolute -left-3 top-6 h-px w-3 bg-muted sm:-left-6 sm:w-6" />
      )}

      {/* Active-quest pulse ring — only on the next-up node */}
      {isActive && (
        <div className="absolute -inset-0.5 rounded-2xl ring-2 ring-brand/60 animate-pulse pointer-events-none" />
      )}

      <div
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
          isCompleted
            ? 'border-success bg-success/10'
            : isLocked
              ? 'border-border bg-muted/50 opacity-60'
              : isActive
                ? 'border-brand bg-brand-muted/40 shadow-lg'
                : 'border-border bg-card hover:border-brand hover:shadow-md'
        )}
        onClick={() => !isLocked && onSelect(node)}
      >
        <button
          onClick={(e) => !isLocked && onToggle(node.id, e)}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
            isCompleted
              ? 'bg-success text-brand-foreground'
              : isLocked
                ? 'bg-muted text-muted-foreground'
                : 'bg-brand-muted text-brand hover:bg-brand/30'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={cn('font-semibold text-lg', isCompleted ? 'text-success' : 'text-foreground')}>
                {node.title}
              </h4>
              <p className="text-muted-foreground text-sm mt-1">{node.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {isActive && !isCompleted && !isLocked && (
              <Badge className="text-[10px] bg-brand text-brand-foreground">
                <Play className="w-3 h-3 mr-1" /> Quest Aktif
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                node.difficulty === 'beginner' && 'bg-success/20 text-success',
                node.difficulty === 'intermediate' && 'bg-warning/20 text-warning',
                node.difficulty === 'advanced' && 'bg-destructive/10 text-destructive',
              )}
            >
              {isBoss && <Swords className="w-3 h-3 mr-1" />}
              {isBoss ? 'BOSS · Lanjutan' : getDifficultyLabel(node.difficulty)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {node.estimatedHours} jam
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              {node.resources.length} sumber
            </div>
            {hasChildren && (
              <Badge variant="outline" className="text-xs">
                {node.children?.length} sub-topik
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className="relative mt-4">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-muted" />
          {node.children?.map((child) => (
            <RoadmapNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              completedNodes={completedNodes}
              activeQuestId={activeQuestId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
