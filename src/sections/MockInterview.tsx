import { useState } from 'react';
import { 
  MessageSquare, Pause, Mic, 
  Video, CheckCircle2,
  Lightbulb, ChevronRight, Star, Clock, Trophy,
  Save, Share2, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { indonesianInterviewQuestions, indonesianDifficultyLabels } from '@/data/indonesianData';

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
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (sessionComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-career-500 to-career-700 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Sesi Selesai!</h2>
            <p className="text-slate-600 mb-8">Bagus! Anda telah menyelesaikan sesi latihan wawancara</p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-lg mx-auto mb-8">
              <div className="p-4 bg-career-50 rounded-xl">
                <p className="text-3xl font-bold text-career-600">{sessionScore}%</p>
                <p className="text-sm text-career-700">Skor Keseluruhan</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-3xl font-bold text-green-600">{filteredQuestions.length}</p>
                <p className="text-sm text-green-700">Pertanyaan</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-3xl font-bold text-purple-600">15m</p>
                <p className="text-sm text-purple-700">Durasi</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={resetSession} className="bg-career-600 hover:bg-career-700">
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Simulasi Wawancara</h1>
        <p className="text-slate-600 mt-2">Latih dengan pertanyaan wawancara umum dan dapatkan feedback instan</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="practice">Mode Latihan</TabsTrigger>
          <TabsTrigger value="questions">Bank Soal</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Practice Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">Pertanyaan</span>
                  <span className="font-semibold text-slate-900">
                    {currentQuestionIndex + 1} / {filteredQuestions.length}
                  </span>
                </div>
                <Progress 
                  value={((currentQuestionIndex + 1) / filteredQuestions.length) * 100} 
                  className="w-32 h-2" 
                />
              </div>

              {/* Question Card */}
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {indonesianDifficultyLabels[currentQuestion.difficulty]}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100">
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
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-400'
                        )} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-slate-900 mb-6">
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
                          !isRecording && 'bg-career-600 hover:bg-career-700'
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
                      <div className="flex items-center justify-center gap-2 text-red-500 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
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
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Tips untuk Pertanyaan Ini
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {currentQuestion.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>

                  {showAnswer && currentQuestion.sampleAnswer && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium text-green-800 mb-2">Contoh Jawaban:</p>
                      <p className="text-green-700 text-sm">{currentQuestion.sampleAnswer}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAnswer(!showAnswer)}
                    >
                      {showAnswer ? 'Sembunyikan' : 'Tampilkan'} Contoh Jawaban
                    </Button>
                    <Button onClick={nextQuestion} className="bg-career-600 hover:bg-career-700">
                      Pertanyaan Selanjutnya
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Statistik Sesi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-700">Waktu Berlalu</span>
                      </div>
                      <span className="font-semibold text-slate-900">12:34</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-700">Dijawab</span>
                      </div>
                      <span className="font-semibold text-slate-900">{currentQuestionIndex}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-slate-500" />
                        <span className="text-sm text-slate-700">Favorit</span>
                      </div>
                      <span className="font-semibold text-slate-900">{favorites.size}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
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
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-career-600' : ''}
            >
              Semua Pertanyaan
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-career-600' : ''}
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
                  'border-slate-200 cursor-pointer hover:border-career-300 transition-all duration-200',
                  currentQuestionIndex === index && 'border-career-500 bg-career-50'
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
                        <Badge variant="secondary" className="bg-slate-100">
                          {categoryLabels[question.category]}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-900">{question.question}</p>
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
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-slate-400'
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
