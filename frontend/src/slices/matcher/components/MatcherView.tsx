"use client";

import { useState } from "react";
import { Compass, Download, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import type { JobListing, WorkModeFilter } from "../types";
import { useMatcher } from "../hooks/useMatcher";
import { JobCard } from "./JobCard";

export function MatcherView() {
  const [filter, setFilter] = useState<WorkModeFilter>("all");
  const { jobs, matches, isLoading, seedDemo } = useMatcher(filter);
  const [seeding, setSeeding] = useState(false);
  const [detail, setDetail] = useState<JobListing | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedDemo();
      toast.success(
        res.seeded > 0
          ? `Demo lowongan di-seed (${res.seeded} baru)`
          : "Demo sudah lengkap",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal seed");
    } finally {
      setSeeding(false);
    }
  };

  const showEmpty = !isLoading && jobs.length === 0;

  return (
    <div className="space-y-6">
      <ResponsivePageHeader
        title="Pencocok Lowongan"
        description="AI mencocokkan profil Anda dengan lowongan terbaru."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {seeding ? "Memuat…" : "Muat Contoh Lowongan"}
            </span>
          </Button>
        }
      />

      {/* Top matches carousel */}
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

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as WorkModeFilter)}>
        <TabsList variant="pills">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="remote">Remote</TabsTrigger>
          <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
          <TabsTrigger value="onsite">On-site</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {showEmpty ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Compass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Belum ada lowongan
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik &ldquo;Muat Contoh Lowongan&rdquo; di atas untuk memuat katalog contoh.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl border border-border bg-muted/30"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onView={() => setDetail(job)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <ResponsiveDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      >
        <ResponsiveDialogContent className="sm:max-w-2xl">
          {detail && (
            <>
              <ResponsiveDialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-muted text-2xl">
                    {detail.companyLogo ?? "🏢"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <ResponsiveDialogTitle>{detail.title}</ResponsiveDialogTitle>
                    <ResponsiveDialogDescription>
                      {detail.company} · {detail.location}
                    </ResponsiveDialogDescription>
                  </div>
                </div>
              </ResponsiveDialogHeader>
              <div className="space-y-4 py-2 text-sm">
                <p className="whitespace-pre-line text-muted-foreground">
                  {detail.description}
                </p>
                {detail.requiredSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Skill dibutuhkan
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.requiredSkills.map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <ResponsiveDialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetail(null)}
                >
                  Tutup
                </Button>
                {detail.applyUrl && (
                  <Button asChild className="gap-2">
                    <a
                      href={detail.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Lamar di {detail.company}
                    </a>
                  </Button>
                )}
              </ResponsiveDialogFooter>
            </>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}
