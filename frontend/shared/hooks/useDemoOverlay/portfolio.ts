"use client";

import { useCallback, useMemo } from "react";
import { notify } from "@/shared/lib/notify";
import { useLocalStorageState } from "../useLocalStorageState";
import { DEMO_PORTFOLIO, type DemoPortfolioSeed } from "@/shared/data/demoUser";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type {
  PortfolioFormValues, PortfolioItem, PortfolioItemId,
} from "@/slices/portfolio/types";
import { DAY } from "./_constants";

const PORTFOLIO_KEY = "careerpack:demo:portfolio";

interface PortfolioHook {
  items: PortfolioItem[];
  isLoading: boolean;
  create: (values: PortfolioFormValues) => Promise<void>;
  update: (id: PortfolioItemId, values: Partial<PortfolioFormValues>) => Promise<void>;
  remove: (id: PortfolioItemId) => Promise<void>;
  toggleFeatured: (id: PortfolioItemId) => Promise<void>;
}

function portfolioFromSeed(s: DemoPortfolioSeed, now: number): PortfolioItem {
  const ts = now + s.dateOffsetDays * DAY;
  const iso = new Date(ts).toISOString().split("T")[0];
  // Branded Id<"…"> is just a string at runtime — cast through unknown so
  // downstream consumers that call APIs with this id never run (we branch
  // on isDemo before any Convex call).
  return {
    _id: s.id as unknown as Id<"portfolioItems">,
    _creationTime: ts,
    userId: "demo" as unknown as Id<"users">,
    title: s.title,
    description: s.description,
    category: s.category,
    coverEmoji: s.coverEmoji,
    coverGradient: s.coverGradient,
    link: s.link,
    techStack: s.techStack,
    date: iso,
    featured: s.featured,
    coverUrl: null,
  };
}

export function useDemoPortfolioOverlay(): PortfolioHook {
  const [seeds, setSeeds] = useLocalStorageState<DemoPortfolioSeed[]>(
    PORTFOLIO_KEY,
    [...DEMO_PORTFOLIO],
  );
  const now = Date.now();
  const items = useMemo(
    () => seeds.map((s) => portfolioFromSeed(s, now)),
    [seeds, now],
  );

  const create: PortfolioHook["create"] = useCallback(
    async (values) => {
      const offset = Math.round(
        (new Date(values.date).getTime() - Date.now()) / DAY,
      );
      setSeeds((prev) => [
        ...prev,
        {
          id: `pf-${Date.now().toString(36)}`,
          title: values.title.trim(),
          description: values.description.trim(),
          category: values.category,
          link: values.link.trim() || undefined,
          techStack: values.techStack.filter((t) => t.trim().length > 0),
          dateOffsetDays: offset,
          featured: values.featured,
          coverEmoji: values.coverEmoji || "📄",
          coverGradient: values.coverGradient || "from-slate-500 to-slate-700",
        },
      ]);
      notify.success("Tersimpan di mode demo (lokal)");
    },
    [setSeeds],
  );

  const update: PortfolioHook["update"] = useCallback(
    async (id, values) => {
      setSeeds((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: DemoPortfolioSeed = { ...s };
          if (values.title !== undefined) next.title = values.title.trim();
          if (values.description !== undefined) next.description = values.description.trim();
          if (values.category !== undefined) next.category = values.category;
          if (values.coverEmoji !== undefined) next.coverEmoji = values.coverEmoji;
          if (values.coverGradient !== undefined) next.coverGradient = values.coverGradient;
          if (values.link !== undefined) next.link = values.link.trim() || undefined;
          if (values.techStack !== undefined) next.techStack = values.techStack;
          if (values.date !== undefined) {
            next.dateOffsetDays = Math.round(
              (new Date(values.date).getTime() - Date.now()) / DAY,
            );
          }
          if (values.featured !== undefined) next.featured = values.featured;
          return next;
        }),
      );
    },
    [setSeeds],
  );

  const remove: PortfolioHook["remove"] = useCallback(
    async (id) => {
      setSeeds((prev) => prev.filter((s) => s.id !== id));
    },
    [setSeeds],
  );

  const toggleFeatured: PortfolioHook["toggleFeatured"] = useCallback(
    async (id) => {
      setSeeds((prev) =>
        prev.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s)),
      );
    },
    [setSeeds],
  );

  return { items, isLoading: false, create, update, remove, toggleFeatured };
}
