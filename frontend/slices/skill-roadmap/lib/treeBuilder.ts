import { BookOpen, ExternalLink, FileText, Target, Video } from "lucide-react";
import type { RoadmapResource as Resource } from "../types";
import type { SimpleRoadmapNode, TemplateNode } from "../types/builder";

/**
 * Walk the flat DB template node array (with `parentId`) and rebuild
 * the parent/child tree the UI renders.
 */
export function buildTreeFromNodes(nodes: TemplateNode[]): SimpleRoadmapNode[] {
  const roots = nodes.filter((n) => !n.parentId);

  function toUiNode(n: TemplateNode): SimpleRoadmapNode {
    const childNodes = nodes.filter((c) => c.parentId === n.id).map(toUiNode);
    return {
      id: n.id,
      title: n.title,
      description: n.description,
      difficulty: (n.difficulty as SimpleRoadmapNode['difficulty']) ?? 'beginner',
      estimatedHours: n.estimatedHours,
      prerequisites: n.prerequisites,
      resources: n.resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type as Resource['type'],
        url: r.url,
        free: r.free,
      })),
      children: childNodes.length > 0 ? childNodes : undefined,
    };
  }

  return roots.map(toUiNode);
}

export function getResourceIcon(type: Resource['type']) {
  switch (type) {
    case 'video': return Video;
    case 'article': return FileText;
    case 'course': return BookOpen;
    case 'book': return BookOpen;
    case 'practice': return Target;
    case 'documentation': return FileText;
    default: return ExternalLink;
  }
}

export function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'Pemula';
    case 'intermediate': return 'Menengah';
    case 'advanced': return 'Lanjutan';
    default: return difficulty;
  }
}

export function flattenNodes(list: SimpleRoadmapNode[]): SimpleRoadmapNode[] {
  return list.flatMap((n) => [n, ...flattenNodes(n.children ?? [])]);
}

export function countNodes(nodes: SimpleRoadmapNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children ?? []), 0);
}
