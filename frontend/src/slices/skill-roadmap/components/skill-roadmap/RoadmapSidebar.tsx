"use client";

import { Clock, ExternalLink, Lightbulb, Star, Trophy } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { getResourceIcon } from "../../lib/treeBuilder";
import type { SimpleRoadmapNode } from "../../types/builder";

interface Props {
  completedSize: number;
  totalNodes: number;
  totalHours: number;
  roadmapData: SimpleRoadmapNode[];
  completedNodes: Set<string>;
}

export function RoadmapSidebar({
  completedSize, totalNodes, totalHours, roadmapData, completedNodes,
}: Props) {
  const topNode = roadmapData.find((n) => !completedNodes.has(n.id)) ?? roadmapData[0];

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Progres Anda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-brand-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-brand" />
                <span className="text-sm font-medium text-foreground">Topik Selesai</span>
              </div>
              <span className="font-bold text-brand">{completedSize}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-success" />
                <span className="text-sm font-medium text-foreground">Estimasi Jam Belajar</span>
              </div>
              <span className="font-bold text-success">{totalHours}+</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-warning" />
                <span className="text-sm font-medium text-foreground">Total Topik</span>
              </div>
              <span className="font-bold text-warning">{totalNodes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top resources from first uncompleted node */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Sumber Belajar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topNode?.resources.slice(0, 3).map((resource) => {
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
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{resource.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground capitalize">{resource.type}</span>
                      {resource.free && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-success/20 text-success">Gratis</Badge>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-gradient-to-br from-brand-muted to-brand-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-brand-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-brand">Tips Belajar</h4>
              <ul className="text-sm text-brand mt-2 space-y-1">
                <li>• Belajar secara konsisten setiap hari</li>
                <li>• Praktikkan dengan membuat proyek nyata</li>
                <li>• Bergabung dengan komunitas praktisi</li>
                <li>• Dokumentasikan progres Anda</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
