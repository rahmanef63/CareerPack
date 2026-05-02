"use client";

import { useState } from "react";
import { Compass, Download, Plus, Sparkles, Trophy } from "lucide-react";

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
import { AddJobDialog } from "./AddJobDialog";
import { ATSHistoryList } from "./ATSHistoryList";
import { ATSScannerForm } from "./ATSScannerForm";
import { JobBrowser } from "./JobBrowser";
import { JobCard } from "./JobCard";
import { JobDetailDialog } from "./JobDetailDialog";
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
    seedDemo,
  } = useMatcher();
  const [seeding, setSeeding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<JobListing | null>(null);
  /** When user clicks "Cek ATS" on a JobCard, we jump to the ATS tab
   *  with the listing preselected. */
  const [atsPreselect, setAtsPreselect] = useState<JobListing | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDemo();
      notify.success(
        res.seeded > 0
          ? `Demo lowongan di-seed (${res.seeded} baru)`
          : "Demo sudah lengkap",
      );
    } catch (err) {
      notify.fromError(err, "Gagal seed");
    } finally {
      setSeeding(false);
    }
  };

  const handleScanFromCard = (job: JobListing) => {
    setAtsPreselect(job);
    setTopTab("ats");
    setDetail(null);
  };

  return (
    <PageContainer size="lg" className="space-y-6">
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
          {matches.length > 0 && (
            <ResponsiveCarousel
              title={
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand" />
                  Cocok Untuk Anda
                </span>
              }
              description="Berdasarkan targetRole + skills + lokasi"
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

          <SalaryInsightsCard />

          <Tabs
            value={listingsTab}
            onValueChange={(v) => setListingsTab(v as ListingsTab)}
          >
            <TabsList variant="equal" cols={2}>
              <TabsTrigger value="saya">
                <Trophy className="h-3.5 w-3.5" />
                Lowongan Saya
                {myJobs.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {myJobs.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="explore">
                <Compass className="h-3.5 w-3.5" />
                Explore
                {exploreJobs.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                    {exploreJobs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="saya" className="mt-4">
              <JobBrowser
                jobs={myJobs}
                loading={isLoadingMy}
                onSelect={setDetail}
                zeroDataHint="Belum ada lowongan yang kamu tambahkan. Klik “Tambah Lowongan” untuk paste deskripsi dari LinkedIn / JobStreet / sumber lain."
                emptyHint="Tidak ada lowongan kamu yang cocok dengan filter saat ini."
              />
            </TabsContent>

            <TabsContent value="explore" className="mt-4">
              <JobBrowser
                jobs={exploreJobs}
                loading={isLoadingExplore}
                onSelect={setDetail}
                zeroDataHint="Belum ada lowongan. Klik “Muat Contoh” untuk memuat katalog contoh."
                emptyHint="Tidak ada lowongan yang cocok dengan filter saat ini."
              />
            </TabsContent>
          </Tabs>
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
