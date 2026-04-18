# AI Settings

## Tujuan

Per-user AI provider config — user pilih provider (OpenAI / OpenRouter / Groq / dll), model default, base URL, dan simpan API key sendiri. Override env backend default untuk user yang bring-own-key.

> Status: **in progress**. `convex/aiSettings.ts` dan `convex/_lib/aiProviders.ts` belum di-push ke `_generated/api`. `api.ai.testConnection` juga belum ada. Typecheck akan error sampai Convex dev push dijalankan. Lihat "Work Remaining" di bawah.

## Route & Entry

- Tidak punya URL sendiri — panel `AISettingsPanel` belum di-register ke `dashboardRoutes.tsx` atau `navConfig`.
- Slice: `frontend/src/slices/ai-settings/`
- Komponen utama: `AISettingsPanel.tsx`

## Struktur Slice

```
ai-settings/
├─ index.ts
└─ components/AISettingsPanel.tsx
```

## Data Flow (Planned)

Convex: `convex/aiSettings.ts` (baru, belum di-push).

| Operasi | Convex |
|---|---|
| List provider spec | `api.aiSettings.listProviders` (public, read-only) |
| Fetch user config | `api.aiSettings.getMine` |
| Save config | `api.aiSettings.setMine` |
| Toggle enabled | `api.aiSettings.toggle` |
| Clear | `api.aiSettings.clearMine` |
| Test connectivity | `api.ai.testConnection` (belum ada — perlu ditambah di `convex/ai.ts`) |
| Internal fetch for action | `api.aiSettings._getForUser` (internal) |

Provider spec di `convex/_lib/aiProviders.ts`:
```ts
AI_PROVIDERS = {
  openai:     { baseUrl: "https://api.openai.com/v1", models: ["gpt-4.1", "gpt-4o-mini", …] },
  // openrouter, groq, dll
}
```

API key di-mask di getMine (hanya 4 char prefix + suffix visible) — raw key tidak leak ke client setelah disimpan.

## Integration Point

Setelah user set config, Convex action AI (mis. `generateCareerAdvice`) harus:

1. Call `ctx.runQuery(internal.aiSettings._getForUser, { userId })` → dapat `{ baseUrl, apiKey, model, enabled }`
2. Kalau `enabled` → pakai user config
3. Kalau tidak → fallback ke env `CONVEX_OPENAI_*`

Saat ini (`convex/ai.ts`) masih hardcode pakai env. Integrasi belum dilakukan — butuh refactor `callOpenAI` untuk accept config per call.

## Dependensi

- shadcn: `card`, `input`, `label`, `select`, `switch`, `alert`, `button`
- `lucide-react`: Sparkles, Eye, EyeOff, ExternalLink, Wand2, Trash2
- `sonner` toast

## Work Remaining

- [ ] Push Convex: `pnpm backend:dev-sync` supaya `_generated/api` include `aiSettings`
- [ ] Tambah `testConnection` action di `convex/ai.ts`
- [ ] Refactor `callOpenAI(ctx, body)` untuk read user config
- [ ] Register route + nav entry (tambah di `navConfig.MORE_APPS` + `dashboardRoutes.DASHBOARD_VIEWS`)
- [ ] Tambah schema tabel `userAISettings` di `convex/schema.ts` (sudah di-modify — verify sebelum push)

## Catatan Desain

- **Mengapa per-user provider?** Cost isolation — user power pakai OpenRouter credits sendiri, free user pakai quota terbatas dari env default.
- **Key security**: disimpan plaintext di Convex row (encrypted at rest via Convex storage), tapi jangan pernah dikirim balik ke client. UI pakai `maskKey()` helper.
- **Model list statis** di `AI_PROVIDERS` — alternatif: fetch `GET /models` per provider saat load. Statis dipilih untuk predictability.
