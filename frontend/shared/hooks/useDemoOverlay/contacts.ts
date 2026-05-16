"use client";

import { useCallback, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_CONTACTS, type DemoContactSeed } from "@/shared/data/demoUser";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type {
  Contact, ContactFormValues, ContactId,
} from "@/slices/networking/types";
import { DAY } from "./_constants";

const CONTACTS_KEY = "careerpack:demo:contacts";

interface ContactsHook {
  contacts: Contact[];
  isLoading: boolean;
  create: (values: ContactFormValues) => Promise<void>;
  update: (id: ContactId, values: Partial<ContactFormValues>) => Promise<void>;
  remove: (id: ContactId) => Promise<void>;
  toggleFavorite: (id: ContactId) => Promise<void>;
  bumpInteraction: (id: ContactId) => Promise<void>;
}

function contactFromSeed(s: DemoContactSeed, now: number): Contact {
  const ts = now - s.lastInteractionDays * DAY;
  return {
    _id: s.id as unknown as Id<"contacts">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    name: s.name,
    role: s.role,
    company: s.company,
    position: s.position,
    email: s.email,
    linkedinUrl: s.linkedinUrl,
    notes: s.notes,
    avatarEmoji: s.avatarEmoji,
    avatarHue: s.avatarHue,
    lastInteraction: ts,
    favorite: s.favorite,
  };
}

export function useDemoContactsOverlay(): ContactsHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoContactSeed[]>(
    CONTACTS_KEY,
    [...DEMO_CONTACTS],
  );
  const now = Date.now();
  const contacts = useMemo(
    () => seeds.map((s) => contactFromSeed(s, now)),
    [seeds, now],
  );

  const create: ContactsHook["create"] = useCallback(
    async (values) => {
      setSeeds((prev) => [
        ...prev,
        {
          id: `c-${Date.now().toString(36)}`,
          name: values.name.trim(),
          role: values.role,
          company: values.company.trim() || undefined,
          position: values.position.trim() || undefined,
          email: values.email.trim() || undefined,
          linkedinUrl: values.linkedinUrl.trim() || undefined,
          notes: values.notes.trim() || undefined,
          avatarEmoji: values.avatarEmoji || undefined,
          avatarHue: values.avatarHue || undefined,
          lastInteractionDays: 0,
          favorite: values.favorite,
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const update: ContactsHook["update"] = useCallback(
    async (id, values) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoContactSeed = { ...s };
          if (values.name !== undefined) next.name = values.name.trim();
          if (values.role !== undefined) next.role = values.role;
          if (values.company !== undefined) next.company = values.company.trim() || undefined;
          if (values.position !== undefined) next.position = values.position.trim() || undefined;
          if (values.email !== undefined) next.email = values.email.trim() || undefined;
          if (values.linkedinUrl !== undefined) next.linkedinUrl = values.linkedinUrl.trim() || undefined;
          if (values.notes !== undefined) next.notes = values.notes.trim() || undefined;
          if (values.avatarEmoji !== undefined) next.avatarEmoji = values.avatarEmoji;
          if (values.avatarHue !== undefined) next.avatarHue = values.avatarHue;
          if (values.favorite !== undefined) next.favorite = values.favorite;
          return next;
        }),
      );
    },
    [setSeeds],
  );

  const remove: ContactsHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const toggleFavorite: ContactsHook["toggleFavorite"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
      );
    },
    [setSeeds],
  );

  const bumpInteraction: ContactsHook["bumpInteraction"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, lastInteractionDays: 0 } : s)),
      );
    },
    [setSeeds],
  );

  return {
    contacts, isLoading: false, create, update, remove, toggleFavorite, bumpInteraction,
  };
}
