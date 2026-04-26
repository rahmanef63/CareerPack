import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

/**
 * Portfolio item as returned by `api.portfolio.queries.listPortfolio`. The
 * server resolves `coverStorageId` → `coverUrl` inline so cards don't
 * each issue a getFileUrl round-trip. Optional so callers building
 * items manually (form draft state) don't need to populate it.
 */
export type PortfolioItem = Doc<"portfolioItems"> & {
  coverUrl?: string | null;
};
export type PortfolioItemId = Id<"portfolioItems">;

export type PortfolioCategory = "project" | "certification" | "publication";
export type PortfolioFilter = "all" | PortfolioCategory;

export interface PortfolioFormValues {
  title: string;
  description: string;
  category: PortfolioCategory;
  coverEmoji: string;
  coverGradient: string;
  coverStorageId?: string;
  link: string;
  techStack: string[];
  date: string;
  featured: boolean;
}
