"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { ContactFormValues, ContactId } from "../types";

export function useNetworking() {
  const contacts = useQuery(api.networking.listContacts);
  const create = useMutation(api.networking.createContact);
  const update = useMutation(api.networking.updateContact);
  const remove = useMutation(api.networking.deleteContact);
  const toggleFavorite = useMutation(api.networking.toggleContactFavorite);
  const bumpInteraction = useMutation(api.networking.bumpContactInteraction);

  return {
    contacts: contacts ?? [],
    isLoading: contacts === undefined,
    create: (values: ContactFormValues) =>
      create({
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
    update: (id: ContactId, values: Partial<ContactFormValues>) =>
      update({
        contactId: id,
        ...values,
      }),
    remove: (id: ContactId) => remove({ contactId: id }),
    toggleFavorite: (id: ContactId) => toggleFavorite({ contactId: id }),
    bumpInteraction: (id: ContactId) => bumpInteraction({ contactId: id }),
  };
}
