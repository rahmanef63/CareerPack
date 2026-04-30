"use client";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { useMockSession } from "./mock-interview/useMockSession";
import { SessionCompleteCard } from "./mock-interview/SessionCompleteCard";
import { PracticeSession } from "./mock-interview/PracticeSession";
import { QuestionBank } from "./mock-interview/QuestionBank";

export function MockInterview() {
  const s = useMockSession();

  if (s.sessionComplete) {
    return (
      <SessionCompleteCard
        sessionScore={s.sessionScore}
        questionCount={s.filteredQuestions.length}
        elapsedLabel={s.elapsedLabel}
        onReset={s.resetSession}
      />
    );
  }

  return (
    <PageContainer size="lg">
      <ResponsivePageHeader
        title="Simulasi Wawancara"
        description={
          s.historyLabel
            ? `Latih dengan pertanyaan wawancara umum — ${s.historyLabel}.`
            : "Latih dengan pertanyaan wawancara umum dan dapatkan feedback instan"
        }
      />

      <Tabs
        value={s.activeTab}
        onValueChange={s.setActiveTab}
        className="space-y-6"
      >
        <div className="space-y-1">
          <TabsList variant="equal" cols={2}>
            <TabsTrigger value="practice">Mode Latihan</TabsTrigger>
            <TabsTrigger value="questions">Bank Soal</TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground">
            {s.activeTab === "practice"
              ? "Jawab satu per satu dengan timer berjalan."
              : "Jelajahi kumpulan pertanyaan tanpa sesi — baik untuk persiapan."}
          </p>
        </div>

        <TabsContent value="practice" className="space-y-6">
          <PracticeSession
            sessionStartedAt={s.sessionStartedAt}
            isStarting={s.isStarting}
            filteredQuestions={s.filteredQuestions}
            currentQuestion={s.currentQuestion}
            currentQuestionIndex={s.currentQuestionIndex}
            isRecording={s.isRecording}
            showAnswer={s.showAnswer}
            userAnswer={s.userAnswer}
            favorites={s.favorites}
            elapsedLabel={s.elapsedLabel}
            onStart={s.startSession}
            onSetRecording={s.setIsRecording}
            onSetShowAnswer={s.setShowAnswer}
            onSetUserAnswer={s.setUserAnswer}
            onToggleFavorite={s.toggleFavorite}
            onNext={s.nextQuestion}
            onReset={s.resetSession}
          />
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <QuestionBank
            filteredQuestions={s.filteredQuestions}
            selectedCategory={s.selectedCategory}
            setSelectedCategory={s.setSelectedCategory}
            categories={s.categories}
            currentQuestionIndex={s.currentQuestionIndex}
            favorites={s.favorites}
            onSelect={(idx) => {
              s.setCurrentQuestionIndex(idx);
              s.setActiveTab("practice");
            }}
            onToggleFavorite={s.toggleFavorite}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
