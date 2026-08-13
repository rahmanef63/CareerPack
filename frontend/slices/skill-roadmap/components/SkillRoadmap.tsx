"use client";

import { Compass, Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { RoadmapBrowser } from "./RoadmapBrowser";
import { CareerTimeMachine } from "./CareerTimeMachine";
import { GamificationPanel } from "./GamificationPanel";
import { SavedRoadmapsGrid } from "./SavedRoadmapsGrid";
import { useRoadmapGamification } from "../hooks/useRoadmapGamification";
import { DOMAIN_LABELS, iconMap } from "../constants/builder";
import { useSkillRoadmap } from "../hooks/useSkillRoadmap";
import { RoadmapNodeComponent } from "./skill-roadmap/RoadmapNodeComponent";
import { RoadmapSidebar } from "./skill-roadmap/RoadmapSidebar";
import { NodeDetailDialog } from "./skill-roadmap/NodeDetailDialog";

export function SkillRoadmap() {
  const r = useSkillRoadmap();

  // Detail surface splits by viewport: modal below `lg`, right rail at
  // `lg`+ (where the rail is on screen and the tree stays visible). The
  // hook is the same `< lg` breakpoint the app shell uses, so the two
  // never disagree about which layout is live.
  const isMobile = useIsMobile();

  // Gamification stats — XP/Level/Streak/Achievements derived from the
  // current roadmap doc (single per user).
  const gamification = useRoadmapGamification(r.roadmap, r.activeCategory?.domain ?? null);

  const totalHours = r.activeCategory?.totalHours
    ?? r.roadmapData.reduce((s, n) => s + n.estimatedHours, 0);

  return (
    <PageContainer size="xl">
      <ResponsivePageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center shrink-0" aria-hidden>
              <Sparkles className="w-5 h-5 text-brand-foreground" />
            </span>
            Roadmap Skill
          </span>
        }
        description="Jalur pembelajaran terstruktur untuk menguasai skill yang diminati"
      />

      <Tabs
        value={r.activeTab ?? "my"}
        onValueChange={(v) => r.setActiveTab(v as "my" | "browse" | "time-machine")}
        className="space-y-4"
      >
        <TabsList variant="equal" cols={3} className="w-full sm:max-w-xl">
          <TabsTrigger value="my">
            <Trophy className="w-3.5 h-3.5" aria-hidden />
            Skill Saya
          </TabsTrigger>
          <TabsTrigger value="browse">
            <Sparkles className="w-3.5 h-3.5" aria-hidden />
            Cari Skills
            {r.browserCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {r.browserCategories.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="time-machine">
            <Compass className="w-3.5 h-3.5" aria-hidden />
            Lihat Karier
          </TabsTrigger>
        </TabsList>

        {/* Career Time Machine — graph-engine reachability across the
            ID labor market manifold. Pure Convex, no graph-DB dep. */}
        <TabsContent value="time-machine" className="mt-4">
          <CareerTimeMachine />
        </TabsContent>

        {/* Browse — search, sort, filter, grid/table toggle. Selecting a
            roadmap auto-jumps back to "Skill Saya" so the user sees the
            tree they just picked. */}
        <TabsContent value="browse" className="mt-4">
          <RoadmapBrowser
            categories={r.browserCategories}
            loading={r.templatesLoading}
            selectedId={r.selectedBrowseSlug ?? r.activeSlug ?? ""}
            onSelect={r.handleBrowseSelect}
            domainFilter={r.domainFilter}
            onDomainFilterChange={r.setDomainFilter}
            domainOptions={r.domains}
            domainLabels={DOMAIN_LABELS}
            iconMap={iconMap}
          />
        </TabsContent>

        <TabsContent value="my" className="mt-4 space-y-4 lg:space-y-6">
          {/* Saved skills grid — same card visual as Cari Skills, plus
              "active" highlight + remove. Activate re-seeds the active
              roadmap when needed. Full width: it is the skill picker for
              both columns below, and its tiles tile better wide. */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle as="h2" className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand" aria-hidden />
                  Skill Tersimpan
                  {r.savedCards.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5">
                      {r.savedCards.length}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => r.setActiveTab("browse")}
                  className="h-7 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" aria-hidden />
                  Tambah dari Cari Skills
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SavedRoadmapsGrid
                saved={r.savedCards}
                loading={r.savedLoading}
                activeSlug={r.activeSlug ?? ""}
                onActivate={r.handleActivateSaved}
                onRemove={r.handleRemoveSaved}
                onBrowse={() => r.setActiveTab("browse")}
                iconMap={iconMap}
                domainLabels={DOMAIN_LABELS}
                progressBySlug={r.progressBySlug}
              />
            </CardContent>
          </Card>

          {/* Gamification HUD — full width; the level/XP/streak/achievement
              ribbon is a horizontal HUD and cramps badly in the rail. */}
          {r.roadmap && r.activeSlug && (
            <GamificationPanel stats={gamification} domainLabel={r.activeCategory?.domain} />
          )}

          {r.activeSlug ? (
            /* Two columns from `lg`: the track on the left, progress +
               the selected topic's detail in a sticky rail on the right.
               A single stacked column left ~500px of a 1600px viewport
               unused. Below `lg` this collapses back to one column and
               the detail moves into `NodeDetailDialog`. */
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
              {/* min-w-0 on the grid ITEM, not just the inner text div: the
                  track is clamped by minmax(0,1fr) but the item keeps
                  min-width:auto, so long unbroken content still pushes it
                  wider than its track. */}
              <Card className="min-w-0 border-border">
                <CardHeader className="border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle as="h2" className="text-xl">
                        {r.activeCategory?.name ?? r.activeSlug}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.activeCategory?.description ?? 'Selesaikan setiap topik untuk membuka level berikutnya'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-brand tabular-nums">{r.progress}%</div>
                      <div className="text-xs text-muted-foreground">Selesai</div>
                    </div>
                  </div>
                  <Progress
                    value={r.progress}
                    aria-label="Progress roadmap"
                    aria-valuetext={`${r.progress}% selesai`}
                    className="mt-4 h-2"
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  {r.dbTemplate === undefined ? (
                    <div className="space-y-4">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {r.roadmapData.map((n) => (
                        <RoadmapNodeComponent
                          key={n.id}
                          node={n}
                          completedNodes={r.completedNodes}
                          activeQuestId={r.nextQuestId}
                          selectedNodeId={isMobile ? null : r.selectedNode?.id ?? null}
                          onToggle={r.toggleNodeCompletion}
                          onSelect={r.setSelectedNode}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <RoadmapSidebar
                className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1"
                completedSize={r.completedNodes.size}
                totalNodes={r.totalNodes}
                totalHours={totalHours}
                roadmapData={r.roadmapData}
                completedNodes={r.completedNodes}
                selectedNode={isMobile ? null : r.selectedNode}
                completedResources={r.completedResources}
                nodeIdToTitle={r.nodeIdToTitle}
                onToggle={r.toggleNodeCompletion}
                onClearSelection={() => r.setSelectedNode(null)}
              />
            </div>
          ) : (
            // No active skill — invite user to pick one. Avoids showing
            // an empty tree shell that looks like a broken page.
            !r.savedLoading && r.savedCards.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Pilih skill di atas atau buka Cari Skills untuk memulai.
              </p>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Switching the active skill reseeds the single roadmap doc, which
          throws away the current one's completed nodes and XP. */}
      <ResponsiveAlertDialog
        open={r.pendingSlug !== null}
        onOpenChange={(o) => { if (!o) r.cancelActivate(); }}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Ganti skill aktif?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Progres roadmap yang sedang aktif — topik selesai, XP, dan
              pencapaian — akan hilang dan tidak bisa dikembalikan.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel onClick={r.cancelActivate}>
              Batal
            </ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction onClick={r.confirmActivate}>
              Ganti skill
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      {/* Below `lg` only — at `lg`+ the same body lives in the rail, and
          mounting both would give the page two competing detail views. */}
      {isMobile && (
        <NodeDetailDialog
          selectedNode={r.selectedNode}
          completedNodes={r.completedNodes}
          completedResources={r.completedResources}
          nodeIdToTitle={r.nodeIdToTitle}
          onClose={() => r.setSelectedNode(null)}
          onToggle={r.toggleNodeCompletion}
        />
      )}
    </PageContainer>
  );
}
