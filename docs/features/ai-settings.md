# AI Settings

## Tujuan

Per-user AI provider config — user pilih provider (OpenAI / OpenRouter / Groq / dll), model default, base URL, dan simpan API key sendiri. Override env backend default untuk user yang bring-own-key.

## Route & Entry

- URL: `/dashboard/ai-settings`
- Terdaftar di `navConfig.MORE_APPS` (label "Setelan AI", badge AI) + `dashboardRoutes.DASHBOARD_VIEWS`
- Slice: `frontend/src/slices/ai-settings/`
- Komponen utama: `AISettingsPanel.tsx`

## Struktur Slice

```
ai-settings/
├─ index.ts
└─ components/AISettingsPanel.tsx
```

## Data Flow

Convex module: `convex/ai/` + helper `convex/_shared/aiProviders.ts`. Tabel: `aiSettings`.

| Operasi | Convex |
|---|---|
| List provider spec | `api.ai.queries.listAIProviders` (public, read-only) |
| Fetch user config | `api.ai.queries.getMyAISettings` (apiKey di-mask via `maskKey`) |
| Save config | `api.ai.mutations.setMyAISettings` |
| Toggle enabled | `api.ai.mutations.toggleAIEnabled` |
| Clear | `api.ai.mutations.clearMyAISettings` |
| Test connectivity | `api.ai.actions.testConnection` |
| Internal fetch untuk action lain | `internal.aiSettings._getForUser` |

Provider spec di `convex/_shared/aiProviders.ts`:

```ts
AI_PROVIDERS = {
  openai:     { baseUrl: "https://api.openai.com/v1", models: ["gpt-4.1", "gpt-4o-mini", …] },
  // openrouter, groq, dll
}
listProvidersPublic() // expose tanpa credential
```

API key di-mask saat `getMine` return — 4 char prefix + middle `•••` + 4 char suffix. Raw key tidak leak ke client setelah tersimpan.

## Integration dengan `convex/ai/actions.ts`

Setiap action AI (`generateCareerAdvice`, `generateInterviewQuestions`, `evaluateInterviewAnswer`, `testConnection`) runtime read user config:

```ts
const cfg = await ctx.runQuery(internal.aiSettings._getForUser, { userId });
// cfg.enabled ? pakai cfg.{baseUrl, apiKey, model} : fallback ke env CONVEX_OPENAI_*
```

Fallback chain:
1. User config `enabled` → pakai `cfg.baseUrl`, `cfg.apiKey`, `cfg.model`
2. Kalau `disabled` / tidak ada row → `requireEnv("CONVEX_OPENAI_BASE_URL")` + `requireEnv("CONVEX_OPENAI_API_KEY")`

## State Lokal

- `providers` — list dari `listProviders`
- `current` — `getMine` response (termasuk `apiKey` masked)
- Form: `providerId`, `baseUrl`, `model`, `apiKey`, `enabled`
- `showKey` toggle untuk Eye/EyeOff pada input

## Dependensi

- shadcn: `card`, `input`, `label`, `select`, `switch`, `alert`, `button`
- `lucide-react`: Sparkles, Eye, EyeOff, ExternalLink, Wand2, Trash2
- `sonner` toast

## Catatan Desain

- **Mengapa per-user provider?** Cost isolation — user power pakai credit sendiri (OpenRouter / Groq / Azure), free user pakai quota terbatas dari env default backend.
- **Key security**: disimpan plaintext di Convex row (encrypted at rest via Convex storage). Never echo-back ke client.
- **Model list statis** di `AI_PROVIDERS` — predictability > fleksibilitas. Alternatif (fetch `/models` runtime) bikin UX lambat + error handling lebih rumit.
- **Rate limit tetap enforce** — user dengan API key sendiri tetap kena `AI_RATE_LIMITS["ai:minute"/"ai:day"]` di table `rateLimitEvents` supaya infra backend tidak overload.

## Extending

- Provider-specific feature flag (function calling, vision, JSON mode) → tambah field di `AIProviderSpec`.
- Key rotation reminder — notification setiap 90 hari.
- Usage analytics per user — aggregate `rateLimitEvents` + token count (butuh field `tokens` tambahan).

---

## Portabilitas

**Tier:** M — small slice + Convex module + 1 schema table.

**Files:**

```
frontend/src/slices/ai-settings/
convex/ai/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/ai-settings" "$DST/frontend/src/slices/"
cp "$SRC/convex/ai/"               "$DST/convex/"
```

**Schema:** add `aiSettings` table (`provider`, `model`, `apiKey`, `baseUrl?`, `enabled`, `updatedAt`) with `by_user` index.

**Convex api.d.ts:** add `aiSettings`.

**Consumer:** `convex/ai/actions.ts` reads from aiSettings to determine provider. Port together with ai-agent.

**npm deps / env:** none specific.

**Nav:** surfaced via Settings tab, no dedicated slug (legacy `/dashboard/ai-settings` resolves to Settings).

**i18n:** provider list + form labels in Indonesian.

See `_porting-guide.md`.
