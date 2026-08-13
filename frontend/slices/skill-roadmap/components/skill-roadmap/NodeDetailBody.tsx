"use client";

import { CheckCircle2, Clock, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { getDifficultyLabel, getResourceIcon } from "../../lib/treeBuilder";
import type { SimpleRoadmapNode } from "../../types/builder";

interface Props {
  node: SimpleRoadmapNode;
  completedNodes: Set<string>;
  /** `"<skillId>|<resourceTitle>"` for each resource marked done. */
  completedResources: Set<string>;
  nodeIdToTitle: Map<string, string>;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
  /**
   * Heading level for the "Sumber Belajar" / "Prasyarat" sub-sections.
   * The dialog nests them under a `<h2>` DialogTitle, the desktop rail
   * under the card's own `<h2>` — both want `h3`, but callers that move
   * the body deeper can push it down without breaking heading order.
   */
  headingLevel?: "h3" | "h4";
}

/**
 * Topic detail — difficulty, hours, learning resources, prerequisites
 * and the completion toggle.
 *
 * Shared by BOTH surfaces so the two never drift: the mobile dialog
 * (`NodeDetailDialog`) and the desktop side rail (`RoadmapSidebar`).
 * Sized for the narrow rail (~360px) so it fits either container.
 */
export function NodeDetailBody({
  node,
  completedNodes,
  completedResources,
  nodeIdToTitle,
  onToggle,
  headingLevel: Heading = "h3",
}: Props) {
  const isCompleted = completedNodes.has(node.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="secondary"
          className={cn(
            node.difficulty === "beginner" && "bg-success/20 text-success-text",
            node.difficulty === "intermediate" && "bg-warning/20 text-warning-text",
            node.difficulty === "advanced" && "bg-destructive/10 text-destructive-text",
          )}
        >
          {getDifficultyLabel(node.difficulty)}
        </Badge>
        <Badge variant="secondary" className="bg-muted">
          <Clock className="w-3 h-3 mr-1" />
          {node.estimatedHours} jam
        </Badge>
      </div>

      <div>
        <Heading className="font-semibold text-foreground mb-2 text-sm">
          Sumber Belajar
        </Heading>
        {node.resources.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Belum ada sumber belajar untuk topik ini.
          </p>
        ) : (
          <div className="space-y-2">
            {node.resources.map((resource) => {
              const Icon = getResourceIcon(resource.type);
              const done = completedResources.has(`${node.id}|${resource.title}`);
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-brand hover:bg-brand-muted transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-brand-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{resource.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {resource.type}
                      </Badge>
                      {resource.free && (
                        <Badge variant="secondary" className="text-xs bg-success/20 text-success-text">
                          Gratis
                        </Badge>
                      )}
                      {done && (
                        <Badge variant="secondary" className="text-xs bg-success/20 text-success-text">
                          Selesai
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
      </div>

      {node.prerequisites.length > 0 && (
        <div>
          <Heading className="font-semibold text-foreground mb-2 text-sm">
            Prasyarat
          </Heading>
          <div className="flex flex-wrap gap-2">
            {node.prerequisites.map((prereq) => (
              <Badge
                key={prereq}
                variant="secondary"
                className={cn(completedNodes.has(prereq) && "bg-success/20 text-success-text")}
              >
                {nodeIdToTitle.get(prereq) ?? prereq}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Button
        className={cn(
          "w-full",
          isCompleted
            ? "bg-success text-success-foreground hover:bg-success/90"
            : "bg-brand text-brand-foreground hover:bg-brand/90",
        )}
        onClick={(e) => onToggle(node.id, e)}
      >
        {isCompleted ? (
          <><CheckCircle2 className="w-4 h-4 mr-2" aria-hidden />Tandai Belum Selesai</>
        ) : (
          <><Play className="w-4 h-4 mr-2" aria-hidden />Tandai Selesai</>
        )}
      </Button>
    </div>
  );
}
