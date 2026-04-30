import { Card, CardContent } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import type { ChecklistProgress } from "../../hooks/useChecklistData";

export function ProgressGrid({ progress }: { progress: ChecklistProgress }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand">{progress.percentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">Progress Keseluruhan</p>
            <Progress value={progress.percentage} className="mt-3 h-2" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-success">{progress.completed}</div>
            <p className="text-sm text-muted-foreground mt-1">Selesai</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-warning">
              {progress.total - progress.completed}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Belum Selesai</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-destructive">
              {progress.required - progress.requiredCompleted}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Wajib Tersisa</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
