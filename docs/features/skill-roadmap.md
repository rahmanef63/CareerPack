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

Convex: tabel `skillRoadmaps` via `convex/roadmaps.ts`.

| Operasi | Convex |
|---|---|
| Fetch roadmap aktif | `api.roadmaps.getUserRoadmap` |
| Buat baru | `api.roadmaps.createRoadmap` (populate dari `defaultRoadmaps[careerPath]`) |
| Update status skill | `api.roadmaps.updateSkillProgress` |

Seed: `convex/roadmaps.ts` embed 3+ template (`frontend-developer`, dst) — array skill dengan `id, name, category, level, priority, estimatedHours, prerequisites, resources`.

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
