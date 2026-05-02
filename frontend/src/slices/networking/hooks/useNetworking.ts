"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/shared/hooks/useAuth";
import type { ContactFormValues, ContactId } from "../types";

export function useNetworking() {
  const { state } = useAuth();
  const isAuthenticated = state.isAuthenticated;

  const contacts = useQuery(
    api.contacts.queries.listContacts,
    isAuthenticated ? {} : "skip",
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

  const remove = useCallback(
    (id: ContactId) => removeMutation({ contactId: id }),
    [removeMutation],
  );

  const toggleFavorite = useCallback(
    (id: ContactId) => toggleFavoriteMutation({ contactId: id }),
    [toggleFavoriteMutation],
  );

  const bumpInteraction = useCallback(
    (id: ContactId) => bumpInteractionMutation({ contactId: id }),
    [bumpInteractionMutation],
  );

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
