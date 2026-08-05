import { asDateMs, asString, optString } from "./primitives";

/** Mirrors `APPLICATION_STATUS_WHITELIST` in convex/applications/mutations.ts.
 *  An imported row carrying anything else ("Interview", "pending", …) renders
 *  in no kanban column at all, so it is coerced rather than passed through. */
const STATUSES = new Set([
  "applied", "screening", "interview", "offer", "rejected", "withdrawn", "accepted",
]);

function pickStatus(raw: unknown): string {
  const s = (asString(raw, 30) ?? "").toLowerCase();
  return STATUSES.has(s) ? s : "applied";
}

export interface SanitizedApplication {
  company: string;
  position: string;
  location: string;
  status: string;
  appliedDate: number;
  source: string;
  salary?: string;
  notes?: string;
}

export function sanitizeApplication(raw: unknown): SanitizedApplication | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const company = asString(r.company, 200);
  const position = asString(r.position, 200);
  if (!company || !position) return null;
  let appliedDate = asDateMs(r.appliedDate);
  if (!appliedDate && typeof r.appliedDate === "number") {
    const ago = r.appliedDate;
    if (Number.isFinite(ago) && ago >= 0) {
      appliedDate = Date.now() - Math.round(ago) * 24 * 60 * 60 * 1000;
    }
  }
  if (!appliedDate) appliedDate = Date.now();
  return {
    company,
    position,
    location: asString(r.location, 200) ?? "",
    status: pickStatus(r.status),
    appliedDate,
    source: asString(r.source, 60) ?? "manual",
    salary: optString(r.salary, 60),
    notes: optString(r.notes, 2000),
  };
}
