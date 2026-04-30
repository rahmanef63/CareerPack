import { asBool, asDateMs, asString, localId } from "./primitives";

export interface SanitizedGoal {
  title: string;
  description: string;
  category: string;
  targetDate: number;
  status: string;
  progress: number;
  milestones: Array<{ id: string; title: string; completed: boolean }>;
}

export function sanitizeGoal(raw: unknown): SanitizedGoal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title, 200);
  const description = asString(r.description, 2000);
  if (!title || !description) return null;
  let targetDate = asDateMs(r.targetDate);
  if (!targetDate && typeof r.targetDate === "number") {
    const days = r.targetDate;
    if (Number.isFinite(days) && days > 0) {
      targetDate = Date.now() + Math.round(days) * 24 * 60 * 60 * 1000;
    }
  }
  if (!targetDate) {
    targetDate = Date.now() + 90 * 24 * 60 * 60 * 1000;
  }
  const milestonesRaw = Array.isArray(r.milestones) ? r.milestones : [];
  const milestones: SanitizedGoal["milestones"] = [];
  for (const m of milestonesRaw.slice(0, 20)) {
    if (!m || typeof m !== "object") continue;
    const mr = m as Record<string, unknown>;
    const mt = asString(mr.title, 200);
    if (!mt) continue;
    milestones.push({
      id: localId("m"),
      title: mt,
      completed: asBool(mr.completed),
    });
  }
  const completed = milestones.filter((m) => m.completed).length;
  const progress =
    milestones.length === 0 ? 0 : Math.round((completed / milestones.length) * 100);
  return {
    title,
    description,
    category: asString(r.category, 60) ?? "career",
    targetDate,
    status: progress === 100 ? "completed" : "active",
    progress,
    milestones,
  };
}
