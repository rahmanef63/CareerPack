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

## Appendix — When in doubt

- Read `CLAUDE.md` first — project invariants the repo enforces via
  hooks.
- `docs/architecture.md` — shape of the codebase.
- `docs/rules.md` — non-negotiable conventions.
- `docs/qa/ui-sweep-prompt.md` — the QA protocol.
- `docs/features/<slice>.md` — per-slice deep dive.

Questions about intent (not syntax): check `docs/progress.md` and the
PR history (`git log --oneline --merges`) for the decision trail.
