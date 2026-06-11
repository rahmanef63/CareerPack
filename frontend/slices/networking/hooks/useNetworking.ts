"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { withMutationToast } from "@/shared/lib/notify";
import { useAuth } from "@/shared/hooks/useAuth";
import { useDemoContactsOverlay } from "@/shared/hooks/useDemoOverlay";
import type { ContactFormValues, ContactId } from "../types";

export function useNetworking() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;
  const isDemo = state.isDemo;

  const contacts = useQuery(
    api.contacts.queries.listContacts,
    isAuthenticated && !isDemo ? {} : "skip",
  );
  const createMutation = useMutation(api.contacts.mutations.createContact);
  const updateMutation = useMutation(api.contacts.mutations.updateContact);
  const removeMutation = useMutation(api.contacts.mutations.deleteContact);
  const toggleFavoriteMutation = useMutation(
    api.contacts.mutations.toggleContactFavorite,
  );
  const bumpInteractionMutation = useMutation(
    api.contacts.mutations.bumpContactInteraction,
  );

  const demo = useDemoContactsOverlay();

  const create = useCallback(
    (values: ContactFormValues) =>
      createMutation({
        name: values.name.trim(),
        role: values.role,
        company: values.company.trim() || undefined,
        position: values.position.trim() || undefined,
        email: values.email.trim() || undefined,
        phone: values.phone.trim() || undefined,
        linkedinUrl: values.linkedinUrl.trim() || undefined,
        notes: values.notes.trim() || undefined,
        avatarEmoji: values.avatarEmoji || undefined,
        avatarHue: values.avatarHue || undefined,
        favorite: values.favorite,
      }),
    [createMutation],
  );

  const update = useCallback(
    (id: ContactId, values: Partial<ContactFormValues>) =>
      updateMutation({
        contactId: id,
        ...values,
      }),
    [updateMutation],
  );

  // These are fire-and-forget from icon buttons — toast on failure and
  // swallow so a rejected mutation can't surface as an unhandled rejection.
  const remove = useCallback(
    (id: ContactId) =>
      withMutationToast(() => removeMutation({ contactId: id }), {
        success: "Kontak dihapus",
        error: "Gagal menghapus kontak",
      }).catch(() => {}),
    [removeMutation],
  );

  const toggleFavorite = useCallback(
    (id: ContactId) =>
      withMutationToast(() => toggleFavoriteMutation({ contactId: id }), {
        error: "Gagal memperbarui favorit",
      }).catch(() => {}),
    [toggleFavoriteMutation],
  );

  const bumpInteraction = useCallback(
    (id: ContactId) =>
      withMutationToast(() => bumpInteractionMutation({ contactId: id }), {
        error: "Gagal memperbarui interaksi",
      }).catch(() => {}),
    [bumpInteractionMutation],
  );

  if (isDemo) return demo;

  return {
    contacts: contacts ?? [],
    isLoading: isAuthenticated && contacts === undefined,
    create,
    update,
    remove,
    toggleFavorite,
    bumpInteraction,
  };
}
