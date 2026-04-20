import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export type PortfolioItem = Doc<"portfolioItems">;
export type PortfolioItemId = Id<"portfolioItems">;

export type PortfolioCategory = "project" | "certification" | "publication";
export type PortfolioFilter = "all" | PortfolioCategory;

export interface PortfolioFormValues {
  title: string;
  description: string;
  category: PortfolioCategory;
  coverEmoji: string;
  coverGradient: string;
  link: string;
  techStack: string[];
  date: string;
  featured: boolean;
}
