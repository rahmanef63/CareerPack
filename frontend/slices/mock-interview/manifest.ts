import { MessageSquare } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Mock-interview slice manifest — read + delete surface for the AI
 * agent. Question generation lives in the slice UI (PracticeSession)
 * because it needs an interactive role-difficulty picker; exposing it
 * to the agent without the picker would explode the args schema.
 *
 * The agent can summarise past sessions and clean stale entries.
 */
export const mockInterviewManifest: SliceManifest = {
  id: "mock-interview",
  label: "Simulasi Wawancara",
  description: "Sesi latihan wawancara dengan AI feedback",
  icon: MessageSquare,

  skills: [
    {
      id: "interview.list-sessions",
      label: "Lihat sesi wawancara",
      description:
        "Ambil daftar sesi mock interview user (interviewId, type, role, difficulty, overallScore, completedAt, jumlah pertanyaan terjawab). Pakai untuk 'apa hasil interview kemarin', sebelum delete-session butuh interviewId.",
      kind: "query",
    },
    {
      id: "interview.get-analytics",
      label: "Ringkasan performa wawancara",
      description:
        "Statistik agregat sesi user: total sesi, sesi selesai, rata-rata skor, breakdown per role/type. Pakai untuk 'gimana progress interview saya', 'rata-rata skor saya berapa'.",
      kind: "query",
    },
    {
      id: "interview.delete-session",
      label: "Hapus sesi wawancara",
      description:
        "Hapus 1 sesi mock interview berdasarkan interviewId. Aksi destructive — perlu approval. Panggil interview.list-sessions dulu kalau belum punya interviewId.",
      kind: "mutation",
      cta: "Hapus sesi",
      args: {
        interviewId: {
          type: "string",
          label: "ID sesi (dari interview.list-sessions)",
          required: true,
        },
      },
    },
  ],
};
