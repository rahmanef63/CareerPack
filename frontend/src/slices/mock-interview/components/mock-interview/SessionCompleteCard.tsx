import { Trophy, RotateCcw, Share2 } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

interface Props {
  sessionScore: number;
  questionCount: number;
  elapsedLabel: string;
  onReset: () => void;
}

export function SessionCompleteCard({
  sessionScore, questionCount, elapsedLabel, onReset,
}: Props) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="border-border">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-brand-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Sesi Selesai!</h2>
          <p className="text-muted-foreground mb-8">
            Bagus! Anda telah menyelesaikan sesi latihan wawancara
          </p>

          <div className="grid sm:grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
            <div className="p-4 bg-brand-muted rounded-xl">
              <p className="text-3xl font-bold text-brand">{sessionScore}%</p>
              <p className="text-sm text-brand">Skor Keseluruhan</p>
            </div>
            <div className="p-4 bg-success/10 rounded-xl">
              <p className="text-3xl font-bold text-success">{questionCount}</p>
              <p className="text-sm text-success">Pertanyaan</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-xl">
              <p className="text-3xl font-bold text-brand">{elapsedLabel}</p>
              <p className="text-sm text-brand">Durasi</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={onReset} className="bg-brand hover:bg-brand">
              <RotateCcw className="w-4 h-4 mr-2" />
              Sesi Baru
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan Hasil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
