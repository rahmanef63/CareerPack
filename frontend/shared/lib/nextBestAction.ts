/**
 * Next-best-action recommender — computes ONE prioritized task
 * for the dashboard "Aksi Hari Ini" card based on actual user state.
 * Pure function — no side effects, no Convex calls. Caller passes
 * the data they already have from their existing hooks.
 *
 * Scoring favors tasks that unblock downstream value:
 *   - Follow-ups on stale applications (90) — time-sensitive
 *   - CV completeness gap (80) — blocks applications
 *   - Interview prep cadence (60) — skill maintenance
 *   - Roadmap progress nudge (50) — long-term growth
 *
 * Highest-score candidate wins. Returns null when the user has
 * nothing urgent (then dashboard shows the generic QuickActions
 * fallback instead).
 */

import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  FileUser,
  MessageSquare,
  Map as MapIcon,
  Sparkles,
} from "lucide-react";

export interface NextAction {
  id: string;
  priority: number;
  icon: LucideIcon;
  /** Short header — verb first. */
  title: string;
  /** Single-sentence motivation / context. */
  body: string;
  /** CTA label + target route. */
  ctaLabel: string;
  href: string;
}

/** Minimal shape of each input — keep loose so callers can pass
 *  Doc<...> types directly without tight coupling. `appliedDate`
 *  accepts both unix ms (Convex raw) and ISO date string (frontend
 *  useApplications normalizes to YYYY-MM-DD). */
interface ApplicationLike {
  status?: string;
  appliedDate?: number | string;
  company?: string;
}

function toMs(v: number | string | undefined): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}
interface CVLike {
  experience?: unknown[];
  skills?: unknown[];
}
interface InterviewLike {
  completedAt?: number;
}

const DAY_MS = 86_400_000;

export function nextBestAction(args: {
  applications: ReadonlyArray<ApplicationLike>;
  cv: CVLike | null | undefined;
  interviews: ReadonlyArray<InterviewLike>;
  roadmapProgress: number | null;
}): NextAction | null {
  const candidates: NextAction[] = [];

  // 1. Stale follow-up — any application still in "applied" status
  //    older than 7 days.
  const staleApp = args.applications
    .filter((a) => {
      if (a.status !== "applied") return false;
      const ms = toMs(a.appliedDate);
      if (ms === null) return false;
      return Date.now() - ms > 7 * DAY_MS;
    })
    .sort((a, b) => (toMs(a.appliedDate) ?? 0) - (toMs(b.appliedDate) ?? 0))[0];
  if (staleApp) {
    const days = Math.floor((Date.now() - (toMs(staleApp.appliedDate) ?? 0)) / DAY_MS);
    candidates.push({
      id: "follow-up",
      priority: 90,
      icon: Briefcase,
      title: "Follow up lamaran yang menggantung",
      body: `Lamaran ke ${staleApp.company ?? "perusahaan"} sudah ${days} hari tanpa balasan. Kirim pesan tindak lanjut singkat.`,
      ctaLabel: "Buka lamaran",
      href: "/dashboard/applications",
    });
  }

  // 2. CV experience gap — fewer than 3 entries.
  const expCount = Array.isArray(args.cv?.experience) ? args.cv!.experience!.length : 0;
  if (expCount < 3) {
    candidates.push({
      id: "cv-experience",
      priority: 80,
      icon: FileUser,
      title:
        expCount === 0
          ? "Tulis pengalaman kerja pertamamu"
          : `Tambah ${3 - expCount} pengalaman kerja lagi`,
      body:
        expCount === 0
          ? "CV tanpa pengalaman kerja bikin peluang lolos ATS turun drastis. 15 menit cukup."
          : "Minimal 3 pengalaman bikin CV lebih kuat mata recruiter.",
      ctaLabel: "Buka pembuat CV",
      href: "/dashboard/cv",
    });
  }

  // 3. Interview prep cadence — no completed session in the last 7 days.
  const recentInterview = args.interviews.find(
    (i) =>
      typeof i.completedAt === "number" && Date.now() - i.completedAt < 7 * DAY_MS,
  );
  if (!recentInterview && args.applications.length > 0) {
    candidates.push({
      id: "interview-practice",
      priority: 60,
      icon: MessageSquare,
      title: "Latihan 1 pertanyaan wawancara",
      body: "5 menit sehari melatih respons STAR bikin wawancara berikutnya lebih tenang.",
      ctaLabel: "Mulai latihan",
      href: "/dashboard/interview",
    });
  }

  // 4. Roadmap — low progress prompt.
  if (args.roadmapProgress !== null && args.roadmapProgress < 20) {
    candidates.push({
      id: "roadmap-progress",
      priority: 50,
      icon: MapIcon,
      title: "Tandai satu skill yang sudah kamu kuasai",
      body: "Progress roadmap yang tumbuh pelan-pelan jauh lebih memotivasi daripada sekaligus.",
      ctaLabel: "Buka Roadmap Skill",
      href: "/dashboard/roadmap",
    });
  }

  // 5. Onboarding nudge for brand-new users — no apps AND empty CV.
  if (args.applications.length === 0 && expCount === 0) {
    candidates.push({
      id: "first-step",
      priority: 100,
      icon: Sparkles,
      title: "Mulai dari sini",
      body: "Isi profil singkat di Pengaturan → lalu buat CV pertamamu. 10 menit cukup.",
      ctaLabel: "Ke Pengaturan",
      href: "/dashboard/settings",
    });
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0] ?? null;
}
