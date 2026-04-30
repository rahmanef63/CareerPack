import {
  asBool, asISODate, asString, asStringArray, isHttpUrl, optString, pickEnum,
} from "./primitives";

export interface SanitizedPortfolio {
  title: string;
  description: string;
  category: "project" | "certification" | "publication";
  link?: string;
  techStack: string[];
  date: string;
  featured: boolean;
  coverEmoji?: string;
  coverGradient?: string;
}

export function sanitizePortfolioItem(raw: unknown): SanitizedPortfolio | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = asString(r.title, 200);
  const description = asString(r.description, 1000);
  const date = asISODate(r.date);
  if (!title || !description || !date) return null;
  const category = pickEnum<"project" | "certification" | "publication">(
    r.category,
    ["project", "certification", "publication"],
    "project",
  );
  return {
    title,
    description,
    category,
    link: isHttpUrl(r.link),
    techStack: asStringArray(r.techStack, 20, 60),
    date,
    featured: asBool(r.featured),
    coverEmoji: optString(r.coverEmoji, 8),
    coverGradient: optString(r.coverGradient, 60),
  };
}
