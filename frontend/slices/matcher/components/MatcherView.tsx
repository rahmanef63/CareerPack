"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Compass, Download, Plus, Sparkles, Trophy } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { notify } from "@/shared/lib/notify";
import { PageContainer } from "@/shared/components/layout/PageContainer";

import type { JobListing } from "../types";
import { useMatcher } from "../hooks/useMatcher";
import { useJobFilters } from "../hooks/useJobFilters";
import { AddJobDialog } from "./AddJobDialog";
import { ATSHistoryList } from "./ATSHistoryList";
import { ATSScannerForm } from "./ATSScannerForm";
import { JobCard } from "./JobCard";
import { JobDetailDialog } from "./JobDetailDialog";
import { JobFilterPanel } from "./JobFilterPanel";
import { JobResults } from "./JobResults";
import { MatchSummaryCard } from "./MatchSummaryCard";
import { SalaryInsightsCard } from "./SalaryInsightsCard";

type TopTab = "listings" | "ats" | "history";
type ListingsTab = "saya" | "explore";

export function MatcherView() {
  const [topTab, setTopTab] = useState<TopTab>("listings");
  const [listingsTab, setListingsTab] = useState<ListingsTab>("explore");
  const {
    myJobs,
    exploreJobs,
    matches,
    isLoadingMy,
    isLoadingExplore,
    isLoadingMatches,
    seedDemo,
  } = useMatcher();
  const [seeding, setSeeding] = useState(false);
  const isAdmin = useQuery(api.admin.queries.amIAdmin, {});
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<JobListing | null>(null);
  /** When user clicks "Cek ATS" on a JobCard, we jump to the ATS tab
   *  with the listing preselected. */
  const [atsPreselect, setAtsPreselect] = useState<JobListing | null>(null);

  // One filter state drives whichever sub-tab is active, so the rail can
  // hold a single set of controls instead of one per tab — and a filter
  // the user set survives switching between "Saya" and "Semua".
  const sourceJobs = listingsTab === "saya" ? myJobs : exploreJobs;
  const sourceLoading = listingsTab === "saya" ? isLoadingMy : isLoadingExplore;
  const filters = useJobFilters(sourceJobs);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDemo();
      notify.success(
        res.seeded > 0
          ? `Contoh lowongan dimuat (${res.seeded} baru)`
          : "Contoh lowongan sudah lengkap",
      );
    } catch (err) {
      notify.fromError(err, "Gagal memuat contoh");
    } finally {
      setSeeding(false);
    }
  };

  const handleScanFromCard = (job: JobListing) => {
    setAtsPreselect(job);
    setTopTab("ats");
    setDetail(null);
  };

  // Radix unmounts the inactive TabsContent, so the same element in both
  // slots only ever renders once — it just keeps each tab panel wired to
  // its trigger for assistive tech.
  const results = (
    <JobResults
      jobs={filters.filtered}
      sourceCount={sourceJobs.length}
      loading={sourceLoading}
      view={filters.view}
      onViewChange={filters.setView}
      onSelect={setDetail}
      filtersActive={filters.filtersActive}
      onResetFilters={filters.resetAll}
      zeroDataHint={
        listingsTab === "saya"
          ? "Belum ada lowongan yang kamu tambahkan. Klik “Tambah Lowongan” untuk paste deskripsi dari LinkedIn / JobStreet / sumber lain."
          : isAdmin
            ? "Belum ada lowongan. Klik “Muat Contoh” untuk memuat katalog contoh."
            : // "Muat Contoh" only renders for admins — telling every other
              // user to click a button they can't see was a dead end.
              "Belum ada lowongan contoh saat ini. Coba lagi nanti, atau klik “Tambah Lowongan” untuk menambahkan lowongan kamu sendiri."
      }
      emptyHint={
        listingsTab === "saya"
          ? "Tidak ada lowongan kamu yang cocok dengan filter saat ini."
          : "Tidak ada lowongan yang cocok dengan filter saat ini."
      }
    />
  );

  return (
    <PageContainer size="xl" className="space-y-6">
      <ResponsivePageHeader
        title="Pencocok Lowongan"
        description="AI mencocokkan profil + scan ATS untuk CV Anda."
        actions={
          topTab === "listings" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setAddOpen(true)}
                className="gap-2 bg-brand hover:bg-brand"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Lowongan</span>
              </Button>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{seeding ? "Memuat…" : "Muat Contoh"}</span>
                </Button>
              )}
            </div>
          ) : null
        }
      />

      <AddJobDialog open={addOpen} onOpenChange={setAddOpen} />

      <Tabs value={topTab} onValueChange={(v) => setTopTab(v as TopTab)}>
        <TabsList variant="pills">
          <TabsTrigger value="listings">Lowongan</TabsTrigger>
          <TabsTrigger value="ats">Cek ATS</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        {/* ===== Lowongan ===== */}
        <TabsContent value="listings" className="mt-4 space-y-6">
          {/* Full-bleed above the split: the "top picks" row wants the
              whole page width, and on a phone it has to stay the first
              thing on screen. */}
          {matches.length > 0 && (
            <ResponsiveCarousel
              title={
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  Cocok Untuk Anda
                </span>
              }
              description="Berdasarkan target posisi + skill + lokasi"
              cellWidth="w-72 sm:w-80"
            >
              {matches.map(({ job, score }) => (
                <JobCard
                  key={job._id}
                  job={job}
                  score={score}
                  variant="carousel"
                  onView={() => setDetail(job)}
                />
              ))}
            </ResponsiveCarousel>
          )}

          {/*
            Two columns from `lg` up: list left, rail right.
            The rail is FIRST in the DOM and gets pushed to column 2 by
            explicit grid placement — so on a phone (single column) the
            filters land directly above the results they control instead
            of a screen below them, which is what stacking DOM order
            would have given.
            `minmax(0,1fr)` on the list column is load-bearing: a plain
            `1fr` track floors at min-content, so one long job title can
            push the grid past the viewport.
          */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Sticky under the 3.5rem SiteHeader. The rail is taller
                than a laptop viewport once the salary card fills in, so
                it scrolls inside itself rather than pinning a section
                the user can never reach. */}
            <aside
              aria-label="Filter dan insight"
              className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-2"
            >
              <JobFilterPanel filters={filters} />
              <MatchSummaryCard matches={matches} loading={isLoadingMatches} />
              <SalaryInsightsCard />
            </aside>

            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <Tabs
                value={listingsTab}
                onValueChange={(v) => setListingsTab(v as ListingsTab)}
              >
                {/* Grid items default to `min-width: auto`, so these two
                    nowrap labels used to overflow the list and turn it
                    into a scroll row on a phone. `min-w-0` + `truncate`
                    lets them clip in place instead. */}
                <TabsList variant="equal" cols={2}>
                  <TabsTrigger value="saya" className="min-w-0">
                    <Trophy className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Lowongan Saya</span>
                    {myJobs.length > 0 && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                        {myJobs.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="explore" className="min-w-0">
                    <Compass className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Semua Lowongan</span>
                    {exploreJobs.length > 0 && (
                      <span className="shrink-0 rounded-full bg-muted px-1.5 text-xs tabular-nums">
                        {exploreJobs.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="saya" className="mt-4">
                  {results}
                </TabsContent>
                <TabsContent value="explore" className="mt-4">
                  {results}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* ===== Cek ATS ===== */}
        <TabsContent value="ats" className="mt-4">
          <ATSScannerForm initialListing={atsPreselect} />
        </TabsContent>

        {/* ===== Riwayat ===== */}
        <TabsContent value="history" className="mt-4">
          <ATSHistoryList />
        </TabsContent>
      </Tabs>

      <JobDetailDialog
        job={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onScanATS={handleScanFromCard}
      />
    </PageContainer>
  );
}
