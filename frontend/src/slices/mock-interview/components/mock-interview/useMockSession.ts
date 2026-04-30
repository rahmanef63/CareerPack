"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { indonesianInterviewQuestions } from "@/shared/data/indonesianData";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const FAV_KEY = "careerpack:mock-favorites";

export function useMockSession() {
  const [activeTab, setActiveTab] = useState("practice");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(FAV_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
      return new Set();
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const createMockInterview = useMutation(api.mockInterview.mutations.createMockInterview);
  const completeInterview = useMutation(api.mockInterview.mutations.completeInterview);
  const updateAnswer = useMutation(api.mockInterview.mutations.updateInterviewAnswer);
  const analytics = useQuery(api.mockInterview.queries.getInterviewAnalytics);
  const interviewIdRef = useRef<Id<"mockInterviews"> | null>(null);
  const historyLabel = analytics
    ? `${analytics.completedSessions} sesi selesai · rata-rata ${analytics.avgScore}`
    : null;

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

  const filteredQuestions = useMemo(
    () =>
      selectedCategory
        ? indonesianInterviewQuestions.filter((q) => q.category === selectedCategory)
        : indonesianInterviewQuestions,
    [selectedCategory],
  );

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const categories = useMemo(
    () => [...new Set(indonesianInterviewQuestions.map((q) => q.category))],
    [],
  );

  const startSession = async () => {
    if (isStarting || sessionStartedAt) return;
    setIsStarting(true);
    setSessionStartedAt(Date.now());
    setElapsedMs(0);
    try {
      const id = await createMockInterview({
        type: selectedCategory ?? "general",
        role: "General",
        difficulty: "medium",
        questions: filteredQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          category: q.category,
        })),
      });
      interviewIdRef.current = id;
    } catch (err) {
      notify.fromError(err, "Gagal memulai sesi");
      interviewIdRef.current = null;
      setSessionStartedAt(null);
    } finally {
      setIsStarting(false);
    }
  };

  const persistCurrentAnswer = async () => {
    const id = interviewIdRef.current;
    const answer = userAnswer.trim();
    if (!id || !answer || !currentQuestion) return;
    try {
      await updateAnswer({
        interviewId: id,
        questionId: currentQuestion.id,
        answer,
      });
    } catch {
      // Non-fatal; completion will still land.
    }
  };

  const nextQuestion = async () => {
    await persistCurrentAnswer();
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowAnswer(false);
      setUserAnswer("");
    } else {
      const score = Math.floor(Math.random() * 30) + 70;
      setSessionComplete(true);
      setSessionScore(score);
      const id = interviewIdRef.current;
      if (id && sessionStartedAt) {
        const durationSec = Math.round((Date.now() - sessionStartedAt) / 1000);
        try {
          await completeInterview({
            interviewId: id,
            overallScore: score,
            feedback: "Sesi selesai.",
            duration: durationSec,
          });
          notify.success("Hasil sesi tersimpan", { duration: 2500 });
        } catch (err) {
          notify.fromError(err, "Gagal menyimpan hasil");
        }
      }
    }
  };

  const resetSession = () => {
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setUserAnswer("");
    setSessionComplete(false);
    setSessionScore(0);
    setSessionStartedAt(null);
    setElapsedMs(0);
    interviewIdRef.current = null;
  };

  const toggleFavorite = (questionId: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) newSet.delete(questionId);
      else newSet.add(questionId);
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify([...newSet]));
      } catch {
        // localStorage full / disabled — favorites stay in memory only.
      }
      return newSet;
    });
  };

  return {
    activeTab, setActiveTab,
    currentQuestionIndex, setCurrentQuestionIndex,
    isRecording, setIsRecording,
    showAnswer, setShowAnswer,
    userAnswer, setUserAnswer,
    sessionComplete, sessionScore,
    favorites, toggleFavorite,
    selectedCategory, setSelectedCategory,
    sessionStartedAt, isStarting,
    elapsedLabel,
    filteredQuestions, currentQuestion, categories,
    historyLabel,
    startSession, nextQuestion, resetSession,
  };
}
