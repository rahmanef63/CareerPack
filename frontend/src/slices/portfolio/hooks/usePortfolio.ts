"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { PortfolioFormValues, PortfolioItemId } from "../types";

export function usePortfolio() {
  const items = useQuery(api.portfolio.listPortfolio);
  const create = useMutation(api.portfolio.createPortfolioItem);
  const update = useMutation(api.portfolio.updatePortfolioItem);
  const remove = useMutation(api.portfolio.deletePortfolioItem);
  const toggleFeatured = useMutation(api.portfolio.togglePortfolioFeatured);

  return {
    items: items ?? [],
    isLoading: items === undefined,
    create: (values: PortfolioFormValues) =>
      create({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        coverEmoji: values.coverEmoji || undefined,
        coverGradient: values.coverGradient || undefined,
        link: values.link.trim() || undefined,
        techStack: values.techStack.filter((s) => s.trim().length > 0),
        date: values.date,
        featured: values.featured,
      }),
    update: (id: PortfolioItemId, values: Partial<PortfolioFormValues>) =>
      update({
        itemId: id,
        title: values.title?.trim(),
        description: values.description?.trim(),
        category: values.category,
        coverEmoji: values.coverEmoji,
        coverGradient: values.coverGradient,
        link: values.link?.trim() || undefined,
        techStack: values.techStack,
        date: values.date,
        featured: values.featured,
      }),
    remove: (id: PortfolioItemId) => remove({ itemId: id }),
    toggleFeatured: (id: PortfolioItemId) => toggleFeatured({ itemId: id }),
  };
}
