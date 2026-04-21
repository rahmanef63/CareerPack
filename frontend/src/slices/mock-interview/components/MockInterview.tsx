"use client";

import { useEffect, useState } from 'react';
import {
  MessageSquare, Pause, Mic,
  Video, CheckCircle2,
  Lightbulb, ChevronRight, Star, Clock, Trophy,
  Save, Share2, RotateCcw, Play, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ResponsivePageHeader } from '@/shared/components/ui/responsive-page-header';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Progress } from '@/shared/components/ui/progress';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { indonesianInterviewQuestions, indonesianDifficultyLabels } from '@/shared/data/indonesianData';

const categoryLabels: Record<string, string> = {
  behavioral: 'Perilaku',
  technical: 'Teknis',
  situational: 'Situasional',
  'company-specific': 'Spesifik Perusahaan',
};

export function MockInterview() {
  const [activeTab, setActiveTab] = useState('practice');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Timer: null = session hasn't started. Elapsed recomputed via interval while active.
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!sessionStartedAt || sessionComplete) return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - sessionStartedAt);
    }, 1000);
    return () => window.clearInterval(id);
  }, [sessionStartedAt, sessionComplete]);

  const elapsedLabel = (() => {
    if (!sessionStartedAt) return "—";
    const totalSec = Math.floor(elapsedMs / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  })();

  const startSession = () => {
    setSessionStartedAt(Date.now());
    setElapsedMs(0);
  };

  const filteredQuestions = selectedCategory 
    ? indonesianInterviewQuestions.filter(q => q.category === selectedCategory)
    : indonesianInterviewQuestions;

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const categories = [...new Set(indonesianInterviewQuestions.map(q => q.category))];

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
      setUserAnswer('');
    } else {
      setSessionComplete(true);
      setSessionScore(Math.floor(Math.random() * 30) + 70);
    }
  };

  const resetSession = () => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setUserAnswer('');
    setSessionComplete(false);
    setSessionScore(0);
    setSessionStartedAt(null);
    setElapsedMs(0);
  };

  const toggleFavorite = (questionId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/20 text-success';
      case 'medium': return 'bg-warning/20 text-warning';
      case 'hard': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  if (sessionComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-border">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-brand-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Sesi Selesai!</h2>
            <p className="text-muted-foreground mb-8">Bagus! Anda telah menyelesaikan sesi latihan wawancara</p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
              <div className="p-4 bg-brand-muted rounded-xl">
                <p className="text-3xl font-bold text-brand">{sessionScore}%</p>
                <p className="text-sm text-brand">Skor Keseluruhan</p>
              </div>
              <div className="p-4 bg-success/10 rounded-xl">
                <p className="text-3xl font-bold text-success">{filteredQuestions.length}</p>
                <p className="text-sm text-success">Pertanyaan</p>
              </div>
              <div className="p-4 bg-accent/50 rounded-xl">
                <p className="text-3xl font-bold text-brand">15m</p>
                <p className="text-sm text-brand">Durasi</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={resetSession} className="bg-brand hover:bg-brand">
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ResponsivePageHeader
        title="Simulasi Wawancara"
        description="Latih dengan pertanyaan wawancara umum dan dapatkan feedback instan"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="space-y-1">
          <TabsList variant="equal" cols={2}>
            <TabsTrigger value="practice">Mode Latihan</TabsTrigger>
            <TabsTrigger value="questions">Bank Soal</TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground">
            {activeTab === "practice"
              ? "Jawab satu per satu dengan timer berjalan."
              : "Jelajahi kumpulan pertanyaan tanpa sesi — baik untuk persiapan."}
          </p>
        </div>

        <TabsContent value="practice" className="space-y-6">
          {!sessionStartedAt ? (
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
                <Button onClick={startSession} className="gap-2 bg-brand hover:bg-brand">
                  <Play className="h-4 w-4" />
                  Mulai Sesi
                </Button>
              </CardContent>
            </Card>
          ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Practice Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress */}
              <Card className="border-border">
                <CardContent className="py-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progres sesi</span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {currentQuestionIndex + 1} / {filteredQuestions.length}
                    </span>
                  </div>
                  <Progress
                    value={((currentQuestionIndex + 1) / filteredQuestions.length) * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {/* Question Card */}
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
                      onClick={() => toggleFavorite(currentQuestion.id)}
                    >
                      <Star 
                        className={cn(
                          'w-5 h-5',
                          favorites.has(currentQuestion.id) 
                            ? 'fill-amber-400 text-warning/80' 
                            : 'text-muted-foreground'
                        )} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-foreground mb-6">
                    {currentQuestion.question}
                  </h3>

                  {/* Recording Area */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant={isRecording ? 'destructive' : 'default'}
                        size="lg"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                          'rounded-full px-8',
                          !isRecording && 'bg-brand hover:bg-brand'
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
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tips & Answer */}
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
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>

                  {showAnswer && currentQuestion.sampleAnswer && (
                    <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/30">
                      <p className="font-medium text-success mb-2">Contoh Jawaban:</p>
                      <p className="text-success text-sm">{currentQuestion.sampleAnswer}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      {showAnswer ? 'Sembunyikan' : 'Tampilkan'} Contoh Jawaban
                    </Button>
                    <Button onClick={nextQuestion} className="bg-brand hover:bg-brand">
                      Pertanyaan Selanjutnya
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
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
                      <span className="font-semibold text-foreground tabular-nums">{elapsedLabel}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-foreground">Dijawab</span>
                      </div>
                      <span className="font-semibold text-foreground">{currentQuestionIndex}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-foreground">Favorit</span>
                      </div>
                      <span className="font-semibold text-foreground">{favorites.size}</span>
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
                    <Button variant="outline" className="w-full justify-start" onClick={resetSession}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Mulai Ulang Sesi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-brand' : ''}
            >
              Semua Pertanyaan
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-brand' : ''}
              >
                {categoryLabels[category]}
              </Button>
            ))}
          </div>

          {/* Question List */}
          <div className="grid gap-4">
            {filteredQuestions.map((question, index) => (
              <Card 
                key={question.id} 
                className={cn(
                  'border-border cursor-pointer hover:border-brand transition-all duration-200',
                  currentQuestionIndex === index && 'border-brand bg-brand-muted'
                )}
                onClick={() => {
                  setCurrentQuestionIndex(index);
                  setActiveTab('practice');
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {indonesianDifficultyLabels[question.difficulty]}
                        </Badge>
                        <Badge variant="secondary" className="bg-muted">
                          {categoryLabels[question.category]}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground">{question.question}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(question.id);
                      }}
                    >
                      <Star 
                        className={cn(
                          'w-5 h-5',
                          favorites.has(question.id) 
                            ? 'fill-amber-400 text-warning/80' 
                            : 'text-muted-foreground'
                        )} 
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
