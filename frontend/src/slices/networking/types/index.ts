import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export type Contact = Doc<"contacts">;
export type ContactId = Id<"contacts">;

export type ContactRole = "recruiter" | "mentor" | "peer" | "other";
export type ContactFilter = "all" | ContactRole;

export interface ContactFormValues {
  name: string;
  role: ContactRole;
  company: string;
  position: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  notes: string;
  avatarEmoji: string;
  avatarHue: string;
  favorite: boolean;
}
