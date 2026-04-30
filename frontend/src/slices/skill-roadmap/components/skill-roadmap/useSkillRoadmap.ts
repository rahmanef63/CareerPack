"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../../convex/_generated/api";
import type { BrowserCategory } from "../RoadmapBrowser";
import type { SavedRoadmapCard } from "../SavedRoadmapsGrid";
import { FALLBACK_CATEGORIES } from "./constants";
import { generateFallbackNodes } from "./fallback";
import { buildTreeFromNodes, countNodes, flattenNodes } from "./treeBuilder";
import type { SimpleRoadmapNode } from "./types";

export function useSkillRoadmap() {
  // ── Core selection ─────────────────────────────────────────────────
  // `activeSlug` is null until the roadmap query resolves, so we never
  // fire a `getTemplateBySlug` query on a stale default — that was the
  // root cause of the brief frontend-tree flash on page load.
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SimpleRoadmapNode | null>(null);
  // `activeTab` defaults to null too — set once after data resolves so
  // first-timers don't see the "my" tab flash before being snapped to
  // "browse".
  const [activeTab, setActiveTab] = useState<"my" | "browse" | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>('all');
  // `selectedBrowseSlug` is decoupled from `activeSlug` — the browse
  // grid highlights the user's last pick without forcing the active
  // skill to change every time they look at the catalog.
  const [selectedBrowseSlug, setSelectedBrowseSlug] = useState<string | null>(null);

  const roadmap = useQuery(api.roadmap.queries.getUserRoadmap);
  const dbTemplates = useQuery(api.roadmap.templates.listPublicTemplates);
  const usageCounts = useQuery(api.roadmap.templates.getTemplateUsageCounts);
  const savedTemplates = useQuery(api.roadmap.saved.listSavedTemplates);
  // Skip the dbTemplate query until we know which slug to load — avoids
  // a stale-slug roundtrip before hydration.
  const dbTemplate = useQuery(
    api.roadmap.templates.getTemplateBySlug,
    activeSlug ? { slug: activeSlug } : "skip",
  );
  const seedRoadmap = useMutation(api.roadmap.mutations.seedRoadmap);
  const updateSkillProgress = useMutation(api.roadmap.mutations.updateSkillProgress);
  const removeSavedTemplate = useMutation(api.roadmap.saved.removeSavedTemplate);

  // Track which roadmap _id we've hydrated completedNodes from — only
  // re-snap the local set when the underlying doc identity changes.
  const hydratedRoadmapId = useRef<string | null>(null);
  // In-flight seed slug — suppresses re-fire of the seed effect while
  // a seed is mid-flight (Convex roadmap update arrives async).
  const seedingSlug = useRef<string | null>(null);

  // Hydrate activeSlug once roadmap doc resolves
  useEffect(() => {
    if (roadmap === undefined) return;
    if (activeSlug !== null) return;
    if (roadmap?.careerPath) {
      setActiveSlug(roadmap.careerPath);
      return;
    }
    // No roadmap doc yet — leave activeSlug null. The user will pick
    // from "Cari Skills" or saved grid; the seed effect handles it.
  }, [roadmap, activeSlug]);

  // Pull completedNodes from active roadmap doc
  useEffect(() => {
    if (!roadmap) return;
    const idStr = String(roadmap._id);
    if (hydratedRoadmapId.current === idStr) return;
    hydratedRoadmapId.current = idStr;
    const done = new Set(
      roadmap.skills.filter((s) => s.status === "completed").map((s) => s.id),
    );
    setCompletedNodes(done);
  }, [roadmap]);

  // roadmapData — build from DB template; only fall back when the
  // template explicitly returned `null` (slug not in DB). While
  // dbTemplate is `undefined` (loading) return [] so the tree never
  // flashes stale data from a previous slug.
  const roadmapData = useMemo<SimpleRoadmapNode[]>(() => {
    if (!activeSlug) return [];
    if (dbTemplate === undefined) return [];
    if (dbTemplate) return buildTreeFromNodes(dbTemplate.nodes);
    return generateFallbackNodes(activeSlug);
  }, [activeSlug, dbTemplate]);

  // First-time default: snap to Browse when user has no saved skills.
  useEffect(() => {
    if (activeTab !== null) return;
    if (roadmap === undefined) return;
    if (savedTemplates === undefined) return;
    const hasContent = (roadmap?.skills.length ?? 0) > 0 || savedTemplates.length > 0;
    setActiveTab(hasContent ? "my" : "browse");
  }, [activeTab, roadmap, savedTemplates]);

  // Seed on activeSlug change. Three guards prevent spurious seeds:
  // (1) wait for dbTemplate to resolve, (2) skip when server already
  // has this slug as the active roadmap, (3) suppress duplicate seeds
  // for the same slug while one is in flight.
  useEffect(() => {
    if (!activeSlug) return;
    if (dbTemplate === undefined) return;
    if (roadmap === undefined) return;
    if (roadmap && roadmap.careerPath === activeSlug) return;
    if (seedingSlug.current === activeSlug) return;

    const nodes = dbTemplate
      ? buildTreeFromNodes(dbTemplate.nodes)
      : generateFallbackNodes(activeSlug);
    if (nodes.length === 0) return;

    const flat = flattenNodes(nodes);

    seedingSlug.current = activeSlug;
    setCompletedNodes(new Set());
    seedRoadmap({
      careerPath: activeSlug,
      templateId: dbTemplate?._id,
      skills: flat.map((n, index) => ({
        id: n.id,
        name: n.title,
        category: activeSlug,
        level: n.difficulty,
        priority: index,
        estimatedHours: n.estimatedHours,
        prerequisites: n.prerequisites,
        resources: n.resources.map((r) => ({
          type: r.type,
          title: r.title,
          url: r.url || "#",
        })),
      })),
    })
      .catch((err: unknown) => {
        notify.fromError(err, "Gagal menyimpan roadmap");
      })
      .finally(() => {
        if (seedingSlug.current === activeSlug) seedingSlug.current = null;
      });
  }, [activeSlug, roadmap, dbTemplate, seedRoadmap]);

  const toggleNodeCompletion = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const wasCompleted = completedNodes.has(nodeId);
    const newStatus = wasCompleted ? "not-started" : "completed";

    setCompletedNodes((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(nodeId); else next.add(nodeId);
      return next;
    });

    updateSkillProgress({ skillId: nodeId, status: newStatus })
      .then(() => {
        if (wasCompleted) notify.info("Tanda selesai dibatalkan");
        else notify.success("Topik ditandai selesai", { description: "Progress roadmap diperbarui." });
      })
      .catch((err: unknown) => {
        setCompletedNodes((prev) => {
          const next = new Set(prev);
          if (wasCompleted) next.add(nodeId); else next.delete(nodeId);
          return next;
        });
        notify.fromError(err, "Gagal menyimpan progress");
      });
  };

  // Active quest = first uncompleted unlocked node (depth-first).
  const nextQuestId = useMemo<string | null>(() => {
    function find(list: SimpleRoadmapNode[]): string | null {
      for (const n of list) {
        const locked =
          n.prerequisites.length > 0 &&
          !n.prerequisites.every((p) => completedNodes.has(p));
        const done = completedNodes.has(n.id);
        if (!done && !locked) return n.id;
        if (n.children) {
          const c = find(n.children);
          if (c) return c;
        }
      }
      return null;
    }
    return find(roadmapData);
  }, [roadmapData, completedNodes]);

  // Map node ID → title for prerequisite display in the detail dialog
  const nodeIdToTitle = useMemo(() => {
    const map = new Map<string, string>();
    function collect(nodes: SimpleRoadmapNode[]) {
      for (const n of nodes) {
        map.set(n.id, n.title);
        if (n.children) collect(n.children);
      }
    }
    collect(roadmapData);
    return map;
  }, [roadmapData]);

  const totalNodes = countNodes(roadmapData);
  const progress = totalNodes > 0 ? Math.round((completedNodes.size / totalNodes) * 100) : 0;

  // BrowserCategory[] feed for the browser component
  const browserCategories: BrowserCategory[] = useMemo(() => {
    if (dbTemplates === undefined) return [];
    if (dbTemplates.length === 0) {
      return FALLBACK_CATEGORIES.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        description: c.description,
        domain: c.domain,
        nodeCount: c.nodeCount,
        totalHours: c.totalHours,
        isSystem: c.isSystem,
        authorName: c.authorName,
        tags: [],
        nodeTags: [],
        difficultyMix: { beginner: 0, intermediate: 0, advanced: 0 },
        popularity: 0,
        creationTime: 0,
      }));
    }
    return dbTemplates.map((t) => ({
      id: t.slug,
      name: t.title,
      icon: t.icon,
      color: t.color,
      description: t.description,
      domain: t.domain,
      nodeCount: t.nodeCount,
      totalHours: t.totalHours,
      isSystem: t.isSystem,
      authorName: t.authorName ?? null,
      tags: t.tags ?? [],
      nodeTags: t.nodeTags ?? [],
      difficultyMix: t.difficultyMix ?? { beginner: 0, intermediate: 0, advanced: 0 },
      popularity: usageCounts?.[String(t._id)] ?? 0,
      creationTime: t._creationTime,
    }));
  }, [dbTemplates, usageCounts]);

  const domains = useMemo(
    () => ['all', ...Array.from(new Set(browserCategories.map((c) => c.domain)))],
    [browserCategories],
  );

  // activeCategory: prefer the catalog match (has icon/color/etc), then
  // fall back to the saved-list match so the tree header still renders
  // accurate metadata for slugs that exist in saved but not browse
  // (e.g. unpublished private templates).
  const activeCategory = useMemo(() => {
    if (!activeSlug) return null;
    const fromBrowse = browserCategories.find((c) => c.id === activeSlug);
    if (fromBrowse) return fromBrowse;
    const fromSaved = savedTemplates?.find((s) => s.slug === activeSlug);
    if (!fromSaved) return null;
    return {
      id: fromSaved.slug,
      name: fromSaved.title,
      icon: fromSaved.icon,
      color: fromSaved.color,
      description: fromSaved.description,
      domain: fromSaved.domain,
      nodeCount: fromSaved.nodeCount,
      totalHours: fromSaved.totalHours,
      isSystem: fromSaved.isSystem,
      authorName: fromSaved.authorName,
      tags: fromSaved.tags,
      nodeTags: fromSaved.nodeTags,
      difficultyMix: fromSaved.difficultyMix,
      popularity: 0,
      creationTime: fromSaved._creationTime,
    } satisfies BrowserCategory;
  }, [activeSlug, browserCategories, savedTemplates]);

  const templatesLoading = dbTemplates === undefined;
  const savedLoading = savedTemplates === undefined;

  const savedCards: SavedRoadmapCard[] = useMemo(
    () =>
      (savedTemplates ?? []).map((t) => ({
        slug: t.slug,
        name: t.title,
        icon: t.icon,
        color: t.color,
        description: t.description,
        domain: t.domain,
        nodeCount: t.nodeCount,
        totalHours: t.totalHours,
        isSystem: t.isSystem,
        authorName: t.authorName,
      })),
    [savedTemplates],
  );

  // Per-saved-slug progress chip on the saved card. Only the active
  // slug has live progress (single roadmap doc); others show no chip.
  const progressBySlug = useMemo<Record<string, number>>(() => {
    if (!activeSlug || !roadmap) return {};
    if (roadmap.careerPath !== activeSlug) return {};
    return { [activeSlug]: roadmap.progress };
  }, [activeSlug, roadmap]);

  const handleActivateSaved = (slug: string) => setActiveSlug(slug);

  const handleRemoveSaved = (slug: string) => {
    removeSavedTemplate({ slug })
      .then(() => notify.info("Skill dihapus dari Skill Saya"))
      .catch((err: unknown) => notify.fromError(err, "Gagal menghapus"));
    if (activeSlug === slug) {
      const remaining = savedCards.filter((c) => c.slug !== slug);
      setActiveSlug(remaining[0]?.slug ?? null);
    }
  };

  const handleBrowseSelect = (slug: string) => {
    setSelectedBrowseSlug(slug);
    setActiveSlug(slug);
    setActiveTab("my");
  };

  return {
    activeSlug,
    selectedNode, setSelectedNode,
    activeTab, setActiveTab,
    completedNodes,
    domainFilter, setDomainFilter,
    selectedBrowseSlug,
    roadmap, dbTemplate,
    roadmapData,
    nextQuestId, nodeIdToTitle,
    totalNodes, progress,
    browserCategories, domains,
    activeCategory,
    templatesLoading, savedLoading,
    savedCards, progressBySlug,
    handleActivateSaved, handleRemoveSaved, handleBrowseSelect,
    toggleNodeCompletion,
  };
}
