# Pencocok Lowongan (Matcher)

## Tujuan

AI mencocokkan profil user dengan katalog lowongan — skor per-lowongan berbasis targetRole + skills + seniority + lokasi. Mobile-first: carousel top match, filter tabs per work mode, detail via responsive dialog.

## Route & Entry

- URL: `/dashboard/matcher`
- Slice: `frontend/src/slices/matcher/`
- Komponen utama: `MatcherView.tsx`, `JobCard.tsx`

## Struktur Slice

```
matcher/
├─ index.ts
├─ components/
│  ├─ MatcherView.tsx      Page — header + top-match carousel + filter tabs + grid + detail dialog
│  └─ JobCard.tsx          Reusable card (list + carousel variants), score badge opsional
├─ hooks/useMatcher.ts     Convex hooks (listJobs + getMatches + seedDemoJobs)
└─ types/index.ts          JobListing, JobMatch, WorkModeFilter
```

## Data Flow

| Operation | Convex fn | Purpose |
|---|---|---|
| List | `api.matcher.listJobs({ workMode?, limit? })` | Paginated by `postedAt` desc, optional `workMode` filter (`by_workMode` index) |
| Match | `api.matcher.getMatches({ limit? })` | Scored against caller's `userProfile`. Returns `[{ job, score }]` sorted desc, filter `score > 0` |
| Seed | `api.matcher.seedDemoJobs()` | Idempotent insert of 8 demo listings (Tokopedia, Gojek, Shopee, dst.) |

### Scoring heuristic (in `convex/matcher.ts`)

- Role match (title contains `targetRole`): **+40pt** (strong) / **+20pt** (any word match)
- Skill overlap (case-insensitive): **+10pt** per match, cap **+40pt**
- Seniority in title/seniority field: **+10pt**
- Location: `workMode=remote` → **+10pt**; else same-city → **+10pt**
- Cap total: **100pt**

Absent `userProfile` → returns `0` (no matches shown).

## Schema

Tabel `jobListings` (public catalog — no `userId`):

```ts
{
  title, company, location,
  workMode: "remote" | "hybrid" | "onsite",
  employmentType, seniority,
  salaryMin?, salaryMax?, currency?,
  description, requiredSkills: string[],
  postedAt: number,
  applyUrl?, companyLogo?  // emoji
}
```

Indexes: `by_posted`, `by_workMode`.

## UI — App Store-style layout

1. **ResponsivePageHeader** — title + description + "Seed Demo" action.
2. **"Cocok Untuk Anda" `ResponsiveCarousel`** (top 6 matches, cellWidth 80/72 mobile). Each card shows `X% cocok` badge.
3. **Filter Tabs (`variant="pills"`)** — Semua / Remote / Hybrid / On-site.
4. **2-col grid** of listings (1-col on mobile) sorted by `postedAt`.
5. **`ResponsiveDialog` detail** — full description + skill badges + "Lamar di …" external link.

## Dependensi

- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-carousel`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/tabs` (pills variant)
- shadcn: `card`, `badge`, `button`

## Catatan Desain

- Demo seed dipicu manual lewat tombol header — MVP tanpa scraper / aggregator. Scale-up: integrasi API job board (JobStreet, LinkedIn Jobs) via Convex action.
- Score heuristic sengaja simple + deterministik — enak di-debug, tidak perlu LLM call.
- Salary rendering: `jt` suffix untuk > 1M IDR, fallback raw number.

## Extending

- Save/bookmark job (join table `savedJobs` + userId)
- Auto-apply button → integrate dengan CV generator export
- Score explanation (per-axis breakdown) di dialog detail
- LLM-based matching untuk semantic skill similarity (butuh vector embedding)
- Notifikasi baru: push notification ke user saat score job baru > threshold
