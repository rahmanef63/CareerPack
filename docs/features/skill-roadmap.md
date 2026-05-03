# Skill Roadmap

> **Portability tier:** L — slice (large) + Convex module (5 files) +
> 3 schema tables + curated Indonesian template seed

## Tujuan

Peta skill interaktif per career path. Tiga sumber data:
1. **Roadmap aktif** user (1 doc per user, multi-domain pun overwrite).
2. **Roadmap templates** publik di `roadmapTemplates` (tech, business,
   creative, education, …) — admin curatable.
3. **Saved/bookmarked** template slugs di `roadmapSaved` (the
   "Skill Saya" tab without forcing multi-active model).

User toggle progress per node → progress persen auto-update dengan
gamification (XP, badges, theme: warrior / scholar / explorer / artisan).

## Route & Entry

- URL: `/dashboard/roadmap`
- Slice: `frontend/src/slices/skill-roadmap/`
- Komponen utama: `SkillRoadmap.tsx`
- **No manifest yet** — slice belum diregister di `sliceRegistry.ts`;
  nav fallback ke `dashboardRoutes.tsx` + `navConfig.ts` (legacy).

## Struktur Slice

```
skill-roadmap/
├─ index.ts                                      barrel: SkillRoadmap + types
├─ components/
│  ├─ SkillRoadmap.tsx                           page shell — tabs (Roadmap aktif/Cari Skills/Skill Saya)
│  ├─ RoadmapBrowser.tsx                         "Cari Skills" — search + domain filter atas template publik
│  ├─ RoadmapTable.tsx                           list view nodes
│  ├─ SavedRoadmapsGrid.tsx                      "Skill Saya" tab — bookmark grid
│  ├─ GamificationPanel.tsx                      XP / streak / badge sidebar
│  └─ skill-roadmap/
│     ├─ NodeDetailDialog.tsx                    dialog detail node (resources, prereq)
│     ├─ RoadmapNodeComponent.tsx                node card (status toggle + meta)
│     └─ RoadmapSidebar.tsx                      filters + summary
├─ constants/
│  └─ builder.ts                                 default builder presets (theme, xpPerHour, …)
├─ hooks/
│  ├─ useSkillRoadmap.ts                         active roadmap CRUD + progress
│  └─ useRoadmapGamification.ts                  XP/streak derivation
├─ lib/
│  ├─ fallback.ts                                fallback nodes when template empty
│  ├─ gamification.ts                            XP formula, badge thresholds
│  └─ treeBuilder.ts                             flat nodes → parent/child tree
└─ types/
   ├─ index.ts                                   RoadmapCategory, RoadmapNode, RoadmapResource
   └─ builder.ts                                 TemplateBuilderState (admin/edit flow)
```

## Data Flow

Backend: 3 tabel di `convex/roadmap/`.

| Hook / call | Convex op | Purpose |
|---|---|---|
| `useSkillRoadmap().roadmap` | `api.roadmap.queries.getUserRoadmap` | Active roadmap |
| `useSkillRoadmap().seed` | `api.roadmap.mutations.seedRoadmap` | Init/replace from template (preserve completed status) |
| `useSkillRoadmap().updateNode` | `api.roadmap.mutations.updateSkillProgress` | Toggle node status |
| `templates.list` | `api.roadmap.templates.listTemplates` | Public templates (filter by domain) |
| `templates.get` | `api.roadmap.templates.getTemplateBySlug` | Single template by slug |
| Admin upsert | `api.roadmap.templates.upsertTemplate` | Publish/edit template |
| `saved.list` | `api.roadmap.saved.listSavedSlugs` | User's bookmarked slugs |
| `saved.toggle` | `api.roadmap.saved.toggleSavedSlug` | Bookmark/unbookmark |

Convex module files:
- `queries.ts`, `mutations.ts` — active-roadmap CRUD
- `templates.ts` — public template CRUD + admin upsert
- `saved.ts` — bookmark CRUD (`roadmapSaved` table)
- `schema.ts` — 3 tables + shared validators (`templateNodeValidator`,
  `templateManifestValidator`, `templateConfigValidator`,
  `VALID_DOMAINS` whitelist)

Progress auto-computed inside `updateSkillProgress`:
`(completed / total) × 100`.

## State Lokal

- `selectedCategory` / `selectedDomain` — filters
- `expandedNodeId` — detail dialog target
- `searchQuery`
- Active tab: `aktif | cari | saya`

## Dependensi

- `@/shared/types` — re-exports `TemplateNode`
- `@/shared/components/layout/PageContainer`
- `@/shared/components/ui/responsive-page-header`
- `@/shared/components/ui/responsive-dialog`
- `@/shared/components/ui/responsive-select`
- `@/shared/lib/notify` — toast wrapper
- `@/shared/lib/utils` — `cn`
- `@/shared/hooks/useAuth` (transitive via `useSkillRoadmap`)
- shadcn primitives: `card`, `button`, `badge`, `progress`, `tabs`,
  `input`, `skeleton`
- npm: none (no `@dnd-kit`, no `recharts`, no extras)

## Catatan Desain

- **3 tables, not 1** — active roadmap (`skillRoadmaps`), public
  templates (`roadmapTemplates`), and bookmarks (`roadmapSaved`)
  are separate to avoid the single-active model from forcing
  multi-doc rewrite. Switching active = re-seed; bookmark persists.
- Validator `templateNodeValidator` is exported for both publish
  mutations AND admin UI — single source of truth for the node shape.
- Gamification theme (`warrior | scholar | explorer | artisan`) is a
  client-side render concern; server only stores the picker value in
  `roadmapTemplates.config.theme`.
- Domain whitelist (`VALID_DOMAINS`) enforced server-side; new domain
  = edit `convex/roadmap/schema.ts` + UI labels.

## Extending

- AI-generated personal roadmap → action `generateRoadmap({ targetRole,
  experience })` calling OpenAI-compat → upsert into
  `roadmapTemplates` with `authorId`.
- Add manifest + capability binder (skills like
  `roadmap.list-templates`, `roadmap.toggle-node`) — pattern matches
  calendar/applications.
- Sync estimasi jam dengan study tracker (Toggl/RescueTime).

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/skill-roadmap/

# Shared deps
frontend/src/shared/components/layout/PageContainer.tsx
frontend/src/shared/components/ui/responsive-page-header.tsx
frontend/src/shared/components/ui/responsive-dialog.tsx
frontend/src/shared/components/ui/responsive-select.tsx
frontend/src/shared/lib/notify.ts
frontend/src/shared/types/index.ts                        # if exports TemplateNode

# Backend
convex/roadmap/                                           # queries.ts, mutations.ts, templates.ts, saved.ts, schema.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/skill-roadmap" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/lib"
mkdir -p "$DST/frontend/src/shared/components/layout"
mkdir -p "$DST/frontend/src/shared/components/ui"

cp "$SRC/frontend/src/shared/components/layout/PageContainer.tsx"        "$DST/frontend/src/shared/components/layout/"
cp "$SRC/frontend/src/shared/components/ui/responsive-page-header.tsx"   "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-dialog.tsx"        "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/components/ui/responsive-select.tsx"        "$DST/frontend/src/shared/components/ui/"
cp "$SRC/frontend/src/shared/lib/notify.ts"                              "$DST/frontend/src/shared/lib/"

# Backend (full module — 5 files)
cp -r "$SRC/convex/roadmap" "$DST/convex/"
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
// Shared validators (export at top of file or import from convex/roadmap/schema.ts)
const templateNodeValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  difficulty: v.string(),
  estimatedHours: v.number(),
  prerequisites: v.array(v.string()),
  parentId: v.optional(v.string()),
  category: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  resources: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.string(),
    url: v.string(),
    free: v.boolean(),
  })),
});

skillRoadmaps: defineTable({
  userId: v.id("users"),
  careerPath: v.string(),
  templateId: v.optional(v.id("roadmapTemplates")),
  skills: v.array(v.object({
    id: v.string(),
    name: v.string(),
    category: v.string(),
    level: v.string(),
    priority: v.number(),
    estimatedHours: v.number(),
    prerequisites: v.array(v.string()),
    status: v.string(),
    resources: v.array(v.object({
      type: v.string(),
      title: v.string(),
      url: v.string(),
      completed: v.boolean(),
    })),
    completedAt: v.optional(v.number()),
  })),
  progress: v.number(),
}).index("by_user", ["userId"]),

roadmapTemplates: defineTable({
  title: v.string(),
  slug: v.string(),
  domain: v.string(),
  icon: v.string(),
  color: v.string(),
  description: v.string(),
  tags: v.array(v.string()),
  nodes: v.array(templateNodeValidator),
  isPublic: v.boolean(),
  isSystem: v.boolean(),
  order: v.number(),
  authorId: v.optional(v.id("users")),
  authorName: v.optional(v.string()),
  manifest: v.optional(v.object({
    version: v.optional(v.string()),
    license: v.optional(v.string()),
    language: v.optional(v.string()),
    outcomes: v.optional(v.array(v.string())),
    prerequisites: v.optional(v.array(v.string())),
    targetAudience: v.optional(v.string()),
  })),
  config: v.optional(v.object({
    xpPerHour: v.optional(v.number()),
    theme: v.optional(v.string()),
    questFlavor: v.optional(v.string()),
  })),
})
  .index("by_slug", ["slug"])
  .index("by_domain", ["domain"])
  .index("by_order", ["order"])
  .index("by_author", ["authorId"]),

roadmapSaved: defineTable({
  userId: v.id("users"),
  slugs: v.array(v.string()),
}).index("by_user", ["userId"]),
```

The cleanest approach: copy `convex/roadmap/schema.ts` wholesale and
import its `roadmapTables` const into `convex/schema.ts`.

**Convex `api.d.ts`** — add `roadmap: typeof roadmap`.

**npm deps** — none.

**Manifest + binder wiring** — N/A: this slice does **not** have
`manifest.ts` or a `Capabilities` binder yet. Skip.

**Nav registration** (legacy):

1. `frontend/src/shared/lib/dashboardRoutes.tsx` — add lazy import
   for `SkillRoadmap` keyed by slug `roadmap`.
2. `frontend/src/shared/components/layout/navConfig.ts` — add
   `MORE_APPS` entry with `href: "/dashboard/roadmap"`.

**Env vars** — none beyond Convex baseline.

**i18n & content** — bulk Indonesian content lives in the seeded
templates (`convex/_seeds/`) and resource URLs (YouTube channel
Indonesia, Dicoding, Indosat-supported courses). For an English
target: re-author templates via the admin UI or write a new seed
file referencing English course providers (freeCodeCamp, MDN,
Coursera).

**Single-roadmap-per-user constraint:** switching `careerPath`
overwrites progress. Extend schema to index `(userId, careerPath)`
if target needs multi-path.

**Common breakage after port:**

- **`templateNodeValidator` import path** — the slice's
  `types/builder.ts` re-uses the server-side validator shape via
  the Convex types. Make sure `convex/roadmap/schema.ts` exports
  the validators (it does in CareerPack) so admin UI doesn't
  diverge.
- **Empty browse tab** — `roadmapTemplates` table starts empty.
  Run `convex/_seeds/` (the seed file pushes ~10 templates) or
  authorize an admin and create via UI.
- **Domain dropdown missing options** — `VALID_DOMAINS` set in
  `convex/roadmap/schema.ts` is the SSOT; UI reads it. Edit there
  to add a new domain.
- **Resource links 404** — most are Indonesian-language YouTube /
  Dicoding URLs; expect to re-curate for English markets.

**Testing the port:**

1. Navigate `/dashboard/roadmap` → 3 tabs render (Roadmap aktif /
   Cari Skills / Skill Saya)
2. "Cari Skills" tab → templates appear after seed
3. Click a template → "Mulai" → seedRoadmap fires → "Roadmap aktif"
   tab populated
4. Toggle node status → progress % updates immediately
5. Bookmark a template → appears in "Skill Saya" tab
6. Reload → state persists

Run `_porting-guide.md` §9 checklist.
