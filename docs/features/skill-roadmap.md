# Skill Roadmap

## Tujuan

Peta skill interaktif per career path (frontend-developer, backend-developer, product-manager, dll). User toggle progress skill → progress persen auto-update. Resource (course/practice/book) per skill.

## Route & Entry

- URL: `/dashboard/roadmap`
- Slice: `frontend/src/slices/skill-roadmap/`
- Komponen utama: `SkillRoadmap.tsx` (~700 baris)

## Struktur Slice

```
skill-roadmap/
├─ index.ts
├─ components/SkillRoadmap.tsx
└─ types/index.ts       RoadmapCategory, RoadmapNode, RoadmapResource
```

## Data Flow

Convex: tabel `skillRoadmaps` via `convex/roadmap/`.

| Operasi | Convex |
|---|---|
| Fetch roadmap aktif | `api.roadmap.queries.getUserRoadmap` |
| Buat / update | `api.roadmap.mutations.seedRoadmap` (populate dari `defaultRoadmaps[careerPath]`; merge-preserves status) |
| Update status skill | `api.roadmap.mutations.updateSkillProgress` |

Seed: `convex/roadmap/` embed 3+ template (`frontend-developer`, dst) — array skill dengan `id, name, category, level, priority, estimatedHours, prerequisites, resources`.

Progress auto-computed server-side: `(completed / total) * 100`, stored di field `progress`.

## State Lokal

- `selectedCategory` — filter by category
- `expandedNodeId` — detail panel
- Search query

## Dependensi

- UI: shadcn `card`, `button`, `badge`, `progress`, `tabs`, `command` (search)
- `@/shared/hooks/useAuth`
- `react-dnd-kit` kalau roadmap support re-order (tergantung implementasi)

## Catatan Desain

- `defaultRoadmaps` di-hardcode di Convex supaya seed deterministik + bisa di-bump schema-aware. Alternatif: simpan sebagai JSON table terpisah (lebih fleksibel, tapi butuh admin UI untuk edit).
- Resource link di-render sebagai hyperlink — tidak ada tracking klik sekarang. Future: tambah `analyticsEvents` table.

## Extending

- AI-generated roadmap personal → action `generateRoadmap({ targetRole, experience })` yang call OpenAI-compat + isi schema.
- Community roadmap sharing (public) → butuh `visibility: "public" | "private"` field.
- Sync estimasi jam dengan study tracker (mis. Toggl) — butuh OAuth integration.

---

## Portabilitas

**Tier:** L — slice (large) + Convex module + schema + hardcoded Indonesian roadmap data.

**Files:**

```
frontend/src/slices/skill-roadmap/
convex/roadmap/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/skill-roadmap" "$DST/frontend/src/slices/"
cp "$SRC/convex/roadmap/"                   "$DST/convex/"
```

**Schema:** add `skillRoadmaps` table (`userId`, `careerPath`, `skills[]` with id/name/category/level/priority/estimatedHours/prerequisites/status/resources/completedAt, `progress`). Index `by_user`.

**Convex api.d.ts:** add `roadmaps: typeof roadmaps`.

**npm deps:** none.

**Nav:** `roadmap` slug in MORE_APPS.

**i18n & content:** `generateRoadmapNodes()` in `SkillRoadmap.tsx` has ~700 lines of Indonesian course data (YouTube links, free-tier resources). Huge manual translate/curate for target locale.

**Single-roadmap-per-user constraint:** switching careerPath overwrites progress. Extend schema to index `(userId, careerPath)` if target needs multi-path.

See `_porting-guide.md`.
