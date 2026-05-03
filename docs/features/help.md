# Help (Pusat Bantuan)

> **Portability tier:** S — slice-only with one mutation (feedback).

## Tujuan

Pusat bantuan satu halaman: FAQ akordion, panduan per fitur (quick
links), pintasan keyboard, kontak dukungan (email + GitHub issues),
form kirim masukan ke tim. Tidak ada state lintas halaman; murni
informasi statis + 1 form mutation.

## Route & Entry

- URL: `/dashboard/help`
- Slice: `frontend/src/slices/help/`
- Komponen utama: `HelpView.tsx`

## Struktur Slice

```
help/
├─ index.ts                       export { HelpView }
└─ components/HelpView.tsx        FAQ + FeatureGuides + Shortcuts + FeedbackSection
```

Konstanta inline di `HelpView.tsx`:
- `FAQ` — `{ q, a }[]` (Indonesian).
- `SHORTCUTS` — `{ keys[], desc }[]` (Ctrl+P, Esc, Tab, dll.).
- `FEATURE_GUIDES` — `{ icon, title, href, description }[]` (CV, Lamaran, Kalender, Roadmap, …).
- `SUPPORT_EMAIL`, `GITHUB_URL`, `APP_VERSION`.

## Data Flow

Read-only kecuali untuk feedback form di bagian bawah:

| Operasi | Convex |
|---|---|
| Submit feedback | `api.feedback.mutations.submitFeedback` |

Halaman tidak fetch query apapun — semua konten hardcoded di
`HelpView.tsx`.

## State Lokal

- `subject`, `message`, `submitting` — feedback form state (via internal `<FeedbackSection>` subcomponent).
- Tidak ada state global; FAQ akordion pakai `<details>` native browser.

## Dependensi

- `@/shared/components/ui/{card,badge,button,input,textarea,label}`.
- `@/shared/components/ui/responsive-page-header`.
- `@/shared/components/layout/PageContainer`.
- `@/shared/lib/notify`.
- `convex/react` — `useMutation`.
- `lucide-react` — banyak icon (BookOpen, Briefcase, Calendar, Calculator, ChevronDown, FileText, HelpCircle, Keyboard, ListChecks, Mail, Map, MessageCircle, MessageSquare, ShieldCheck, Sparkles).

## Catatan Desain

- **Konten statis.** FAQ + shortcut + guide tetap di kode — bukan di DB. Trade-off: edit perlu deploy, tapi i18n + sync pasti.
- **Native `<details>` untuk akordion.** Hemat dari JS state machine; CSS `group-open:rotate-180` untuk chevron.
- **Feedback form tetap pakai `useMutation`** dari `convex/react`, bukan `notify.fromError` wrapper saja — error handling eksplisit + length cap (max 4000 char).
- **APP_VERSION literal.** Tidak baca dari `package.json`; bump manual saat release.

## Extending

- Markdown FAQ source (load JSON / YAML, render via `react-markdown`).
- Search bar di atas FAQ.
- Auto-pick GitHub Issues template via query param.
- Feedback drawer dengan attachment (lewat `useFileUpload`).

---

## Portabilitas

**Tier:** S

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/help/

# Backend (kalau belum)
convex/feedback/
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices" "$DST/convex/feedback"
cp -r "$SRC/frontend/src/slices/help"        "$DST/frontend/src/slices/"
cp -r "$SRC/convex/feedback/."               "$DST/convex/feedback/"
```

**Schema additions** — append to target's `convex/schema.ts`:

```ts
feedbackEntries: defineTable({
  userId: v.optional(v.id("users")),
  email: v.optional(v.string()),
  subject: v.string(),
  message: v.string(),
  resolved: v.boolean(),
  createdAt: v.number(),
}).index("by_user", ["userId"]).index("by_resolved", ["resolved"]),
```

(Confirm shape against `convex/feedback/schema.ts`.)

**Convex api.d.ts** — `feedback`.

**npm deps:** none.

**Env vars:** none. (Optional `SUPPORT_EMAIL`, `GITHUB_URL`,
`APP_VERSION` could be promoted to env, but currently in code.)

**Nav registration:**

`dashboardRoutes.tsx`:
```ts
const HELP: View = dynamic(
  () => import("@/slices/help").then((m) => m.HelpView),
  { loading: loadingFallback },
);
DASHBOARD_VIEWS["help"] = HELP;
```

`navConfig.ts`:
```ts
{ id: "help", label: "Bantuan", icon: HelpCircle, href: "/dashboard/help", hue: "from-sky-400 to-cyan-600" }
```

**i18n:** **All FAQ + guide content is Indonesian.** Bulk replace ~70
strings before porting to another locale; keep `q` and `a` in
parallel arrays (or convert to `Record<lang, FAQItem[]>` for proper
i18n).

**Common breakage:**

- `api.feedback.mutations.submitFeedback` missing → port `convex/feedback/`.
- Email links open Gmail / mail client unexpectedly — ensure `mailto:` URL is encoded properly (`encodeURIComponent` for subject).
- `@/shared/components/layout/PageContainer` not present → fallback to `<div className="mx-auto max-w-3xl px-4 py-6">`.

**Testing:**
1. Open `/dashboard/help` → FAQ renders, click chevron expands.
2. Click any FEATURE_GUIDE link → navigates to `/dashboard/<slug>`.
3. Submit feedback with subject + 5+ char message → toast success → row in `feedbackEntries` (verifiable via Admin Panel feedback inbox).
4. Submit with < 5 char message → button disabled.
5. Verify `mailto:` opens with `subject=CareerPack Support`.

See `_porting-guide.md`.
