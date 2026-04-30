"use client";

import { Sparkles, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { PageContainer } from "@/shared/components/layout/PageContainer";
import { RoadmapBrowser } from "./RoadmapBrowser";
import { GamificationPanel } from "./GamificationPanel";
import { SavedRoadmapsGrid } from "./SavedRoadmapsGrid";
import { useRoadmapGamification } from "../hooks/useRoadmapGamification";
import { DOMAIN_LABELS, iconMap } from "./skill-roadmap/constants";
import { useSkillRoadmap } from "./skill-roadmap/useSkillRoadmap";
import { RoadmapNodeComponent } from "./skill-roadmap/RoadmapNodeComponent";
import { RoadmapSidebar } from "./skill-roadmap/RoadmapSidebar";
import { NodeDetailDialog } from "./skill-roadmap/NodeDetailDialog";

export function SkillRoadmap() {
  const r = useSkillRoadmap();

  // Gamification stats — XP/Level/Streak/Achievements derived from the
  // current roadmap doc (single per user).
  const gamification = useRoadmapGamification(r.roadmap, r.activeCategory?.domain ?? null);

  const totalHours = r.activeCategory?.totalHours
    ?? r.roadmapData.reduce((s, n) => s + n.estimatedHours, 0);

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

      <Tabs
        value={r.activeTab ?? "my"}
        onValueChange={(v) => r.setActiveTab(v as "my" | "browse")}
        className="space-y-4"
      >
        <TabsList variant="equal" cols={2} className="w-full sm:max-w-md">
          <TabsTrigger value="my">
            <Trophy className="w-3.5 h-3.5" />
            Skill Saya
          </TabsTrigger>
          <TabsTrigger value="browse">
            <Sparkles className="w-3.5 h-3.5" />
            Cari Skills
            {r.browserCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                {r.browserCategories.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="my" className="mt-4 space-y-6">
          {/* Saved skills grid — same card visual as Cari Skills, plus
              "active" highlight + remove. Activate re-seeds the active
              roadmap when needed. */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand" />
                  Skill Tersimpan
                  {r.savedCards.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
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
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
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

          {/* Gamification HUD */}
          {r.roadmap && r.activeSlug && (
            <GamificationPanel stats={gamification} domainLabel={r.activeCategory?.domain} />
          )}

          {r.activeSlug ? (
            <div className="grid gap-4 lg:grid-cols-3 lg:gap-8">
              <div className="lg:col-span-2">
                <Card className="border-border">
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">
                          {r.activeCategory?.name ?? r.activeSlug}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {r.activeCategory?.description ?? 'Selesaikan setiap topik untuk membuka level berikutnya'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-brand">{r.progress}%</div>
                        <div className="text-xs text-muted-foreground">Selesai</div>
                      </div>
                    </div>
                    <Progress value={r.progress} className="mt-4 h-2" />
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
                            onToggle={r.toggleNodeCompletion}
                            onSelect={r.setSelectedNode}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <RoadmapSidebar
                completedSize={r.completedNodes.size}
                totalNodes={r.totalNodes}
                totalHours={totalHours}
                roadmapData={r.roadmapData}
                completedNodes={r.completedNodes}
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

      <NodeDetailDialog
        selectedNode={r.selectedNode}
        completedNodes={r.completedNodes}
        nodeIdToTitle={r.nodeIdToTitle}
        onClose={() => r.setSelectedNode(null)}
        onToggle={r.toggleNodeCompletion}
      />
    </PageContainer>
  );
}
