"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
    // Send the real values, empty or not. Collapsing empties to `undefined`
    // here meant the update mutation read them as "field omitted, leave
    // unchanged" — so media, links, outcomes, skills, collaborators, role,
    // client and duration could be added but never removed. The backend
    // already normalises an empty array/string back to `undefined` before
    // storing (convex/portfolio/mutations.ts), so nothing downstream changes.
    media: values.media.map((m) => ({
      storageId: m.storageId,
      kind: m.kind,
      caption: m.caption,
    })),
    link: values.link.trim(),
    links: values.links,
    techStack: values.techStack.filter((s) => s.trim().length > 0),
    date: values.date,
    featured: values.featured,
    role: values.role.trim(),
    client: values.client.trim(),
    duration: values.duration.trim(),
    outcomes: values.outcomes,
    collaborators: values.collaborators,
    skills: values.skills,
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
      // `update` and `bulkRemove` used to be hardcoded no-ops here while the
      // caller still toasted success — a guest edited an item, saw "Portofolio
      // diperbarui", and the card did not move. The overlay's own `update`
      // and `remove` work fine, so just use them.
      bulkRemove: async (ids: PortfolioItemId[]) => {
        for (const id of ids) await demo.remove(id);
      },
      // Branding visibility genuinely has no demo surface to reflect it.
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
