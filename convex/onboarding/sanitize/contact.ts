import {
  asBool, asString, isHttpUrl, optString, pickEnum,
} from "./primitives";

export interface SanitizedContact {
  name: string;
  role: string;
  company?: string;
  position?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  notes?: string;
  favorite: boolean;
  lastInteraction: number;
}

const CONTACT_ROLES = ["recruiter", "mentor", "peer", "other"] as const;

export function sanitizeContact(raw: unknown): SanitizedContact | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = asString(r.name, 200);
  if (!name) return null;
  return {
    name,
    role: pickEnum(r.role, CONTACT_ROLES, "other"),
    company: optString(r.company, 200),
    position: optString(r.position, 200),
    email: optString(r.email, 120),
    phone: optString(r.phone, 30),
    linkedinUrl: isHttpUrl(r.linkedinUrl),
    notes: optString(r.notes, 2000),
    favorite: asBool(r.favorite),
    lastInteraction: Date.now(),
  };
}
