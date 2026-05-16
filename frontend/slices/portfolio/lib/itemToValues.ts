import type { PortfolioFormValues, PortfolioItem } from "../types";
import { DEFAULT_FORM } from "../constants";

export function itemToValues(item: PortfolioItem): PortfolioFormValues {
  return {
    title: item.title,
    description: item.description,
    category: (item.category as PortfolioFormValues["category"]) ?? "project",
    coverEmoji: item.coverEmoji ?? DEFAULT_FORM.coverEmoji,
    coverGradient: item.coverGradient ?? DEFAULT_FORM.coverGradient,
    media: (item.media ?? []).map((m) => ({
      storageId: m.storageId,
      kind: m.kind,
      caption: m.caption,
      url: m.url,
    })),
    link: item.link ?? "",
    links: item.links ?? [],
    techStack: item.techStack ?? [],
    date: item.date,
    featured: item.featured,
    role: item.role ?? "",
    client: item.client ?? "",
    duration: item.duration ?? "",
    outcomes: item.outcomes ?? [],
    collaborators: item.collaborators ?? [],
    skills: item.skills ?? [],
    brandingShow: item.brandingShow,
  };
}
