import { EXPERIENCE_LEVELS, type ExperienceLevel } from "../types";
import {
  asString, asStringArray, matchEnum, optString,
} from "./primitives";

export interface SanitizedProfile {
  fullName: string;
  phone?: string;
  location: string;
  targetRole: string;
  /** Only set if the input string matched a known enum value — never
   *  fabricated as a default, so patching an existing profile won't
   *  wipe the user's prior selection when AI omits this field. */
  experienceLevel?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export function sanitizeProfile(raw: unknown): SanitizedProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const fullName = asString(r.fullName, 120);
  const location = asString(r.location, 120);
  const targetRole = asString(r.targetRole, 120);
  if (!fullName || !location || !targetRole) return null;

  const result: SanitizedProfile = { fullName, location, targetRole };
  const phone = optString(r.phone, 30);
  if (phone) result.phone = phone;
  const bio = optString(r.bio, 1000);
  if (bio) result.bio = bio;
  const exp = matchEnum<ExperienceLevel>(r.experienceLevel, EXPERIENCE_LEVELS);
  if (exp) result.experienceLevel = exp;
  const skills = asStringArray(r.skills, 50, 60);
  if (skills.length > 0) result.skills = skills;
  const interests = asStringArray(r.interests, 30, 60);
  if (interests.length > 0) result.interests = interests;

  return result;
}
