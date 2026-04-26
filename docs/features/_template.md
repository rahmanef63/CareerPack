# &lt;Feature Name&gt;

> **Portability tier:** S / M / L / XL (see `_porting-guide.md` §8)

## Tujuan

1–2 kalimat: masalah apa yang dipecahkan, siapa penggunanya.

## Route & Entry

- URL: `/dashboard/<slug>` (or N/A for infrastructure)
- Slice: `frontend/src/slices/<slice>/`
- Main component: `<Name>.tsx`

## Struktur Slice

```
<slice>/
├─ index.ts
├─ components/…
├─ hooks/…          (optional)
├─ lib/…            (optional)
├─ types/…          (optional)
└─ constants/…      (optional)
```

## Data Flow

Backend table(s): `<table_name>` di `convex/<module>.ts`

| Hook / Query | Convex function | Purpose |
|---|---|---|
| `use<Something>.data` | `api.<module>.getX` | What it returns |
| `use<Something>.save` | `api.<module>.updateX` | What it writes |

## State Lokal

- `xyz` — what it tracks
- `abc` — what it tracks

## Dependensi

- `@/shared/…` — list cross-slice imports
- shadcn — list primitives used
- Extra npm — list (if any)

## Catatan Desain

Key constraints, trade-offs, quirks that future maintainers need to know.

## Extending

What's a natural next step (deferred features, obvious follow-ups).

---

## Portabilitas

**Tier:** S / M / L / XL

**Files untuk dicopy:**

```
# Slice itself
frontend/src/slices/<slice>/

# Shared dependencies
frontend/src/shared/hooks/<hook>.ts
frontend/src/shared/components/<component>.tsx
frontend/src/shared/types/<types>.ts

# Backend
convex/<module>.ts
# (also add table(s) to target's convex/schema.ts — see below)
```

**cp commands** (from CareerPack root → target project root):

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/<slice>" "$DST/frontend/src/slices/"

# Shared helpers
mkdir -p "$DST/frontend/src/shared/hooks"
cp "$SRC/frontend/src/shared/hooks/<hook>.ts" "$DST/frontend/src/shared/hooks/"

# Backend module
cp "$SRC/convex/<module>.ts" "$DST/convex/"
```

**Schema additions** (append to target's `convex/schema.ts`):

```ts
<table_name>: defineTable({
  userId: v.id("users"),
  // … copy from CareerPack schema.ts exactly
}).index("by_user", ["userId"]),
```

**Convex api.d.ts** — add import + typeof alias (see `_porting-guide.md` §2).

**npm deps** — none / list them if any.

**Env vars** — none / list them.

**Nav registration** — edit `dashboardRoutes.tsx` + `navConfig.ts`
(see `_porting-guide.md` §4).

**i18n** — Indonesian copy locations: grep for `"Tambah"`, `"Simpan"`,
`"Hapus"` etc. in the slice folder (see `_porting-guide.md` §5).

**Common breakage after port:**
- (list known issues)

**Testing the port:** run the `_porting-guide.md` §9 checklist.
