/**
 * AgentAction contract — shared between the AI agent (publisher) and
 * every slice that subscribes via the aiActionBus (CV, roadmap, etc).
 * Lives in shared because it's consumed by multiple slices.
 */

export type AgentAction =
  | {
      type: "cv.fillExperience";
      payload: {
        company: string;
        position: string;
        startDate?: string;
        endDate?: string;
        description: string;
      };
    }
  | {
      type: "cv.improveSummary";
      payload: { summary: string };
    }
  | {
      type: "cv.addSkills";
      payload: {
        skills: Array<{
          name: string;
          category: "technical" | "soft" | "language" | "tool";
        }>;
      };
    }
  | {
      type: "cv.setFormat";
      payload: { format: "national" | "international" };
    }
  | {
      type: "roadmap.generate";
      payload: { goal: string; months: number };
    }
  | {
      type: "interview.startSession";
      payload: { topic: string };
    }
  | {
      type: "match.recommend";
      payload: { jobs: Array<{ company: string; role: string; reason: string }> };
    }
  | {
      type: "nav.go";
      payload: { view: string };
    };

export type AgentActionType = AgentAction["type"];

export interface AgentActionMeta {
  label: string;
  description: string;
  cta: string;
}

export const AGENT_ACTION_META: Record<AgentActionType, AgentActionMeta> = {
  "cv.fillExperience": {
    label: "Tambah Pengalaman ke CV",
    description: "AI akan menambahkan satu entri pengalaman baru ke CV Anda.",
    cta: "Terapkan",
  },
  "cv.improveSummary": {
    label: "Perbaiki Ringkasan Profesional",
    description: "AI menulis ulang ringkasan agar lebih berdampak.",
    cta: "Gunakan",
  },
  "cv.addSkills": {
    label: "Tambah Skill ke CV",
    description: "AI menyarankan beberapa skill relevan untuk ditambahkan.",
    cta: "Tambah Semua",
  },
  "cv.setFormat": {
    label: "Ganti Format CV",
    description: "Ubah ke format CV yang disarankan.",
    cta: "Ganti",
  },
  "roadmap.generate": {
    label: "Buat Roadmap Karir",
    description: "AI memplot roadmap multi-bulan menuju target karir Anda.",
    cta: "Buat",
  },
  "interview.startSession": {
    label: "Mulai Simulasi Wawancara",
    description: "AI akan memulai sesi simulasi wawancara interaktif.",
    cta: "Mulai",
  },
  "match.recommend": {
    label: "Rekomendasi Lowongan",
    description: "Lihat 3 lowongan yang AI cocokkan dengan profil Anda.",
    cta: "Lihat",
  },
  "nav.go": {
    label: "Buka Halaman",
    description: "Pindah ke halaman terkait.",
    cta: "Buka",
  },
};
