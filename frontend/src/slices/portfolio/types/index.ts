import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

export type PortfolioItemId = Id<"portfolioItems">;

export type PortfolioMediaKind = "image" | "video" | "pdf" | "file";
export type PortfolioLinkKind =
  | "live"
  | "repo"
  | "case-study"
  | "slides"
  | "video"
  | "article"
  | "store"
  | "other";

export interface PortfolioMedia {
  storageId: string;
  kind: PortfolioMediaKind | string;
  caption?: string;
  /** Resolved on the server side. */
  url?: string | null;
}

export interface PortfolioLink {
  url: string;
  label: string;
  kind: PortfolioLinkKind | string;
}

/**
 * Portfolio item as returned by `api.portfolio.queries.listPortfolio`.
 * Server resolves cover + every media[].url, so cards/dialogs render
 * without per-item round-trips.
 */
export type PortfolioItem = Omit<Doc<"portfolioItems">, "media"> & {
  coverUrl?: string | null;
  /** Server resolves each media[].url; undefined while query is loading. */
  media?: PortfolioMedia[];
};

export type PortfolioCategory =
  | "project"
  | "certification"
  | "publication"
  | "design"
  | "writing"
  | "speaking"
  | "award"
  | "openSource"
  | "volunteer"
  | "music"
  | "photography"
  | "teaching"
  | "research"
  | "video"
  | "other";

export type PortfolioFilter = "all" | PortfolioCategory;

export interface PortfolioFormValues {
  title: string;
  description: string;
  category: PortfolioCategory;
  coverEmoji: string;
  coverGradient: string;
  /** Full media gallery; first image is auto-promoted to coverStorageId server-side. */
  media: PortfolioMedia[];
  /** Legacy single link kept for back-compat; new editors push into `links`. */
  link: string;
  links: PortfolioLink[];
  techStack: string[];
  date: string;
  featured: boolean;
  role: string;
  client: string;
  duration: string;
  outcomes: string[];
  collaborators: string[];
  skills: string[];
  brandingShow: boolean | undefined;
}
