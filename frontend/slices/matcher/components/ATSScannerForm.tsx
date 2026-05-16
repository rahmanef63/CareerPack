"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { ScanText, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useATSScan, useATSScan_byId } from "../hooks/useATSScan";
import { ATSResultCard } from "./ATSResultCard";
import { useAuth } from "@/shared/hooks/useAuth";
import type { JobListing } from "../types";

interface ATSScannerFormProps {
  /** Optional pre-selected listing — used when user clicks "Cek ATS" from JobCard. */
  initialListing?: JobListing | null;
}

export function ATSScannerForm({ initialListing = null }: ATSScannerFormProps) {
  // Skip the CV query for unauth / demo users — `getUserCVs` requires
  // auth via `requireUser`, otherwise it throws on the server.
  const { state } = useAuth();
  const cvsEnabled = state.isAuthenticated && !state.isDemo;
  const cvs = useQuery(api.cv.queries.getUserCVs, cvsEnabled ? {} : "skip");
  const [cvId, setCvId] = useState<Id<"cvs"> | "">("");
  const [userPickedCv, setUserPickedCv] = useState(false);
  const [mode, setMode] = useState<"paste" | "listing">(
    initialListing ? "listing" : "paste",
  );
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [listingId, setListingId] = useState<Id<"jobListings"> | "">(
    initialListing?._id ?? "",
  );

  // Default-pick the user's NEWEST CV when the list resolves. Convex
  // collect() returns insertion order (oldest first), so picking [0]
  // would surface a stale CV after QuickFill or createCV inserts a
  // fresh row. Once the user actively picks (or clears) their CV, we
  // honor that choice and stop auto-selecting.
  useEffect(() => {
    if (userPickedCv) return;
    if (cvId || !cvs || cvs.length === 0) return;
    const newest = [...cvs].sort((a, b) => b._creationTime - a._creationTime)[0];
    setCvId(newest._id);
  }, [cvs, cvId, userPickedCv]);

  const listings = useQuery(
    api.matcher.queries.listJobs,
    mode === "listing" ? { limit: 50 } : "skip",
  );

  const { run, pending, latestScanId } = useATSScan();
  const { scan } = useATSScan_byId(latestScanId);

  const canSubmit = (() => {
    if (!cvId) return false;
    if (pending) return false;
    if (mode === "paste") return jdText.trim().length >= 40;
    return Boolean(listingId);
  })();

  const handleSubmit = async () => {
    if (!cvId) return;
    try {
      if (mode === "paste") {
        await run({
          cvId,
          jdText,
          jobTitle: jobTitle || "Lowongan tanpa judul",
          jobCompany: jobCompany || undefined,
        });
      } else if (listingId) {
        await run({ cvId, jobListingId: listingId });
      }
    } catch {
      /* already toasted by useATSScan */
    }
  };

  const noCV = cvs !== undefined && cvs.length === 0;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <h2 className="text-base font-semibold">Cek ATS dengan AI</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tempel deskripsi lowongan atau pilih dari katalog. AI akan ekstrak
          keyword penting, lalu CV Anda dibandingkan untuk skor 0-100.
        </p>

        {/* CV picker */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Pilih CV
          </label>
          {noCV ? (
            <p className="text-sm text-muted-foreground">
              Belum ada CV — buat CV dulu di menu CV Generator.
            </p>
          ) : (
            <ResponsiveSelect
              value={cvId}
              onValueChange={(v) => {
                setCvId(v as Id<"cvs">);
                setUserPickedCv(true);
              }}
            >
              <ResponsiveSelectTrigger placeholder="Pilih CV…" />
              <ResponsiveSelectContent drawerTitle="Pilih CV">
                {(cvs ?? []).map((c) => (
                  <ResponsiveSelectItem key={c._id} value={c._id}>
                    {c.title}
                  </ResponsiveSelectItem>
                ))}
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          )}
        </div>

        {/* JD source tabs */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "paste" | "listing")}>
          <TabsList variant="pills">
            <TabsTrigger value="paste">Tempel JD</TabsTrigger>
            <TabsTrigger value="listing">Pilih Lowongan</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="text"
                placeholder="Judul lowongan (opsional)"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Nama perusahaan (opsional)"
                value={jobCompany}
                onChange={(e) => setJobCompany(e.target.value)}
              />
            </div>
            <Textarea
              placeholder="Tempel deskripsi lowongan di sini (min. 40 karakter)…"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={8}
              className="resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {jdText.trim().length} karakter
              {jdText.trim().length > 0 && jdText.trim().length < 40 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {" "}
                  · butuh ≥ 40
                </span>
              )}
            </p>
          </TabsContent>

          <TabsContent value="listing" className="mt-3 space-y-2">
            {listings === undefined ? (
              <p className="text-sm text-muted-foreground">Memuat lowongan…</p>
            ) : listings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada lowongan. Buka tab Lowongan dan klik &ldquo;Muat
                Contoh Lowongan&rdquo;.
              </p>
            ) : (
              <ResponsiveSelect
                value={listingId}
                onValueChange={(v) => setListingId(v as Id<"jobListings">)}
              >
                <ResponsiveSelectTrigger placeholder="Pilih lowongan…" />
                <ResponsiveSelectContent drawerTitle="Pilih lowongan">
                  {listings.map((l) => (
                    <ResponsiveSelectItem key={l._id} value={l._id}>
                      {l.title} — {l.company}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            )}
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="gap-2"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanText className="h-4 w-4" />
          )}
          {pending ? "Menganalisis…" : "Cek ATS sekarang"}
        </Button>
      </div>

      {/* Result */}
      {scan && (
        <ATSResultCard
          score={scan.score}
          grade={scan.grade}
          breakdown={scan.breakdown}
          matchedKeywords={scan.matchedKeywords}
          missingKeywords={scan.missingKeywords}
          formatIssues={scan.formatIssues}
          recommendations={scan.recommendations}
          jobTitle={scan.jobTitle}
          jobCompany={scan.jobCompany ?? undefined}
        />
      )}
    </div>
  );
}
