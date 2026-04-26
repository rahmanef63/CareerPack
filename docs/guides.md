# CareerPack — Contributor Guides

Step-by-step recipes for the workflows agents + humans hit most often.
Paired with `docs/rules.md` (non-negotiables) and `docs/architecture.md`
(shape of the codebase).

---

## G1. Add a new dashboard slice

**Two edits + a slice folder.** That's the whole flow.

```bash
# 1. Scaffold the slice
mkdir -p frontend/src/slices/my-feature/{components,hooks,types}
cat > frontend/src/slices/my-feature/index.ts <<'EOF'
export { MyFeatureView } from "./components/MyFeatureView";
EOF
```

**2. Register the view** in `frontend/src/shared/lib/dashboardRoutes.tsx`:

```tsx
const MY_FEATURE: View = dynamic(
  () => import("@/slices/my-feature").then((m) => m.MyFeatureView),
  { loading: loadingFallback }
);

export const DASHBOARD_VIEWS: Record<string, View> = {
  // ...
  "my-feature": MY_FEATURE,
};
```

**3. Add to nav** in `frontend/src/shared/components/layout/navConfig.ts`:

```ts
export const MORE_APPS: ReadonlyArray<MoreAppTile> = [
  // ...
  {
    id: "my-feature",
    label: "My Feature",
    icon: SomeIcon,
    href: "/dashboard/my-feature",
    hue: "from-sky-400 to-sky-600",
  },
];
```

Routing, lazy loading, sidebar, breadcrumb, and MobileContainer more-drawer
all pick it up automatically.

**R1** forbids cross-slice imports. Share via `@/shared/*`.

---

## G2. Add a Convex mutation

```ts
// convex/myFeature.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser, requireOwnedDoc } from "./_lib/auth";

export const create = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);        // R4
    const title = args.title.trim();
    if (title.length === 0 || title.length > 120) {
      throw new Error("Judul 1-120 karakter");    // R5 + R8
    }
    return await ctx.db.insert("myFeature", {
      userId,
      title,
      notes: args.notes?.trim(),
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("myFeature"), title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireOwnedDoc(ctx, args.id, "Item");  // ownership check
    const patch: Partial<Doc<"myFeature">> = {};
    if (args.title !== undefined) patch.title = args.title.trim();
    await ctx.db.patch(args.id, patch);
  },
});
```

Then register the module in `convex/_generated/api.d.ts`:

```ts
import type * as myFeature from "../myFeature.js";
// ...
declare const fullApi: ApiFromModules<{
  // ...
  myFeature: typeof myFeature;
}>;
```

(In a live dev session this generates automatically via `pnpm backend:dev`;
for offline work, edit by hand then verify typecheck.)

Schema additions go in `convex/schema.ts` with `v.optional(...)` unless the
field is load-bearing and every existing row can be backfilled in the same
PR (**R14**).

---

## G3. Apply a theme preset — programmatically

```ts
import { applyPreset, previewPreset, restoreSavedPreset }
  from "@/shared/lib/themePresets";

// Commit (persist to localStorage, fire transition)
await applyPreset("cosmic-night");

// Preview (no persist — use on hover)
await previewPreset("bubblegum");

// Revert to last committed value (mouseleave / outside-click / Escape)
await restoreSavedPreset();

// Clear override (back to Modern Minimal default)
await applyPreset(null);
```

Don't write to `:root.style.setProperty` directly. Always go through
`themePresets.ts` so the style-tag injection + transition pulse stays in sync.

---

## G4. Add a new theme color token

1. Pick the OKLCH value. Open `/r/registry.json` and read modern-minimal's
   equivalent token for reference.
2. Add to `frontend/src/shared/styles/index.css`:

   ```css
   :root {
     --my-token: 0.62 0.19 259.81;       /* L C H — document the hue */
   }
   .dark {
     --my-token: 0.71 0.14 254.62;
   }
   ```

3. Add to `frontend/tailwind.config.ts`:

   ```ts
   colors: {
     "my-token": {
       DEFAULT: "oklch(var(--my-token) / <alpha-value>)",
     },
     // or, if a *-foreground pair exists:
     "my-token": {
       DEFAULT: "oklch(var(--my-token) / <alpha-value>)",
       foreground: "oklch(var(--my-token-foreground) / <alpha-value>)",
     },
   }
   ```

4. If the token should track a tweakcn preset, add the registry key to
   `COLOR_TOKENS` in `shared/lib/themePresets.ts` so `writeVars` emits it.

Never hard-code the color elsewhere (**R2**).

---

## G5. Add a new font for a preset

1. Check usage count in `public/r/registry.json` — don't register fonts
   used by < 3 presets.
2. Install via `next/font/google` in `frontend/app/layout.tsx`:

   ```tsx
   import { My_Font } from "next/font/google"

   const myFont = My_Font({
     subsets: ["latin"],
     variable: "--font-my-font",
     display: "swap",
     weight: ["400", "500", "600", "700"],  // trim weights to limit bundle
   });

   const ALL_FONT_CLASSES = [
     // ...
     myFont,
   ].map((f) => f.variable).join(" ");
   ```

3. Add to `shared/lib/registryFonts.ts` map:

   ```ts
   export const REGISTRY_FONT_VAR: Readonly<Record<string, string>> = {
     // ...
     "my font": "font-my-font",
   };
   ```

4. Typecheck + build; browser lazy-loads the woff2 on first preset apply
   that references the family.

---

## G6. Open a public profile for a user

Convex-side contract (`convex/publicProfile.ts`):
- `getMyPublicProfile` returns the current user's settings
- `updateMyPublicProfile` patches fields; mutations validate slug + URLs +
  control chars
- `getBySlug` is the public-facing read; returns `null` for every failure
- `isSlugAvailable` checks against reserved-name blocklist + uniqueness

Next.js route: `frontend/app/[slug]/page.tsx`:
- Server Component, `ConvexHttpClient` (never the React client — no
  client-auth leak)
- `export const revalidate = 60` absorbs enumeration scraping via CDN
- `generateMetadata` emits `robots: noindex` unless `publicAllowIndex`
  is true

To test: enable a profile in Settings → Profil Akun → Profil Publik,
set slug, visit `/your-slug`. Check DevTools → Elements → `<meta name="robots">`
confirms `noindex` when opt-in is off.

---

## G7. Ship a regression fix with a token alpha utility

1. Reproduce: pick any `bg-<token>/NN` that's not working.
2. Check `tailwind.config.ts` — does the token carry `/ <alpha-value>`?
   If not, add it (see R2). **Zero component changes needed** — the
   existing slash-alpha callsites start resolving correctly.
3. Gate: typecheck + lint + test + build.
4. PR title: `fix(theme): ...`. Body documents:
   - Which token was broken
   - Grep count of affected callsites
   - A before/after screenshot if possible

---

## G8. Add an admin panel

Admin views live in `frontend/src/slices/admin/components/`. Pattern:

```tsx
// AdminFooPanel.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export function AdminFooPanel() {
  const data = useQuery(api.admin.listFoo, { limit: 50 });
  // ... render table / list / metrics
}
```

Convex-side `api.admin.listFoo`:

```ts
export const listFoo = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);      // R4
    // ...
  },
});
```

Add the panel as a `<TabsContent>` in `AdminDashboard.tsx`. Tabs use
`variant="equal" cols={N}` per existing convention.

---

## G9. Deploy to production (Dokploy self-hosted)

Environment variables (Convex env):
- `ADMIN_BOOTSTRAP_EMAILS` — comma-separated, auto-promotes matching logins
- `OPENAI_API_KEY` (or provider-specific) — for AI Assistant
- `CONVEX_SITE_URL` — used by auth config

Frontend `.env.production`:
- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL

Scripts:
- `pnpm backend:deploy` — deploy Convex schema + functions
- `pnpm build && pnpm start` — Next.js production

Pre-deploy checklist:
- [ ] `pnpm typecheck && pnpm lint && pnpm test`
- [ ] `pnpm build` clean
- [ ] Convex schema diff doesn't drop required fields
- [ ] New env vars added to Dokploy config
- [ ] DNS + SSL for `<slug>.careerpack.org` (if using subdomain share)
  or `careerpack.org/<slug>` (default)

---

## G10. Debug a preset that looks broken

Symptom playbook:

| Symptom | Likely cause | Fix |
|---|---|---|
| Colors desaturated vs preset screenshot | OKLCH → sRGB clamp | Ensure Tailwind token uses `oklch(var(--x) / <alpha-value>)`, not `hsl(...)`. `oklch-native-pipeline` already landed in PR #16 |
| `bg-<token>/NN` renders full opacity | Missing `/ <alpha-value>` placeholder | Add to tailwind config color def (R2) |
| Font looks like Times on preset switch | Preset's primary family not registered via next/font | Add to `registryFonts.ts` + `layout.tsx` (G5) |
| Dropdown clips last few presets | ScrollArea Radix-Root sizing quirk | Use native `overflow-y-auto` with explicit `h-[min(80vh,32rem)]` (landed in PR #19) |
| Dark mode looks inverted | Hardcoded `via-white` / `text-black` | Replace with `via-background` / `text-foreground` (R2) |
| Hover has no lift | Button variant override killed the base | Use shadcn Button variants verbatim; extend cva not className |

---

## G11. Run QA before a release

1. Pull the latest QA prompt: `docs/qa/ui-sweep-prompt.md`
2. Open the fenced block, paste into auditor session context
3. Do the pre-flight (cache bust + viewport check + deploy verify)
4. Run KPI sweep across all 14 dashboard slices + landing + `/[slug]` demo
5. Write findings to `docs/qa/ui-sweep-audit-YYYY-MM-DD.md` using the
   one-line-per-finding format (see §4 of the prompt)
6. Triage: 🔴 blockers = fix PR; 🟡 risks = issue; 🔵 nits = backlog; ❓ q =
   product owner
7. Append §9 lessons-learned so the prompt self-improves

---

## G12. Wire toast feedback on a mutation / auth flow

Sonner `<Toaster>` is mounted globally (root `Providers`) with
`richColors`, `position="top-center"`, and `closeButton`. Every fire-
and-forget mutation should close the loop with a toast — don't leave
users staring at a silent form.

```tsx
import { toast } from "sonner";

async function handleSave() {
  try {
    await save({ ...payload });
    toast.success("Perubahan disimpan", {
      description: "Sinkron ke cloud berhasil.",
      duration: 2500,
    });
  } catch (err) {
    toast.error("Gagal menyimpan", {
      description: err instanceof Error ? err.message : "Coba lagi.",
    });
  }
}
```

**Auth flow — register = auto sign-in + toast + push.** `useAuth.login`
and `useAuth.register` both call `signIn("password", { flow })` so the
Convex session is live the moment the promise resolves. Do **not** ask
the user to log in again after registration. Pattern:

```tsx
const success = await register({ email, password, name });
if (success) {
  toast.success(`Selamat datang, ${firstName}! 🎉`, {
    description: "Akun berhasil dibuat — mengarahkan ke dashboard…",
    duration: 3500,
  });
  router.push("/dashboard");
}
```

The `RouteGuard` on `/dashboard` shows `<LoadingScreen />` during the
~200 ms `useConvexAuth().isLoading` transition, then the dashboard
renders. Toast persists cross-route because Toaster lives at the root.

Rules of thumb:
- **Success** → `toast.success()` 2–3 s.
- **Error** → `toast.error()` default duration (no auto-dismiss on
  actionable errors; rely on the close button).
- **Long-running** → `toast.promise(promise, { loading, success, error })`.
- Copy in Indonesian (**R8**). Use first-name personalization when you
  have it. Emoji sparingly (welcome / celebration only).

---

## G13. Wire a slice to Convex (persistence patterns)

Every feature slice should persist state via Convex. localStorage is
OK for ephemeral UI prefs, not for user data. The project uses three
recurring patterns — pick based on data shape.

**Pattern A — frontend-owns-template, server-stores-state**

Use when the *template* (labels, descriptions, structure) is content
that ships with the app, and only *progress* (completed, notes, scores)
belongs to the user. Examples: document-checklist, skill-roadmap.

```tsx
const checklist = useQuery(api.documents.getUserDocumentChecklist);
const seed = useMutation(api.documents.seedDocumentChecklist);
const update = useMutation(api.documents.updateDocumentStatus);

useEffect(() => {
  if (checklist === undefined || checklist !== null) return;
  seed({ type: "combined", template: FRONTEND_TEMPLATE }).catch(() => {});
}, [checklist, seed]);

// Render merges template (title/description) with server state
// (completed/notes/expiryDate) by id.
const items = useMemo(() => {
  const byId = new Map((checklist?.documents ?? []).map(d => [d.id, d]));
  return FRONTEND_TEMPLATE.map(tpl => ({ ...tpl, ...byId.get(tpl.id) }));
}, [checklist]);
```

The `seed` mutation on server MUST merge-preserve existing state so
re-seeding after a template update doesn't wipe progress (`convex/
documents.ts:seedDocumentChecklist` shows the merge-by-id pattern).

**Pattern B — optimistic update + rollback**

Use for fire-and-forget toggles where UX must feel instant. Examples:
skill-roadmap completion toggle, document-checklist item toggle.

```tsx
const toggle = async (id: string) => {
  const wasCompleted = state.has(id);
  // 1. Apply optimistically
  setState(prev => /* flip */ );
  try {
    await updateSkillProgress({ skillId: id, status: wasCompleted ? "not-started" : "completed" });
  } catch (err) {
    // 2. Rollback on failure
    setState(prev => /* unflip */ );
    toast.error("Gagal menyimpan", { description: err?.message });
  }
};
```

**Pattern C — debounced upsert for burst writes**

Use when user input emits many updates per second (sliders, text input,
chat). Collapse to one write per quiet period.

```tsx
const debouncers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

function schedule(key: string, doWrite: () => void, ms = 400) {
  const prev = debouncers.current.get(key);
  if (prev) clearTimeout(prev);
  const t = setTimeout(() => {
    doWrite();
    debouncers.current.delete(key);
  }, ms);
  debouncers.current.set(key, t);
}
```

Financial calculator's monthlyIncome and AI agent's `upsertSession` both
use this. 400 ms is a reasonable default — human typing bursts rarely
leave 400 ms gaps.

**Pattern D — localStorage → Convex one-shot migration**

Use when a feature previously stored data in localStorage and now
persists to Convex. Run migration ONCE per user per deploy, then clear
the legacy key.

```tsx
const MIGRATION_DONE_KEY = "careerpack_<feature>_migrated_v1";

useEffect(() => {
  if (serverData === undefined) return;
  if (hydratedRef.current) return;
  hydratedRef.current = true;

  const done = localStorage.getItem(MIGRATION_DONE_KEY) === "1";
  if (done) return;

  const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]");
  if (legacy.length === 0) {
    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    return;
  }

  Promise.all(legacy.map(upsertMutation)).finally(() => {
    localStorage.setItem(MIGRATION_DONE_KEY, "1");
    localStorage.removeItem(LEGACY_KEY);
  });
}, [serverData]);
```

AI agent chat (`AIAgentConsole.tsx`) migrates `careerpack_ai_sessions`
this way — see the one-shot block in the first-mount effect.

**Gotchas:**
- `useQuery(...)` returns `undefined` while loading, `null` when the
  user is unauth OR no row exists — distinguish the two in your effect.
- Hydrate guard with a `useRef(false)` flag so effects don't fire on
  every subsequent query refetch.
- Mutations throw on R5 violations — always `.catch()` and surface via
  `toast.error`.

---

## G14. Upload a file to Convex storage

Convex self-hosted ships with a built-in blob store — no S3, R2, or
MinIO dependency. Files live on the Convex container's filesystem; the
`files` table in `convex/schema.ts` stores only metadata.

### Backend — `convex/files.ts`

Five functions. All mutations guarded with `requireUser`; `getFileUrl`
verifies tenant match and returns `null` for every failure
(enumeration-safe per R6).

- `generateUploadUrl` — mints a short-lived upload URL
- `saveFile` — persists metadata, server-derives `uploadedBy` +
  `tenantId` from auth (clients NEVER pass these)
- `getFileUrl` — returns CDN URL or `null` on access denial
- `listMyFiles` — all uploads by current tenant
- `deleteFile` — ownership-gated; DB row first, storage second

**Client accepts:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`,
`application/pdf`. Raster images get **converted to WebP in the browser**
before upload (Canvas `toBlob('image/webp', 0.9)`, original resolution
preserved). PDFs pass through unchanged.

**Server accepts:** `image/webp` + `application/pdf` **only**. Raw JPEG
or PNG reaching `saveFile` means the client bypassed the converter and
is rejected with `"Tipe file tidak didukung"`. Single enforcement
point, no drift possible.

**Size cap:** 10 MB for images (applied BEFORE conversion — blocks OOM
on mobile Canvas), 50 MB for PDFs. Enforced in:
- `shared/lib/imageConvert.ts` — `MAX_CONVERT_BYTES`
- `shared/hooks/useFileUpload.ts` — `validateFile`
- `convex/files.ts` — `assertAllowedFile`

Expanding any of these requires matching changes everywhere.

### Client — `useFileUpload` hook

```tsx
import { useFileUpload } from "@/shared/hooks/useFileUpload";

function ProfileAvatar() {
  const { upload, isUploading, error, storageId } = useFileUpload();

  const handleFile = async (file: File) => {
    const result = await upload(file);
    if (!result.ok) return;       // error state already set
    // persist result.storageId on the user's profile
  };
}
```

Three-step flow inside `upload()`:
1. `generateUploadUrl()` mutation → signed URL
2. `fetch(url, { method: "POST", body: file })` → returns `{ storageId }`
3. `saveFile({ storageId, fileName, fileType, fileSize })` → DB row

The raw `fetch` call is **the only R12 exception** — Convex upload URLs
are server-minted tokenized handles, functionally same-origin. Don't
replicate this pattern elsewhere.

### Component — `<FileUpload>`

```tsx
import { FileUpload } from "@/shared/components/files/FileUpload";

// Simple — drag/drop + convert to WebP.
<FileUpload
  label="Foto profil"
  accept="image/*"
  onUploaded={({ storageId, fileId }) => {
    // save storageId to user profile / CV / etc.
  }}
/>

// With crop dialog (aspect-locked for avatars).
<FileUpload
  label="Foto profil"
  crop={{ aspect: 1 }}
  onUploaded={(result) => saveAvatar({ storageId: result.storageId })}
/>

// Free crop (no aspect ratio).
<FileUpload crop />
```

Features:
- Drag-and-drop + click-to-browse.
- **Auto WebP conversion** for raster images via Canvas API — client
  sees a "3,4 MB → 1,1 MB (−68%)" delta after upload.
- **EXIF / metadata stripped** as a free side-effect: Canvas drawImage
  copies pixels only. GPS coordinates, camera serial, XMP, and other
  metadata from phone photos are dropped. Even pre-existing WebP input
  is re-encoded to catch metadata that may have been embedded.
- **Optional crop dialog** (opt-in via `crop` prop) powered by
  `react-easy-crop` — touch + mouse, zoom slider, aspect-lock support.
  PDFs skip the crop step regardless.
- **Upload progress %** via XMLHttpRequest (`upload.onprogress`) —
  visible progress bar + percentage. Matters for 50 MB PDFs where
  upload is the slow step.
- Thumbnail preview of the uploaded (converted) image.
- File name + size for non-image.
- Toast on success + compression delta; toast on error.
- Clear button after upload.

### Rendering an uploaded image back from storage

```tsx
const url = useQuery(api.files.getFileUrl, { storageId });
if (url) return <Image src={url} alt="" width={200} height={200} unoptimized />;
```

`getFileUrl` returns `null` if the caller isn't the owner, so a
recruiter viewing another user's public profile can't scrape private
uploads by guessing storage ids.

### Avatar integration (reference wiring)

`convex/users.ts` — `updateAvatar({ storageId })` verifies the file
belongs to the caller (via `files.tenantId`), then patches
`userProfiles.avatarStorageId`. `getCurrentUser` resolves the URL
inline (`ctx.storage.getUrl`) and returns it as `avatarUrl` so the
client doesn't need a second round-trip.

`useAuth` maps `currentUser.avatarUrl` onto `state.user.avatar`;
`nav-user.tsx` already reads `user?.avatar` for `<AvatarImage>`.
End result: drop a photo in Settings → Profil Saya and it appears
in the sidebar immediately on next query refetch.

Reference consumer: `frontend/src/slices/settings/components/
ProfileSection.tsx` — gates the `<FileUpload crop={{ aspect: 1 }}>`
behind "profile must be saved first" so `updateAvatar` always has a
`userProfiles` row to patch.

### When NOT to use Convex storage

- Files > 50 MB — cap is intentional; raise only with performance review.
- Video/audio — Convex blob store isn't streaming-optimized. Use a
  proper media service if CareerPack ever adds interview recording.

---

## Appendix — When in doubt

- Read `CLAUDE.md` first — project invariants the repo enforces via
  hooks.
- `docs/architecture.md` — shape of the codebase.
- `docs/rules.md` — non-negotiable conventions.
- `docs/qa/ui-sweep-prompt.md` — the QA protocol.
- `docs/features/<slice>.md` — per-slice deep dive.

Questions about intent (not syntax): check `docs/progress.md` and the
PR history (`git log --oneline --merges`) for the decision trail.
