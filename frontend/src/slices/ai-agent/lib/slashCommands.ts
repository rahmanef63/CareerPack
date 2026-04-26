"use client";

import type { AgentAction } from "./agentActions";

export interface SlashCommand {
  cmd: string;
  description: string;
  example: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/cv", description: "Auto-isi CV dari deskripsi singkat", example: "/cv saya fresh grad TI ingin jadi backend dev" },
  { cmd: "/roadmap", description: "Buat roadmap karir multi-bulan", example: "/roadmap product manager" },
  { cmd: "/review", description: "Review CV dan beri skor", example: "/review" },
  { cmd: "/interview", description: "Mulai simulasi wawancara", example: "/interview frontend" },
  { cmd: "/match", description: "Rekomendasi 3 lowongan cocok", example: "/match" },
];

export interface AgentReply {
  text: string;
  actions: AgentAction[];
}

/**
 * Heuristic agent — runs entirely client-side (mirrors generateFallbackResponse).
 * Returns an explanation plus typed actions the user can approve.
 */
export function runAgent(userInput: string): AgentReply {
  const trimmed = userInput.trim();
  const lower = trimmed.toLowerCase();

  // Slash commands
  if (lower.startsWith("/cv")) {
    const desc = trimmed.replace(/^\/cv\s*/i, "") || "fresh graduate teknik informatika";
    return {
      text:
        `Saya susun draf pengalaman dari deskripsi: "${desc}".\n\n` +
        `Klik **Terapkan** untuk menambahkan ke CV Anda. Saya juga bisa memperbaiki ringkasan profesional sekaligus.`,
      actions: [
        {
          type: "cv.fillExperience",
          payload: {
            company: "Proyek Mandiri / Magang",
            position: deriveRole(desc),
            startDate: "2024-01",
            endDate: "",
            description:
              `Membangun pengalaman relevan di bidang ${desc}. Berkontribusi pada delivery proyek end-to-end, ` +
              `kolaborasi dalam tim agile, dan dokumentasi teknis yang rapi.`,
          },
        },
        {
          type: "cv.improveSummary",
          payload: {
            summary:
              `Lulusan/profesional muda dengan minat kuat di ${desc}. Terbiasa belajar mandiri, ` +
              `kolaboratif, dan fokus pada hasil yang terukur. Tertarik mengembangkan karir di tim teknis yang dinamis.`,
          },
        },
      ],
    };
  }

  if (lower.startsWith("/roadmap")) {
    const goal = trimmed.replace(/^\/roadmap\s*/i, "") || "product manager";
    return {
      text:
        `Berikut roadmap **6 bulan** untuk menjadi *${goal}*. ` +
        `Saya akan plot milestone bulanan dengan resource. Setujui untuk membuat roadmap di halaman Roadmap Karir.`,
      actions: [
        { type: "roadmap.generate", payload: { goal, months: 6 } },
        { type: "nav.go", payload: { view: "roadmap" } },
      ],
    };
  }

  if (lower.startsWith("/review")) {
    return {
      text:
        `Saya scan CV Anda dan beri skor heuristik (0–100):\n\n` +
        `• **Ringkasan**: cek panjang & kata kunci industri\n` +
        `• **Pengalaman**: cek bullet terukur (angka, dampak)\n` +
        `• **Skill**: cek balance technical vs soft\n\n` +
        `Klik **Buka** untuk melihat skor di halaman CV.`,
      actions: [{ type: "nav.go", payload: { view: "cv" } }],
    };
  }

  if (lower.startsWith("/interview")) {
    const topic = trimmed.replace(/^\/interview\s*/i, "") || "umum";
    return {
      text: `Siap! Saya akan mulai simulasi wawancara topik **${topic}**. Pertanyaan pertama akan disajikan setelah Anda setujui.`,
      actions: [
        { type: "interview.startSession", payload: { topic } },
        { type: "nav.go", payload: { view: "interview" } },
      ],
    };
  }

  if (lower.startsWith("/match")) {
    return {
      text: `Berdasarkan profil Anda, ini 3 lowongan paling cocok. Klik **Lihat** untuk membukanya.`,
      actions: [
        {
          type: "match.recommend",
          payload: {
            jobs: [
              {
                company: "Tokopedia",
                role: "Frontend Engineer (Junior)",
                reason: "Stack React/Next.js cocok dengan skill Anda",
              },
              {
                company: "Mandiri Digital",
                role: "Backend Developer Trainee",
                reason: "Program management trainee, cocok untuk fresh grad",
              },
              {
                company: "Gojek",
                role: "Product Analyst Intern",
                reason: "Lowongan analitis dengan jalur growth ke PM",
              },
            ],
          },
        },
      ],
    };
  }

  // Free-form heuristics — re-use intent detection from useAIChat fallback
  if (/(cv|resume)/i.test(trimmed)) {
    return {
      text:
        `Saya bisa bantu menyusun CV Anda. Ketik **/cv** diikuti deskripsi singkat tentang Anda, ` +
        `atau saya akan menambahkan ringkasan profesional yang lebih impactful sekarang.`,
      actions: [
        {
          type: "cv.improveSummary",
          payload: {
            summary:
              `Profesional dengan etos kerja tinggi, fokus pada problem solving dan kolaborasi tim. ` +
              `Berorientasi pada dampak terukur dan pengembangan diri berkelanjutan.`,
          },
        },
      ],
    };
  }

  if (/(wawancara|interview)/i.test(trimmed)) {
    return {
      text: `Bisa saya mulai simulasi wawancara untuk Anda? Topik default: umum.`,
      actions: [{ type: "interview.startSession", payload: { topic: "umum" } }],
    };
  }

  if (/(roadmap|skill|belajar)/i.test(trimmed)) {
    return {
      text: `Mau saya buatkan roadmap karir 6 bulan? Beritahu target Anda — atau ketik **/roadmap product manager**.`,
      actions: [{ type: "nav.go", payload: { view: "roadmap" } }],
    };
  }

  if (/(gaji|salary|penghasilan)/i.test(trimmed)) {
    return {
      text: `Saya bisa bantu hitung ekspektasi gaji. Buka Kalkulator Gaji untuk simulasi cepat.`,
      actions: [{ type: "nav.go", payload: { view: "calculator" } }],
    };
  }

  return {
    text:
      `Saya AI agent CareerPack. Saya bisa **melakukan tindakan**, bukan cuma menjawab. ` +
      `Coba salah satu slash command: **/cv**, **/roadmap**, **/review**, **/interview**, **/match**.`,
    actions: [],
  };
}

function deriveRole(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes("backend")) return "Backend Developer";
  if (lower.includes("frontend")) return "Frontend Developer";
  if (lower.includes("data")) return "Data Analyst";
  if (lower.includes("design")) return "UI/UX Designer";
  if (lower.includes("product")) return "Associate Product Manager";
  return "Junior Software Engineer";
}
