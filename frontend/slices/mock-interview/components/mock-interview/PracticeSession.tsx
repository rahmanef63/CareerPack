"use client";

import {
  MessageSquare, Pause, Mic, Video, CheckCircle2,
  Lightbulb, ChevronRight, Star, Clock, Save, Share2, RotateCcw, Play, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/lib/utils";
import { indonesianDifficultyLabels } from "@/shared/data/indonesianData";
import { categoryLabels, getDifficultyColor } from "../../constants/categories";

interface Props {
  sessionStartedAt: number | null;
  isStarting: boolean;
  filteredQuestions: ReadonlyArray<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
    tips: string[];
    sampleAnswer?: string;
  }>;
  currentQuestion: Props["filteredQuestions"][number];
  currentQuestionIndex: number;
  isRecording: boolean;
  showAnswer: boolean;
  userAnswer: string;
  favorites: Set<string>;
  elapsedLabel: string;
  onStart: () => void;
  onSetRecording: (v: boolean) => void;
  onSetShowAnswer: (v: boolean) => void;
  onSetUserAnswer: (v: string) => void;
  onToggleFavorite: (id: string) => void;
  onNext: () => void;
  onReset: () => void;
}

export function PracticeSession({
  sessionStartedAt, isStarting, filteredQuestions, currentQuestion,
  currentQuestionIndex, isRecording, showAnswer, userAnswer,
  favorites, elapsedLabel,
  onStart, onSetRecording, onSetShowAnswer, onSetUserAnswer,
  onToggleFavorite, onNext, onReset,
}: Props) {
  if (!sessionStartedAt) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted">
            <Play className="h-7 w-7 text-brand" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              Siap mulai latihan?
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Kami akan bantu kamu latihan jawab pertanyaan wawancara umum.
              Setiap pertanyaan punya tips sebelum kamu menjawab. Timer baru
              berjalan saat kamu klik tombol di bawah.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <MessageSquare className="h-3 w-3" />
              {filteredQuestions.length} pertanyaan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Clock className="h-3 w-3" />
              Waktu bebas
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
              <Info className="h-3 w-3" />
              Bisa lewati kapan saja
            </span>
          </div>
          <Button
            onClick={onStart}
            disabled={isStarting}
            className="gap-2 bg-brand hover:bg-brand"
          >
            <Play className="h-4 w-4" />
            {isStarting ? "Memulai…" : "Mulai Sesi"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border">
          <CardContent className="py-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progres sesi</span>
              <span className="font-semibold text-foreground tabular-nums">
                {currentQuestionIndex + 1} / {filteredQuestions.length}
              </span>
            </div>
            <Progress
              value={
                ((currentQuestionIndex + 1) / filteredQuestions.length) * 100
              }
              className="h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex gap-2">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {indonesianDifficultyLabels[currentQuestion.difficulty]}
                </Badge>
                <Badge variant="secondary" className="bg-muted">
                  {categoryLabels[currentQuestion.category]}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(currentQuestion.id)}
              >
                <Star
                  className={cn(
                    "w-5 h-5",
                    favorites.has(currentQuestion.id)
                      ? "fill-amber-400 text-warning/80"
                      : "text-muted-foreground",
                  )}
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold text-foreground mb-6">
              {currentQuestion.question}
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  onClick={() => onSetRecording(!isRecording)}
                  className={cn(
                    "rounded-full px-8",
                    !isRecording && "bg-brand hover:bg-brand",
                  )}
                >
                  {isRecording ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Berhenti Rekam
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Mulai Rekam
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" className="rounded-full">
                  <Video className="w-5 h-5 mr-2" />
                  Aktifkan Kamera
                </Button>
              </div>

              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-destructive animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  Sedang merekam...
                </div>
              )}

              <Textarea
                placeholder="Atau ketik jawaban Anda di sini..."
                value={userAnswer}
                onChange={(e) => onSetUserAnswer(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-warning" />
              Tips untuk Pertanyaan Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentQuestion.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>

            {showAnswer && currentQuestion.sampleAnswer && (
              <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/30">
                <p className="font-medium text-success mb-2">Contoh Jawaban:</p>
                <p className="text-success text-sm">
                  {currentQuestion.sampleAnswer}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => onSetShowAnswer(!showAnswer)}
              >
                {showAnswer ? "Sembunyikan" : "Tampilkan"} Contoh Jawaban
              </Button>
              <Button onClick={onNext} className="bg-brand hover:bg-brand">
                Pertanyaan Selanjutnya
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Statistik Sesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Waktu Berlalu</span>
                </div>
                <span className="font-semibold text-foreground tabular-nums">
                  {elapsedLabel}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Dijawab</span>
                </div>
                <span className="font-semibold text-foreground">
                  {currentQuestionIndex}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-foreground">Favorit</span>
                </div>
                <span className="font-semibold text-foreground">
                  {favorites.size}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Save className="w-4 h-4 mr-2" />
                Simpan Sesi
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Bagikan ke Mentor
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Mulai Ulang Sesi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
