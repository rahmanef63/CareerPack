"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoPortfolioOverlay } from "@/shared/hooks/useDemoOverlay";
import type { PortfolioFormValues, PortfolioItemId } from "../types";

export function usePortfolio() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;
  const isDemo = state.isDemo;

  // Both branches must run unconditionally (rules of hooks). We pick
  // which result to expose based on isDemo.
  const items = useQuery(
    api.portfolio.queries.listPortfolio,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const createMutation = useMutation(api.portfolio.mutations.createPortfolioItem);
  const updateMutation = useMutation(api.portfolio.mutations.updatePortfolioItem);
  const removeMutation = useMutation(api.portfolio.mutations.deletePortfolioItem);
  const toggleFeaturedMutation = useMutation(
    api.portfolio.mutations.togglePortfolioFeatured,
  );

  const demo = useDemoPortfolioOverlay();

  const create = useCallback(
    (values: PortfolioFormValues) =>
      createMutation({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        coverEmoji: values.coverEmoji || undefined,
        coverGradient: values.coverGradient || undefined,
        coverStorageId: values.coverStorageId || undefined,
        link: values.link.trim() || undefined,
        techStack: values.techStack.filter((s) => s.trim().length > 0),
        date: values.date,
        featured: values.featured,
      }),
    [createMutation],
  );

  const update = useCallback(
    (id: PortfolioItemId, values: Partial<PortfolioFormValues>) =>
      updateMutation({
        itemId: id,
        title: values.title?.trim(),
        description: values.description?.trim(),
        category: values.category,
        coverEmoji: values.coverEmoji,
        coverGradient: values.coverGradient,
        coverStorageId: values.coverStorageId,
        clearCover: values.coverStorageId === undefined ? undefined : false,
        link: values.link?.trim() || undefined,
        techStack: values.techStack,
        date: values.date,
        featured: values.featured,
      }),
    [updateMutation],
  );

  const remove = useCallback(
    (id: PortfolioItemId) => removeMutation({ itemId: id }),
    [removeMutation],
  );

  const toggleFeatured = useCallback(
    (id: PortfolioItemId) => toggleFeaturedMutation({ itemId: id }),
    [toggleFeaturedMutation],
  );

  if (isDemo) return demo;

  return {
    items: items ?? [],
    isLoading: isAuthenticated && items === undefined,
    create,
    update,
    remove,
    toggleFeatured,
  };
}
