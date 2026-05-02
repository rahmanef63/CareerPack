"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoPortfolioOverlay } from "@/shared/hooks/useDemoOverlay";
import type { PortfolioFormValues, PortfolioItemId } from "../types";

function valuesToPayload(values: PortfolioFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category,
    coverEmoji: values.coverEmoji || undefined,
    coverGradient: values.coverGradient || undefined,
    media: values.media.length > 0 ? values.media.map((m) => ({
      storageId: m.storageId,
      kind: m.kind,
      caption: m.caption,
    })) : undefined,
    link: values.link.trim() || undefined,
    links: values.links.length > 0 ? values.links : undefined,
    techStack: values.techStack.filter((s) => s.trim().length > 0),
    date: values.date,
    featured: values.featured,
    role: values.role.trim() || undefined,
    client: values.client.trim() || undefined,
    duration: values.duration.trim() || undefined,
    outcomes: values.outcomes.length > 0 ? values.outcomes : undefined,
    collaborators: values.collaborators.length > 0 ? values.collaborators : undefined,
    skills: values.skills.length > 0 ? values.skills : undefined,
    brandingShow: values.brandingShow,
  };
}

export function usePortfolio() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;
  const isDemo = state.isDemo;

  const items = useQuery(
    api.portfolio.queries.listPortfolio,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const createMutation = useMutation(api.portfolio.mutations.createPortfolioItem);
  const updateMutation = useMutation(api.portfolio.mutations.updatePortfolioItem);
  const removeMutation = useMutation(api.portfolio.mutations.deletePortfolioItem);
  const bulkRemoveMutation = useMutation(api.portfolio.mutations.bulkDeletePortfolioItems);
  const toggleFeaturedMutation = useMutation(
    api.portfolio.mutations.togglePortfolioFeatured,
  );
  const toggleBrandingMutation = useMutation(
    api.portfolio.mutations.togglePortfolioBrandingShow,
  );

  const demo = useDemoPortfolioOverlay();

  const create = useCallback(
    (values: PortfolioFormValues) => createMutation(valuesToPayload(values)),
    [createMutation],
  );

  const update = useCallback(
    (id: PortfolioItemId, values: PortfolioFormValues) =>
      updateMutation({ itemId: id, ...valuesToPayload(values) }),
    [updateMutation],
  );

  const remove = useCallback(
    (id: PortfolioItemId) => removeMutation({ itemId: id }),
    [removeMutation],
  );

  const bulkRemove = useCallback(
    (ids: PortfolioItemId[]) => bulkRemoveMutation({ ids }),
    [bulkRemoveMutation],
  );

  const toggleFeatured = useCallback(
    (id: PortfolioItemId) => toggleFeaturedMutation({ itemId: id }),
    [toggleFeaturedMutation],
  );

  const toggleBranding = useCallback(
    (id: PortfolioItemId, show: boolean) =>
      toggleBrandingMutation({ itemId: id, show }),
    [toggleBrandingMutation],
  );

  if (isDemo) {
    return {
      ...demo,
      update: async () => undefined,
      bulkRemove: async () => undefined,
      toggleBranding: async () => undefined,
    };
  }

  return {
    items: items ?? [],
    isLoading: isAuthenticated && items === undefined,
    create,
    update,
    remove,
    bulkRemove,
    toggleFeatured,
    toggleBranding,
  };
}
