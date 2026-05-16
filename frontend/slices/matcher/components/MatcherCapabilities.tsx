"use client";

import { useEffect } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";
import { makeIdempotencyKey } from "@/shared/lib/idempotencyKey";

interface AddJobPayload {
  text: string;
}

interface ScanATSPayload {
  cvId: string;
  jobListingId: string;
}

const VALID_WORK_MODES = new Set(["remote", "hybrid", "onsite"]);
const VALID_EMPLOYMENT = new Set([
  "full-time",
  "part-time",
  "contract",
  "internship",
]);
const VALID_SENIORITY = new Set(["junior", "mid-level", "senior", "lead"]);

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function asStringArr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : [];
}
function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return undefined;
}

/**
 * Matcher capability binder — wires `matcher.add-job` and
 * `matcher.scan-ats` skills to backend action+mutation chains.
 *
 * `matcher.add-job` mirrors AddJobDialog: parseJobFromText (action) →
 * addUserJob (mutation), with parsed-field coercion + whitelist clamps
 * for enum fields. AI agent uses raw extraction; user can edit later
 * via the dialog if needed.
 *
 * Query skills (`list-jobs`, `list-mine`, `list-scans`) are handled
 * server-side by skillHandlers.
 */
export function MatcherCapabilities() {
  const parseJob = useAction(api.matcher.external.parseJobFromText);
  const addJob = useMutation(api.matcher.external.addUserJob);
  const scanCV = useAction(api.matcher.actions.scanCV);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<AddJobPayload>("matcher.add-job", async (a) => {
        const text = String(a.payload.text ?? "").trim();
        if (text.length < 80) {
          notify.validation("Teks lowongan terlalu pendek (min 80 karakter)");
          return;
        }
        try {
          notify.info("Memparse lowongan…");
          const parsed = (await parseJob({ text })) as Record<string, unknown>;
          const title = asString(parsed.title).trim();
          const company = asString(parsed.company).trim();
          if (title.length < 2 || company.length < 1) {
            notify.error(
              "AI gagal mengekstrak judul/perusahaan — coba paste teks lebih lengkap",
            );
            return;
          }
          const rawWorkMode = asString(parsed.workMode).toLowerCase();
          const rawEmployment = asString(parsed.employmentType).toLowerCase();
          const rawSeniority = asString(parsed.seniority).toLowerCase();
          await addJob({
            title,
            company,
            location: asString(parsed.location).trim() || "—",
            workMode: VALID_WORK_MODES.has(rawWorkMode) ? rawWorkMode : "onsite",
            employmentType: VALID_EMPLOYMENT.has(rawEmployment)
              ? rawEmployment
              : "full-time",
            seniority: VALID_SENIORITY.has(rawSeniority)
              ? rawSeniority
              : "mid-level",
            description: asString(parsed.description).trim(),
            requiredSkills: asStringArr(parsed.requiredSkills).slice(0, 30),
            salaryMin: asNumber(parsed.salaryMin),
            salaryMax: asNumber(parsed.salaryMax),
            currency: asString(parsed.currency).trim() || undefined,
            applyUrl: asString(parsed.applyUrl).trim() || undefined,
          });
          notify.success(`Lowongan ditambahkan: ${title} · ${company}`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah lowongan");
        }
      }),
    );

    unsubs.push(
      subscribe<ScanATSPayload>("matcher.scan-ats", async (a) => {
        const cvId = String(a.payload.cvId ?? "").trim();
        const jobListingId = String(a.payload.jobListingId ?? "").trim();
        if (!cvId || !jobListingId) {
          notify.validation("cvId + jobListingId wajib");
          return;
        }
        try {
          notify.info("Memindai ATS…");
          const result = await scanCV({
            cvId: cvId as Id<"cvs">,
            jobListingId: jobListingId as Id<"jobListings">,
            idempotencyKey: makeIdempotencyKey("scan", [cvId, jobListingId]),
          });
          notify.success(`Skor ATS: ${result.score} (${result.grade})`);
        } catch (err) {
          notify.fromError(err, "Gagal scan ATS");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [parseJob, addJob, scanCV]);

  return null;
}
