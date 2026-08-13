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
  /** Node currently shown in the detail surface — drives the selected ring. */
  selectedNodeId?: string | null;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
  onSelect: (node: SimpleRoadmapNode) => void;
}

/**
 * Module-level — keeps React from unmounting/remounting nodes on parent
 * re-render.
 *
 * a11y: the card used to be a `role="button"` div wrapping a real
 * `<button>` (axe `nested-interactive`), and that inner button was
 * icon-only with no accessible name (axe `button-name`). It is now two
 * sibling buttons: a transparent overlay covering the card that opens
 * the detail, and the completion toggle stacked above it. Keyboard and
 * pointer both hit the same two targets, and locked nodes are
 * `disabled` rather than silently inert.
 */
export function RoadmapNodeComponent({
  node, level = 0, completedNodes, activeQuestId, selectedNodeId, onToggle, onSelect,
}: RoadmapNodeProps) {
  const isCompleted = completedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isLocked =
    node.prerequisites.length > 0 &&
    !node.prerequisites.every((p) => completedNodes.has(p));
  const isActive = node.id === activeQuestId;
  const isSelected = node.id === selectedNodeId;
  const isBoss = node.difficulty === 'advanced';

  return (
    <div className={cn('relative', level > 0 && 'ml-4 mt-4 sm:ml-8')}>
      {level > 0 && (
        <div className="absolute -left-3 top-6 h-px w-3 bg-muted sm:-left-6 sm:w-6" aria-hidden />
      )}

      {/* Active-quest pulse ring — only on the next-up node */}
      {isActive && (
        <div
          className="absolute -inset-0.5 rounded-2xl ring-2 ring-brand/60 animate-pulse pointer-events-none"
          aria-hidden
        />
      )}

      <div
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300',
          isCompleted
            ? 'border-success bg-success/10'
            : isLocked
              ? 'border-border bg-muted/50 opacity-60'
              : isActive
                ? 'border-brand bg-brand-muted/40 shadow-lg'
                : 'border-border bg-card hover:border-brand hover:shadow-md',
          isSelected && !isLocked && 'ring-2 ring-brand ring-offset-2 ring-offset-background',
        )}
      >
        {/* Whole-card selection target. Absolute (not a wrapper) so the
            toggle below is a sibling, never a nested control. */}
        <button
          type="button"
          onClick={() => onSelect(node)}
          disabled={isLocked}
          aria-current={isSelected ? "true" : undefined}
          aria-label={
            isLocked
              ? `${node.title} terkunci — selesaikan prasyaratnya dulu`
              : `Lihat detail topik ${node.title}`
          }
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default"
        />

        <button
          type="button"
          onClick={(e) => onToggle(node.id, e)}
          disabled={isLocked}
          aria-pressed={isCompleted}
          aria-label={
            isCompleted
              ? `Tandai ${node.title} belum selesai`
              : `Tandai ${node.title} selesai`
          }
          className={cn(
            'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isCompleted
              ? 'bg-success text-success-foreground'
              : isLocked
                ? 'bg-muted text-muted-foreground disabled:cursor-default'
                : 'bg-brand-muted text-brand-muted-foreground hover:bg-brand/30'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" aria-hidden />
          ) : isLocked ? (
            <Lock className="w-5 h-5" aria-hidden />
          ) : (
            <Circle className="w-6 h-6" aria-hidden />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={cn('font-semibold text-lg', isCompleted ? 'text-success-text' : 'text-foreground')}>
                {node.title}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">{node.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            {isActive && !isCompleted && !isLocked && (
              <Badge className="bg-brand text-brand-foreground">
                <Play className="w-3 h-3 mr-1" aria-hidden /> Quest Aktif
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={cn(
                node.difficulty === 'beginner' && 'bg-success/20 text-success-text',
                node.difficulty === 'intermediate' && 'bg-warning/20 text-warning-text',
                node.difficulty === 'advanced' && 'bg-destructive/10 text-destructive-text',
              )}
            >
              {isBoss && <Swords className="w-3 h-3 mr-1" aria-hidden />}
              {isBoss ? 'BOSS · Lanjutan' : getDifficultyLabel(node.difficulty)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" aria-hidden />
              {node.estimatedHours} jam
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" aria-hidden />
              {node.resources.length} sumber
            </div>
            {hasChildren && (
              <Badge variant="outline">
                {node.children?.length} sub-topik
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className="relative mt-4">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-muted" aria-hidden />
          {node.children?.map((child) => (
            <RoadmapNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              completedNodes={completedNodes}
              activeQuestId={activeQuestId}
              selectedNodeId={selectedNodeId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
