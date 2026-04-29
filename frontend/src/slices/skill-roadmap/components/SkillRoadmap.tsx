"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  CheckCircle2, Circle, Lock, BookOpen, Video,
  FileText, ExternalLink, ChevronRight, Trophy,
  Code, Server, Cloud, BarChart3, Palette, Smartphone,
  Clock, Target, Star, Play, TrendingUp, Calculator,
  Users, Kanban, Handshake, Headphones, Image,
  Layout, Sparkles, Lightbulb, Search,
  GraduationCap, Heart, Building2, Truck, Landmark,
  Briefcase, DollarSign, PiggyBank, UserCog, Megaphone,
  Camera, Mic, Globe, Stethoscope, ShoppingCart,
  ChefHat, HeartHandshake, Gavel, FlaskConical, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ResponsivePageHeader } from '@/shared/components/ui/responsive-page-header';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from '@/shared/components/ui/responsive-dialog';
import { cn } from '@/shared/lib/utils';
import { notify } from "@/shared/lib/notify";
import { api } from '../../../../../convex/_generated/api';
import type { RoadmapResource as Resource } from '../types';
import { PageContainer } from '@/shared/components/layout/PageContainer';

// ---- Icon registry (expanded for all 42+ template categories) ----
const iconMap: Record<string, React.ElementType> = {
  Layout, Code, Server, Cloud, BarChart3, Palette, Smartphone,
  TrendingUp, FileText, Calculator, Users, Kanban, Handshake,
  Headphones, Image, Video, GraduationCap, Heart, Building2,
  Truck, Landmark, Briefcase, DollarSign, PiggyBank, UserCog,
  Megaphone, Camera, Mic, Globe, Stethoscope, ShoppingCart,
  ChefHat, HeartHandshake, Gavel, FlaskConical, BookOpen,
  Target, Star, Trophy,
};

const DOMAIN_LABELS: Record<string, string> = {
  tech: "Teknologi",
  business: "Bisnis",
  creative: "Kreatif",
  education: "Pendidikan",
  health: "Kesehatan",
  finance: "Keuangan",
  hr: "SDM",
  operations: "Operasional",
  government: "Pemerintahan",
  social: "Sosial",
  hospitality: "Hospitality",
};

// ---- Fallback categories (shown when DB has no templates yet) ----
const FALLBACK_CATEGORIES = [
  { id: 'frontend', name: 'Frontend Dev', icon: 'Layout', color: 'bg-blue-500', description: 'HTML, CSS, JavaScript, React', domain: 'tech', nodeCount: 5, totalHours: 170, isSystem: true as const, authorName: null as string | null },
  { id: 'backend', name: 'Backend Dev', icon: 'Server', color: 'bg-green-500', description: 'Node.js, Express, REST API', domain: 'tech', nodeCount: 4, totalHours: 110, isSystem: true as const, authorName: null as string | null },
];

// ---- Types ----

interface SimpleRoadmapNode {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  resources: Resource[];
  children?: SimpleRoadmapNode[];
}

// ---- Hardcoded fallback (used when DB templates are not seeded yet) ----

const mkNode = (
  id: string, title: string, description: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  hours: number, prereqs: string[], resources: Resource[],
): SimpleRoadmapNode => ({ id, title, description, difficulty, estimatedHours: hours, prerequisites: prereqs, resources });

function generateFallbackNodes(categoryId: string): SimpleRoadmapNode[] {
  const roadmaps: Record<string, SimpleRoadmapNode[]> = {
    frontend: [
      mkNode('fe-1', 'HTML & CSS Dasar', 'Struktur web dan styling fundamental', 'beginner', 20, [], [
        { id: 'r1', title: 'HTML Dasar - Petani Kode', type: 'video', url: 'https://www.youtube.com/c/PetaniKode', free: true },
        { id: 'r2', title: 'CSS Fundamentals', type: 'article', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', free: true },
      ]),
      mkNode('fe-2', 'JavaScript Fundamental', 'Logika pemrograman web', 'beginner', 40, ['fe-1'], [
        { id: 'r3', title: 'JavaScript Dasar - Web Programming UNPAS', type: 'video', url: 'https://www.youtube.com/c/WebProgrammingUNPAS', free: true },
        { id: 'r4', title: 'JavaScript.info', type: 'article', url: 'https://javascript.info', free: true },
      ]),
      mkNode('fe-3', 'React.js', 'Library UI modern dari Meta', 'intermediate', 50, ['fe-2'], [
        { id: 'r5', title: 'React Dokumentasi Resmi', type: 'article', url: 'https://react.dev', free: true },
      ]),
      mkNode('fe-4', 'State Management', 'Redux, Zustand, atau Context API', 'intermediate', 25, ['fe-3'], [
        { id: 'r7', title: 'Redux Toolkit Tutorial', type: 'video', url: 'https://redux-toolkit.js.org', free: true },
      ]),
      mkNode('fe-5', 'Next.js & SSR', 'Framework React dengan Server-Side Rendering', 'advanced', 35, ['fe-3'], [
        { id: 'r8', title: 'Next.js Dokumentasi', type: 'article', url: 'https://nextjs.org', free: true },
      ]),
    ],
    backend: [
      mkNode('be-1', 'Node.js Dasar', 'Runtime JavaScript untuk server', 'beginner', 30, [], [
        { id: 'r9', title: 'Node.js Docs', type: 'documentation', url: 'https://nodejs.org', free: true },
      ]),
      mkNode('be-2', 'Express.js', 'Framework web minimalis', 'beginner', 25, ['be-1'], [
        { id: 'r10', title: 'Express Tutorial', type: 'article', url: 'https://expressjs.com', free: true },
      ]),
      mkNode('be-3', 'Database SQL', 'MySQL, PostgreSQL fundamentals', 'intermediate', 35, ['be-2'], [
        { id: 'r11', title: 'SQL Tutorial - W3Schools', type: 'article', url: 'https://www.w3schools.com/sql', free: true },
      ]),
      mkNode('be-4', 'REST API Design', 'Best practices API development', 'intermediate', 20, ['be-3'], [
        { id: 'r13', title: 'REST API Design Guide', type: 'article', url: 'https://restfulapi.net', free: true },
      ]),
    ],
  };
  return roadmaps[categoryId] ?? roadmaps['frontend'];
}

// ---- Build tree from flat DB template nodes (using parentId) ----

type TemplateNode = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  parentId?: string;
  resources: Array<{ id: string; title: string; type: string; url: string; free: boolean }>;
};

function buildTreeFromNodes(nodes: TemplateNode[]): SimpleRoadmapNode[] {
  const roots = nodes.filter((n) => !n.parentId);

  function toUiNode(n: TemplateNode): SimpleRoadmapNode {
    const childNodes = nodes.filter((c) => c.parentId === n.id).map(toUiNode);
    return {
      id: n.id,
      title: n.title,
      description: n.description,
      difficulty: (n.difficulty as SimpleRoadmapNode['difficulty']) ?? 'beginner',
      estimatedHours: n.estimatedHours,
      prerequisites: n.prerequisites,
      resources: n.resources.map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type as Resource['type'],
        url: r.url,
        free: r.free,
      })),
      children: childNodes.length > 0 ? childNodes : undefined,
    };
  }

  return roots.map(toUiNode);
}

// ---- Pure helpers ----

function getResourceIcon(type: Resource['type']) {
  switch (type) {
    case 'video': return Video;
    case 'article': return FileText;
    case 'course': return BookOpen;
    case 'book': return BookOpen;
    case 'practice': return Target;
    case 'documentation': return FileText;
    default: return ExternalLink;
  }
}

function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'Pemula';
    case 'intermediate': return 'Menengah';
    case 'advanced': return 'Lanjutan';
    default: return difficulty;
  }
}

// ---- Module-level RoadmapNodeComponent ----
// Must stay module-level so React never unmounts/remounts nodes on parent re-render.

interface RoadmapNodeProps {
  node: SimpleRoadmapNode;
  level?: number;
  completedNodes: Set<string>;
  onToggle: (nodeId: string, e: React.MouseEvent) => void;
  onSelect: (node: SimpleRoadmapNode) => void;
}

function RoadmapNodeComponent({ node, level = 0, completedNodes, onToggle, onSelect }: RoadmapNodeProps) {
  const isCompleted = completedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isLocked = node.prerequisites.length > 0 && !node.prerequisites.every(prereq => completedNodes.has(prereq));

  return (
    <div className={cn('relative', level > 0 && 'ml-8 mt-4')}>
      {level > 0 && (
        <div className="absolute -left-6 top-6 w-6 h-px bg-muted" />
      )}

      <div
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
          isCompleted
            ? 'border-success bg-success/10'
            : isLocked
              ? 'border-border bg-muted/50 opacity-60'
              : 'border-border bg-card hover:border-brand hover:shadow-md'
        )}
        onClick={() => !isLocked && onSelect(node)}
      >
        <button
          onClick={(e) => !isLocked && onToggle(node.id, e)}
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
            isCompleted
              ? 'bg-success text-brand-foreground'
              : isLocked
                ? 'bg-muted text-muted-foreground'
                : 'bg-brand-muted text-brand hover:bg-brand/30'
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : isLocked ? (
            <Lock className="w-5 h-5" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className={cn('font-semibold text-lg', isCompleted ? 'text-success' : 'text-foreground')}>
                {node.title}
              </h4>
              <p className="text-muted-foreground text-sm mt-1">{node.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                node.difficulty === 'beginner' && 'bg-success/20 text-success',
                node.difficulty === 'intermediate' && 'bg-warning/20 text-warning',
                node.difficulty === 'advanced' && 'bg-destructive/10 text-destructive',
              )}
            >
              {getDifficultyLabel(node.difficulty)}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              {node.estimatedHours} jam
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              {node.resources.length} sumber
            </div>
            {hasChildren && (
              <Badge variant="outline" className="text-xs">
                {node.children?.length} sub-topik
              </Badge>
            )}
          </div>
        </div>
      </div>

      {hasChildren && (
        <div className="relative mt-4">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-muted" />
          {node.children?.map((child) => (
            <RoadmapNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              completedNodes={completedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Main component ----

export function SkillRoadmap() {
  const [selectedCategory, setSelectedCategory] = useState('frontend');
  const [selectedNode, setSelectedNode] = useState<SimpleRoadmapNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const roadmap = useQuery(api.roadmap.queries.getUserRoadmap);
  const dbTemplates = useQuery(api.roadmap.templates.listPublicTemplates);
  const dbTemplate = useQuery(
    api.roadmap.templates.getTemplateBySlug,
    { slug: selectedCategory },
  );
  const seedRoadmap = useMutation(api.roadmap.mutations.seedRoadmap);
  const updateSkillProgress = useMutation(api.roadmap.mutations.updateSkillProgress);

  const hydrated = useRef(false);
  const hydratedRoadmapId = useRef<string | null>(null);

  useEffect(() => {
    if (roadmap === undefined) return;
    hydrated.current = true;
    if (!roadmap) return;
    const idStr = String(roadmap._id);
    if (hydratedRoadmapId.current === idStr) return;
    hydratedRoadmapId.current = idStr;
    setSelectedCategory(roadmap.careerPath);
    const done = new Set(
      roadmap.skills.filter((s) => s.status === "completed").map((s) => s.id),
    );
    setCompletedNodes(done);
  }, [roadmap]);

  // roadmapData: prefer DB template, fall back to hardcoded
  const roadmapData = useMemo<SimpleRoadmapNode[]>(() => {
    if (dbTemplate) return buildTreeFromNodes(dbTemplate.nodes);
    return generateFallbackNodes(selectedCategory);
  }, [dbTemplate, selectedCategory]);

  // Seed on category change. Wait for DB template query to resolve (undefined = loading)
  // before seeding so we never seed with stale fallback data then re-seed with real data.
  useEffect(() => {
    if (!hydrated.current) return;
    if (dbTemplate === undefined) return; // still loading — avoid double-seed
    if (roadmap && roadmap.careerPath === selectedCategory) return;

    const nodes = dbTemplate
      ? buildTreeFromNodes(dbTemplate.nodes)
      : generateFallbackNodes(selectedCategory);
    if (nodes.length === 0) return;

    function flattenNodes(list: SimpleRoadmapNode[]): SimpleRoadmapNode[] {
      return list.flatMap((n) => [n, ...flattenNodes(n.children ?? [])]);
    }
    const flat = flattenNodes(nodes);

    seedRoadmap({
      careerPath: selectedCategory,
      templateId: dbTemplate?._id,
      skills: flat.map((n, index) => ({
        id: n.id,
        name: n.title,
        category: selectedCategory,
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
    }).catch((err: unknown) => {
      notify.fromError(err, "Gagal menyimpan roadmap");
    });

    if (!roadmap || roadmap.careerPath !== selectedCategory) {
      setCompletedNodes(new Set());
    }
  }, [selectedCategory, roadmap, dbTemplate, seedRoadmap]);

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

  function countNodes(nodes: SimpleRoadmapNode[]): number {
    return nodes.reduce((sum, n) => sum + 1 + countNodes(n.children ?? []), 0);
  }
  const totalNodes = countNodes(roadmapData);
  const progress = totalNodes > 0 ? Math.round((completedNodes.size / totalNodes) * 100) : 0;

  // Category list from DB; fall back to hardcoded when DB is empty
  const allCategories = useMemo(() => {
    if (dbTemplates === undefined) return []; // still loading
    if (dbTemplates.length === 0) return FALLBACK_CATEGORIES;
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
    }));
  }, [dbTemplates]);

  const domains = useMemo(
    () => ['all', ...Array.from(new Set(allCategories.map((c) => c.domain)))],
    [allCategories],
  );

  const filteredCategories = useMemo(() => {
    let list = allCategories;
    if (domainFilter !== 'all') list = list.filter((c) => c.domain === domainFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [allCategories, domainFilter, search]);

  const activeCategory = allCategories.find((c) => c.id === selectedCategory);

  const templatesLoading = dbTemplates === undefined;

  return (
    <PageContainer size="lg">
      <ResponsivePageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-brand-foreground" />
            </span>
            Roadmap Skill
          </span>
        }
        description="Jalur pembelajaran terstruktur untuk menguasai skill yang diminati"
      />

      {/* Category browser */}
      <div className="space-y-4 mb-8">
        {/* Domain filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(templatesLoading ? [] : domains).map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                domainFilter === d
                  ? 'bg-brand text-brand-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {d === 'all' ? 'Semua' : (DOMAIN_LABELS[d] ?? d)}
            </button>
          ))}
          {templatesLoading && (
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari roadmap..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category grid */}
        {templatesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {allCategories.length === 0
              ? "Belum ada template. Admin dapat memuat template default dari panel admin."
              : "Tidak ada roadmap yang cocok."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {filteredCategories.map((cat) => {
              const Icon = iconMap[cat.icon] ?? Code;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  title={cat.description}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    isSelected
                      ? 'border-brand bg-brand-muted'
                      : 'border-border bg-card hover:border-brand hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    cat.color,
                    isSelected && 'ring-4 ring-brand',
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={cn(
                    'text-xs font-medium text-center leading-tight',
                    isSelected ? 'text-brand' : 'text-foreground',
                  )}>
                    {cat.name}
                  </span>
                  {cat.nodeCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">{cat.nodeCount} topik</span>
                  )}
                  {!cat.isSystem && cat.authorName && (
                    <span className="text-[9px] bg-muted text-muted-foreground rounded px-1 py-0.5 leading-none truncate max-w-full">
                      by {cat.authorName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Roadmap tree */}
        <div className="lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {activeCategory?.name ?? selectedCategory}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeCategory?.description ?? 'Selesaikan setiap topik untuk membuka level berikutnya'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand">{progress}%</div>
                  <div className="text-xs text-muted-foreground">Selesai</div>
                </div>
              </div>
              <Progress value={progress} className="mt-4 h-2" />
            </CardHeader>
            <CardContent className="pt-6">
              {dbTemplate === undefined ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {roadmapData.map((n) => (
                    <RoadmapNodeComponent
                      key={n.id}
                      node={n}
                      completedNodes={completedNodes}
                      onToggle={toggleNodeCompletion}
                      onSelect={setSelectedNode}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Progres Anda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-brand-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-brand" />
                    <span className="text-sm font-medium text-foreground">Topik Selesai</span>
                  </div>
                  <span className="font-bold text-brand">{completedNodes.size}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-foreground">Estimasi Jam Belajar</span>
                  </div>
                  <span className="font-bold text-success">
                    {activeCategory?.totalHours ?? roadmapData.reduce((s, n) => s + n.estimatedHours, 0)}+
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-warning" />
                    <span className="text-sm font-medium text-foreground">Total Topik</span>
                  </div>
                  <span className="font-bold text-warning">{totalNodes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top resources from first uncompleted node */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Sumber Belajar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(roadmapData.find((n) => !completedNodes.has(n.id)) ?? roadmapData[0])
                  ?.resources.slice(0, 3).map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-brand hover:bg-brand-muted transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{resource.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-muted-foreground capitalize">{resource.type}</span>
                            {resource.free && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-success/20 text-success">Gratis</Badge>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                      </a>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-brand-muted to-brand-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-brand-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-brand">Tips Belajar</h4>
                  <ul className="text-sm text-brand mt-2 space-y-1">
                    <li>• Belajar secara konsisten setiap hari</li>
                    <li>• Praktikkan dengan membuat proyek nyata</li>
                    <li>• Bergabung dengan komunitas praktisi</li>
                    <li>• Dokumentasikan progres Anda</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Detail Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          {selectedNode && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    completedNodes.has(selectedNode.id) ? 'bg-success' : 'bg-brand',
                  )}>
                    {completedNodes.has(selectedNode.id) ? (
                      <CheckCircle2 className="w-6 h-6 text-brand-foreground" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-brand-foreground" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedNode.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      selectedNode.difficulty === 'beginner' && 'bg-success/20 text-success',
                      selectedNode.difficulty === 'intermediate' && 'bg-warning/20 text-warning',
                      selectedNode.difficulty === 'advanced' && 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {getDifficultyLabel(selectedNode.difficulty)}
                  </Badge>
                  <Badge variant="secondary" className="bg-muted">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedNode.estimatedHours} jam
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Sumber Belajar</h4>
                  <div className="space-y-3">
                    {selectedNode.resources.map((resource) => {
                      const Icon = getResourceIcon(resource.type);
                      return (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-brand hover:bg-brand-muted transition-all duration-200"
                        >
                          <div className="w-12 h-12 rounded-xl bg-brand-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-brand" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{resource.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">{resource.type}</Badge>
                              {resource.free && (
                                <Badge variant="secondary" className="text-xs bg-success/20 text-success">Gratis</Badge>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-muted-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {selectedNode.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Prasyarat</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.prerequisites.map((prereq) => (
                        <Badge
                          key={prereq}
                          variant="secondary"
                          className={cn(completedNodes.has(prereq) && 'bg-success/20 text-success')}
                        >
                          {nodeIdToTitle.get(prereq) ?? prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    className={cn(
                      'w-full',
                      completedNodes.has(selectedNode.id) ? 'bg-success hover:bg-success' : 'bg-brand hover:bg-brand',
                    )}
                    onClick={(e) => toggleNodeCompletion(selectedNode.id, e)}
                  >
                    {completedNodes.has(selectedNode.id) ? (
                      <><CheckCircle2 className="w-5 h-5 mr-2" />Tandai Belum Selesai</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2" />Tandai Selesai</>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
