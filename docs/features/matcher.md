# Pencocok Lowongan (Matcher)

> **Portability tier:** L — slice + 1 Convex domain (2 tables) + AI actions (ATS scoring, cover-letter, CV-tailoring) + external feed pipelines

## Tujuan

End-to-end job-search workflow:
1. **Browser lowongan** — katalog gabungan seed + RemoteOK + WeWorkRemotely + paste-by-user; filter work mode + category.
2. **AI ATS Scanner** — scan CV vs JD → skor 0-100, breakdown, missing keywords, format issues, recommendations. Persist sebagai `atsScans`.
3. **Cover letter generator** + **resume-tailor** — AI-driven outputs disimpan ulang ke CV.
4. **Salary insights** — heuristik berbasis seed listings.

## Route & Entry

- URL: `/dashboard/matcher`
- Slice: `frontend/src/slices/matcher/`
- Komponen utama: `MatcherView.tsx` (tab shell), `JobBrowser.tsx`, `ATSScannerForm.tsx`

## Struktur Slice

```
matcher/
├─ index.ts
├─ components/
│  ├─ MatcherView.tsx              Page shell — tabs (Browse / ATS / Insights)
│  ├─ JobBrowser.tsx               List + filter + carousel "Cocok Untuk Anda"
│  ├─ JobCard.tsx                  Reusable card variants (list / carousel)
│  ├─ JobDetailDialog.tsx          Full description + skill badges + apply CTA
│  ├─ AddJobDialog.tsx             Paste-a-listing form (source = "user-paste")
│  ├─ ATSScannerForm.tsx           CV picker + JD textarea + scan trigger
│  ├─ ATSResultCard.tsx            Score breakdown + matched / missing keywords
│  ├─ ATSHistoryList.tsx           Daftar scan tersimpan
│  ├─ CoverLetterDialog.tsx        AI cover letter (per CV + JD)
│  ├─ ResumeTailorDialog.tsx       AI rewrite CV bullets untuk JD spesifik
│  └─ SalaryInsightsCard.tsx       Median + range per role/seniority
├─ hooks/
│  ├─ useMatcher.ts                listJobs, getMatches, listMyScans, getSalaryInsights
│  └─ useATSScan.ts                Trigger `scanCV` action + poll history
├─ lib/format.ts                   Salary / date formatting helpers
└─ types/index.ts                  JobListing, JobMatch, WorkModeFilter, ATSScan, ATSBreakdown
```

## Data Flow

Backend domain: `convex/matcher/`. Tabel: `jobListings`, `atsScans`.

| Hook / method | Convex op | Purpose |
|---|---|---|
| `useMatcher.jobs` | `api.matcher.queries.listJobs({ workMode?, limit? })` | Paginated by `postedAt` desc |
| `useMatcher.matches` | `api.matcher.queries.getMatches({ limit? })` | Skor terhadap `userProfile` |
| `useMatcher.salary` | `api.matcher.queries.getSalaryInsights({ role })` | Median + range per role/seniority |
| `useMatcher.seed` | `api.matcher.mutations.seedDemoJobs` | Idempotent insert demo (Tokopedia, Gojek, dll.) |
| `useATSScan.scan` | `api.matcher.actions.scanCV({ cvId, jobListingId? \| rawJobText })` | AI ATS pipeline; insert `atsScans` row |
| `useATSScan.history` | `api.matcher.queries.listMyScans` | Riwayat scan |
| `useATSScan.detail` | `api.matcher.queries.getScan({ scanId })` | Full scan record |
| `CoverLetterDialog.generate` | `api.cv.actions.generateCoverLetter` | AI cover letter (cross-domain ke `cv`) |
| `ResumeTailorDialog.tailor` | `api.cv.actions.tailorCVForJob` + `api.cv.mutations.updateCV` | AI rewrite + persist |
| `JobBrowser.viewCV` | `api.cv.queries.getUserCVs` | Picker untuk ATS / cover letter |

Backend modules:

```
convex/matcher/
├─ schema.ts          jobListings + atsScans tables
├─ queries.ts         listJobs, getMatches, listMyScans, getScan, getSalaryInsights
├─ mutations.ts       seedDemoJobs, addUserPastedJob
├─ actions.ts         scanCV (AI ATS), extractKeywords (lazy keyword cache)
├─ atsScore.ts        Pure scoring helpers (heuristic + LLM-augmented)
├─ atsScore.test.ts   Vitest coverage
├─ external.ts        RemoteOK + WeWorkRemotely fetchers (Convex action)
└─ seedJobs.ts        Demo dataset
```

Schema (`convex/matcher/schema.ts`, abridged):

```ts
jobListings: defineTable({
  title, company, location, workMode, employmentType, seniority,
  salaryMin?, salaryMax?, currency?, description,
  requiredSkills: v.array(v.string()),
  postedAt: v.number(),
  applyUrl?, companyLogo?,
  // AI keyword cache (one-shot per listing)
  extractedKeywords?: v.array(v.string()),
  extractedKeywordsAt?: v.number(),
  // Provenance
  source?: v.string(),                // "seed" | "remoteok" | "wwr" | "user-paste"
  externalId?: v.string(),            // stable per-source id, "remoteok:123456"
  addedBy?: v.id("users"),
  category?: v.string(),              // engineering|design|support|product|marketing|data
})
  .index("by_posted", ["postedAt"])
  .index("by_workMode", ["workMode", "postedAt"])
  .index("by_external", ["externalId"])
  .index("by_source_posted", ["source", "postedAt"]),

atsScans: defineTable({
  userId: v.id("users"),
  cvId: v.id("cvs"),
  jobListingId?: v.id("jobListings"),
  jobTitle, jobCompany?, rawJobText,
  score: v.number(), grade: v.string(),
  breakdown: v.object({ keywordCoverage, hardSkills, experienceFit, sectionCompleteness, parseability }),
  matchedKeywords: v.array(v.string()),
  missingKeywords: v.array(v.string()),
  formatIssues: v.array(v.string()),
  recommendations: v.array(v.string()),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_cv", ["userId", "cvId"])
  .index("by_user_listing", ["userId", "jobListingId"]),
```

## State Lokal

- Tab state (`MatcherView`)
- Filter (work mode + category) di `JobBrowser`
- ATS form: `cvId`, `rawJobText`, `jobListingId?`
- Detail dialog state (`activeJobId`, `activeScanId`)

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/components/ui/tabs` (pills variant)
- `@/shared/components/layout/PageContainer`
- `@/shared/hooks/useAuth`
- `@/shared/lib/notify`, `@/shared/lib/utils` (`cn`)
- shadcn: `badge`, `button`, `card`, `checkbox`, `input`, `label`, `progress`, `skeleton`, `textarea`
- Convex: `api.matcher.*`, plus cross-domain `api.cv.queries.getUserCVs`, `api.cv.actions.generateCoverLetter`, `api.cv.actions.tailorCVForJob`, `api.cv.mutations.updateCV`

## Catatan Desain

- **Public catalog** — `jobListings` tidak ada `userId`. Visible ke semua user; per-user filtering hanya saat scoring.
- **`extractedKeywords` cached** — pertama kali listing di-scan, AI ekstraksi keyword dan persist; scan berikut re-use cache (one-shot per listing).
- **External feed pipelines** — `external.ts` jalankan periodic fetch dari RemoteOK + WeWorkRemotely (cron di `convex/crons.ts`). Dedup via `externalId`.
- **Score heuristic deterministik** — base score di `atsScore.ts` pure; AI augmentation optional via OpenAI proxy.
- **Cross-domain calls ke `cv`** — slice butuh `api.cv.*` (cover letter, tailor). Kalau target tidak port `cv-generator` slice + `convex/cv/`, fitur ini ilang.
- Manifest belum ada — slice bukan AI bus subscriber.

## Extending

- Save/bookmark job (tabel `savedJobs` + userId).
- LLM-based matching untuk semantic skill similarity (vector embedding).
- Notification baru: push ke user saat job baru cocok > threshold.
- Slice manifest: AI skill `matcher.scan-cv` (kind:"mutation"), `matcher.list-jobs` (kind:"query") — pattern mirip networking.

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/matcher/

# Shared deps
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-carousel.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/lib/notify.ts
frontend/src/shared/lib/utils.ts

# Backend
convex/matcher/                                        # full domain
# Cross-domain dependency:
convex/cv/                                             # required for cover-letter + tailor flows
convex/_shared/aiProviders.ts                          # OpenAI-compatible proxy
convex/_shared/rateLimit.ts                            # AI quota gate
convex/_shared/sanitize.ts                             # prompt sanitization
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/matcher" "$DST/frontend/src/slices/"

# Shared deps
mkdir -p "$DST/frontend/src/shared/components/ui"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/lib"

cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx" "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-carousel.tsx"    "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"      "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"      "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"      "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                            "$DST/frontend/src/shared/lib/"

# Backend
cp -r "$SRC/convex/matcher"  "$DST/convex/"
cp -r "$SRC/convex/cv"       "$DST/convex/"             # required for cover-letter + tailor (skip if already ported)
mkdir -p "$DST/convex/_shared"
cp "$SRC/convex/_shared/aiProviders.ts" "$DST/convex/_shared/"
cp "$SRC/convex/_shared/rateLimit.ts"   "$DST/convex/_shared/"
cp "$SRC/convex/_shared/sanitize.ts"    "$DST/convex/_shared/"
```

**Schema additions** — copy `jobListings` + `atsScans` tables verbatim dari `convex/matcher/schema.ts`. Indexes wajib: `by_posted`, `by_workMode`, `by_external`, `by_source_posted` (jobListings); `by_user`, `by_user_cv`, `by_user_listing` (atsScans).

`atsScans.cvId` referensi `cvs` table — pastikan `cv-generator` ported lebih dulu (lihat `cv-generator.md`).

**Convex api.d.ts**:

```ts
import type * as matcher_actions   from "../matcher/actions.js";
import type * as matcher_atsScore  from "../matcher/atsScore.js";
import type * as matcher_external  from "../matcher/external.js";
import type * as matcher_mutations from "../matcher/mutations.js";
import type * as matcher_queries   from "../matcher/queries.js";
import type * as matcher_seedJobs  from "../matcher/seedJobs.js";

declare const fullApi: ApiFromModules<{
  // ...
  "matcher/actions":   typeof matcher_actions;
  "matcher/atsScore":  typeof matcher_atsScore;
  "matcher/external":  typeof matcher_external;
  "matcher/mutations": typeof matcher_mutations;
  "matcher/queries":   typeof matcher_queries;
  "matcher/seedJobs":  typeof matcher_seedJobs;
}>;
```

**npm deps** — none specific (heuristik pure TS).

**Env vars** — required untuk AI actions:
- `CONVEX_OPENAI_BASE_URL` (OpenAI-compatible endpoint)
- `CONVEX_OPENAI_API_KEY`

External feeds (`external.ts`) tidak butuh credential — RemoteOK + WeWorkRemotely public JSON. Optional cron schedule di `convex/crons.ts`.

**Manifest + binder wiring** — N/A.

**Nav registration** — `dashboardRoutes.tsx` + `navConfig.ts`. Slug `matcher` (label "Pencocok Lowongan", icon `Compass`, hue `from-cyan-400 to-cyan-600`, badge `"AI"`).

**i18n** — Indonesian:
- Tab labels: "Lowongan", "ATS Scanner", "Wawasan Gaji"
- Work modes: keys English (`remote`/`hybrid`/`onsite`) — translate display labels
- Salary suffix: "jt" (juta) untuk > 1M IDR
- Score grades: "A/B/C/D" disertai narrative Indonesian

**Common breakage after port:**

- **Cross-domain `api.cv.*` undefined** — port `cv-generator` slice + `convex/cv/` lebih dulu, atau strip `CoverLetterDialog` + `ResumeTailorDialog` dari slice.
- **`scanCV` throw rate-limit** — pastikan `_shared/rateLimit.ts` ported + `rateLimitEvents` table ada di schema.
- **External feed kosong** — `external.ts` butuh fetch outbound. Self-hosted Convex behind firewall? whitelist `remoteok.com` + `weworkremotely.com`.
- **`extractedKeywords` selalu null** — AI proxy env var miss. Cek `CONVEX_OPENAI_*`.
- **Cron tidak jalan** — `external.ts` fetcher harus diregistrasikan di `convex/crons.ts`. Tanpa itu listing tidak refresh.

**Testing the port:**

1. Navigate `/dashboard/matcher` → tab shell render
2. Tab Browse: klik "Seed Demo" → 8 listings muncul
3. Tab ATS: pilih CV + paste JD → klik "Scan" → result card render dalam ~5-15s
4. Klik history scan lama → detail dialog buka tanpa re-fetch AI
5. Detail listing → "Generate Cover Letter" → output muncul (butuh `api.cv.actions.*`)
6. Reload → scan history persist

Run `_porting-guide.md` §9 checklist.
