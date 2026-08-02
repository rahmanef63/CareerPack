# AI Settings

> **Portability tier:** L — slim slice (re-export) + 1 Convex domain (5 tables) + AI proxy stack + admin tools

## Tujuan

Per-user AI provider config — user pilih provider (OpenAI / OpenRouter / Groq / Azure / dll), model default, base URL, dan simpan API key sendiri. Override env backend default untuk user yang bring-own-key. Admin bisa set `globalAISettings` (singleton fallback) dan `aiUserModelOverrides` (per-user model override mempertahankan provider+key global).

## Route & Entry

- URL: `/dashboard/ai-settings` (resolve ke `SettingsView` dengan tab AI aktif — bookmark legacy)
- Embedded juga sebagai sub-tab "AI" di Settings (`SettingsView` → render `AIConnectCard` + `AISettingsPanel`)
- Slice: `frontend/slices/ai-settings/`
- Komponen utama: `AISettingsPanel.tsx` (lives at `@/shared/components/ai-settings/`)

## Struktur Slice

```
ai-settings/
└─ index.ts          Re-exports `AISettingsPanel` from @/shared/components/ai-settings
```

`index.ts` adalah satu-satunya file di slice — slice ini dengan sengaja tipis. Komponen sebenarnya hidup di `frontend/shared/components/ai-settings/AISettingsPanel.tsx` supaya bisa di-embed di `SettingsView` (tab AI) tanpa cross-slice import (R1).

```ts
// slices/ai-settings/index.ts
export { AISettingsPanel } from "@/shared/components/ai-settings/AISettingsPanel";
```

## Data Flow

Backend domain: `convex/ai/`. Helper: `convex/_shared/aiProviders.ts` (provider spec + model catalog), `convex/_shared/aiCrypto.ts` (enkripsi key at rest), `convex/_shared/pkce.ts` (verifier + S256, dipakai bareng MCP OAuth). Tabel: `aiSettings`, `globalAISettings`, `aiUserModelOverrides`, `aiOAuthFlows`, `aiSkills`, `aiTools`, `chatConversations`, `rateLimitEvents`.

| Operasi | Convex |
|---|---|
| List provider spec | `api.ai.queries.listAIProviders` (public, read-only) |
| Mulai OAuth connect | `api.ai.oauth.startOAuthConnect` → `{ url }` (mutation: mint verifier, park di `aiOAuthFlows`) |
| Selesaikan OAuth connect | `api.ai.oauth.finishOAuthConnect` (action: tukar code, tulis key terenkripsi ke `aiSettings` caller) |
| Fetch user config (masked) | `api.ai.queries.getMyAISettings` |
| Save config | `api.ai.mutations.setMyAISettings` |
| Toggle enabled | `api.ai.mutations.toggleAIEnabled` |
| Clear | `api.ai.mutations.clearMyAISettings` |
| Test connectivity | `api.ai.actions.testConnection` |
| Internal lookup (chat actions) | `internal.ai.queries._getForUser` |
| Admin set global | `api.ai.mutations.setGlobalAISettings` (admin guard) |
| Admin per-user model override | `api.ai.mutations.setUserModelOverride` |
| Admin seed default skills+tools | `api.ai.mutations.seedDefaultsAITools`, `seedDefaultsAISkills` |

Schema (`convex/ai/schema.ts`):

```ts
chatConversations: defineTable({
  userId: v.id("users"),
  sessionId: v.string(),
  title: v.string(),
  messages: v.array(v.object({
    id, role, content, timestamp,
    actions: v.optional(v.array(v.object({ type, payload, status? }))),
  })),
  createdAt, updatedAt,
})
  .index("by_user", ["userId"])
  .index("by_user_session", ["userId", "sessionId"])
  .index("by_user_updated", ["userId", "updatedAt"]),

aiSettings: defineTable({
  userId: v.id("users"),
  provider, model, apiKey, baseUrl?, enabled, updatedAt,
}).index("by_user", ["userId"]),

globalAISettings: defineTable({         // singleton, admin-managed
  provider, model, apiKey, baseUrl?, enabled, updatedBy, updatedAt,
}),

aiUserModelOverrides: defineTable({     // admin-set per-user model
  userId: v.id("users"),
  model, setBy, updatedAt,
}).index("by_user", ["userId"]),

aiOAuthFlows: defineTable({             // PKCE verifier in-flight, 1 baris per (user, provider)
  userId: v.id("users"),                // dihapus begitu exchange sukses; diabaikan lewat FLOW_TTL_MS (10 mnt)
  provider, verifier, createdAt,
}).index("by_user_provider", ["userId", "provider"]),

aiSkills: defineTable({                 // admin catalog of system-prompt templates
  key, label, slashCommand?, description, systemPrompt, enabled, isSeed, updatedBy, updatedAt,
})
  .index("by_key", ["key"])
  .index("by_slash", ["slashCommand"]),

aiTools: defineTable({                  // admin catalog of structured action types
  type, label, description, payloadSchema?, enabled, isSeed, updatedBy, updatedAt,
}).index("by_type", ["type"]),

rateLimitEvents: defineTable({
  userId: v.id("users"),
  key, timestamp,
}).index("by_user_key_time", ["userId", "key", "timestamp"]),
```

Provider spec di `convex/_shared/aiProviders.ts`:

```ts
AI_PROVIDERS = {
  openai:     { baseUrl: "https://api.openai.com/v1", models: [...], auth: { apiKey: { docsUrl } } },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", models: [...],
                auth: { apiKey: { docsUrl }, oauth: { kind: "pkce_key", handoff: "redirect", … } } },
  groq:       { baseUrl: "https://api.groq.com/openai/v1", models: [...], auth: { apiKey: { docsUrl } } },
  // …
}
listProvidersPublic()       // expose tanpa credential; docsUrl DIDERIVASI dari auth.apiKey
providerOAuth(id)           // AIOAuthSpec | null — satu-satunya cara benar menanyakan "provider ini bisa OAuth?"
```

API key di-mask saat `getMyAISettings` return — 4 char prefix + middle `•••` + 4 char suffix. Raw key tidak leak ke client setelah tersimpan.

## Auth capability per provider

`AIProviderSpec.auth` (menggantikan `docsUrl`, yang sekarang diderivasi dari
`auth.apiKey?.docsUrl` supaya tidak bisa drift) mendeklarasikan cara masuk yang
didukung provider. Field-nya **wajib** di TS — provider baru tidak bisa lupa
mengisi.

```ts
AIAuthSpec  = { apiKey?: { docsUrl?: string }; oauth?: AIOAuthSpec }
AIOAuthSpec = {
  kind: "pkce_key" | "pkce_token" | "device_code",  // hasil exchange → kewajiban read path
  handoff: "redirect" | "paste" | "poll",           // ini saja yang memilih widget UI
  label: string,                                    // copy tombol, bahasa Indonesia
  callbackPath?: string,                            // handoff "redirect"
  hint?: string,                                    // handoff "paste" | "poll"
}
```

Dua sumbu, bukan satu, karena tiga flow nyata di `models-rahmanef-com`
(OpenRouter, Claude Pro/Max, ChatGPT/Codex) tidak sejajar 1:1. `kind` = apa yang
dihasilkan exchange: `pkce_key` langsung dipakai `resolveAI`, sedangkan
`pkce_token` / `device_code` adalah bundle access+refresh yang kedaluwarsa dan
butuh refresher lebih dulu. `handoff` = bagaimana grant balik ke kita. Claude
`pkce_token` + `paste` bukan karena token-nya, tapi karena client_id Anthropic
mengunci `redirect_uri` ke domain mereka sendiri — provider `pkce_token` lain
yang redirect-nya kita kontrol tetap `redirect`, dan satu enum gabungan akan
merender widget yang salah untuk kasus itu.

`AIAuthSpec` sengaja tidak menyimpan client_id / endpoint / key apa pun:
`startOAuthConnect` merangkai authorize URL di server, jadi `listAIProviders`
— yang unauthenticated — cuma menyiarkan copy + path lokal. Ada test yang
meng-assert payload ter-serialize tidak mengandung `client_id` / `secret` /
`token`.

Consumer **tidak boleh** membandingkan id provider (`p.id === "openrouter"`);
justru string-compare itulah yang dihapus oleh shape ini:

```ts
const flow = providerOAuth(id);              // atau p.auth?.oauth dari listAIProviders
if (flow?.handoff === "redirect") {          // render tombol <flow.label>
  const { url } = await startOAuthConnect({ provider: id });
  window.location.href = url;
}
```

Konsumer pertamanya `AIConnectCard` (`frontend/slices/settings/components/`),
dirender di tab AI Setelan **di atas** form key manual — id provider tidak
muncul sekali pun di file itu, jadi provider OAuth berikutnya menumbuhkan satu
baris sendiri. Hanya `handoff: "redirect"` yang dirender; `paste` / `poll`
belum punya widget dan tombol yang tidak ke mana-mana lebih buruk daripada
tidak ada tombol. Halaman callback memantulkan user balik ke
`/dashboard/settings?ai=<provider|error>`, dibaca `slices/settings/lib/aiConnectResult.ts`.

`AIConfigPanel` (admin) sengaja tidak punya tombol connect: `finishOAuthConnect`
menulis `aiSettings` **caller**, jadi key bersama di `globalAISettings` tetap
lewat paste manual.

### Menambah provider OAuth = 4 langkah

1. Blok `auth.oauth` di `AI_PROVIDERS[<id>]` (`convex/_shared/aiProviders.ts`) — maksimal 5 field di atas.
2. Satu entry di `OAUTH_ADAPTERS` (`convex/ai/oauth.ts`): `{ authorizeUrl({ challenge, callbackUrl }), exchange({ code, verifier, callbackUrl }) → secret }`. PKCE-nya pakai `_shared/pkce.ts` (`randomToken` + `sha256Base64Url`) — jangan tulis implementasi S256 kedua.
3. Hanya untuk `handoff: "redirect"`: halaman callback di `callbackPath` — copy `frontend/app/oauth/openrouter/callback/`.
4. Tambah id-nya ke daftar yang dipin di `convex/_shared/aiProviders.test.ts`. Pin itu cuma membaca deklarasi — file test tidak mengimpor `OAUTH_ADAPTERS`, jadi yang ketahuan otomatis hanya deklarasi baru (tanpa adapter = tombol yang gagal di langkah terakhir, dan `startOAuthConnect` menolaknya). Arah sebaliknya, adapter tanpa deklarasi, lolos test dan diam saja sebagai flow yang tidak punya UI — langkah 1 tetap tanggung jawabmu.

Selesai — nol edit UI, nol cabang per-provider. Yang **tidak**
gratis: `kind: "pkce_token" | "device_code"` masih butuh refresher token di
`resolveAI` sebelum kredensialnya bisa dipakai proxy. `kind`-lah yang
memberitahu kamu refresher itu perlu.

`openai` sengaja apiKey-only meski flow device-code ChatGPT/Codex nyata di
`models-rahmanef-com`: belum ada apa pun di repo ini yang bisa menukar atau
me-refresh bundle-nya, dan tombol yang 500 lebih buruk daripada tidak ada
tombol. `anthropic` bukan provider di repo ini sama sekali (Claude dijangkau
lewat `openrouter`). Deskriptornya ditambahkan di perubahan yang **sama**
dengan adapternya, jangan lebih dulu.

## Fallback chain saat AI action runtime

`convex/_shared/aiResolve.ts` (`resolveAI`, satu-satunya copy — dipanggil semua AI action) resolve config per-call:

1. `aiSettings[userId].enabled` → user config (`baseUrl`, `apiKey`, `model`)
2. `aiUserModelOverrides[userId]` ada → pakai global provider+key, override model
3. `globalAISettings.enabled` → admin-managed singleton
4. Env: `CONVEX_OPENAI_BASE_URL` + `CONVEX_OPENAI_API_KEY`

Key dari step 1 dan 3 lewat `decryptCred` di situ juga (layer action, bukan
query) — baris `encv1:` didekripsi, baris plaintext lolos apa adanya.

## Default catalog seeding

`convex/_seeds/aiDefaults.ts` exports `DEFAULT_AI_SKILLS` + `DEFAULT_AI_TOOLS`. Admin button "Seed default" upsert ke `aiSkills` + `aiTools` (rows dengan `isSeed: true` saja yang ter-refresh, manual rows aman). Tools catalog **mirror slice manifest skill IDs** — saat slice baru tambah skill manifest, append entry di `aiDefaults.ts` supaya admin UI lihat full surface.

## State Lokal

- `providers` — list dari `listAIProviders`
- `current` — `getMyAISettings` response (apiKey masked)
- Form: `providerId`, `baseUrl`, `model`, `apiKey`, `enabled`
- `showKey` toggle (Eye / EyeOff)
- `testStatus` — idle / loading / success / error setelah `testConnection`

## Dependensi

- shadcn: `alert`, `button`, `card`, `input`, `label`, `select`, `switch`
- `lucide-react`: `Sparkles`, `Eye`, `EyeOff`, `ExternalLink`, `Wand2`, `Trash2`
- `sonner` — toast
- Convex: `api.ai.queries.*`, `api.ai.mutations.*`, `api.ai.actions.testConnection`
- Cross-domain: dipakai oleh semua AI actions di `convex/ai/actions.ts` + `convex/cv/actions.ts` + `convex/matcher/actions.ts` + dst.

## Catatan Desain

- **Mengapa per-user provider?** Cost isolation — power user pakai credit sendiri (OpenRouter / Groq / Azure), free user pakai quota terbatas dari env default backend.
- **Key security** — `apiKey` ditulis AES-256-GCM (`_shared/aiCrypto.ts`, prefix `encv1:`) kalau env Convex `AI_CRED_SECRET` ada; tanpa env itu tetap plaintext seperti sebelumnya, dan read path menerima dua-duanya sehingga baris lama tidak dimigrasi. Never echo-back ke client (masked). Ops (set, rotasi, kenapa OAuth connect menolak tanpa env): [deployment.md](../deployment.md) §10.
- **OAuth connect menolak tanpa `AI_CRED_SECRET`** — key hasil OAuth tidak pernah dilihat user, jadi user tidak bisa merotasi sesuatu yang bocor tanpa dia tahu key itu ada. Paste-key manual tetap boleh plaintext karena user memegang salinannya sendiri.
- **Connect hanya menulis `aiSettings` caller** — `globalAISettings` tidak tersentuh OAuth; admin yang mau key bersama tetap paste manual di Admin Panel.
- **Model list** — `AI_PROVIDERS` tetap otoritatif untuk baseUrl + default; daftar model-nya di-union dengan katalog models.dev yang di-cache singleton `modelCatalog` (`convex/ai/catalog.ts`).
- **Rate limit tetap enforce** — user dengan API key sendiri tetap kena `AI_RATE_LIMITS["ai:minute"/"ai:day"]` di `rateLimitEvents` supaya infra backend tidak overload.
- **`globalAISettings` singleton** — admin-managed; default kalau user tidak punya `aiSettings`.
- **`aiUserModelOverrides`** — admin set premium model per-user tanpa mereka perlu paste key sendiri (inherit provider+key dari global).
- **Manifest tidak ada** — slice bukan AI bus subscriber; pengaturan AI sendiri tidak di-manage AI.

## Extending

- Provider-specific feature flag (function calling, vision, JSON mode) → tambah field di `AIProviderSpec`.
- Key rotation reminder — notifikasi tiap 90 hari (cron + `notifications` slice).
- Usage analytics per user — aggregate `rateLimitEvents` + token count (butuh `tokens` field di event).
- Bring-your-own-endpoint custom kustomisasi (Cloudflare Workers AI, local Ollama URL).

---

## Portabilitas

**Tier:** L

**Files untuk dicopy:**

```
# Slice (1 file — pure re-export)
frontend/slices/ai-settings/

# Real component (lives in shared)
frontend/shared/components/ai-settings/AISettingsPanel.tsx

# OAuth connect — cuma kalau ikut port provider ber-`handoff: "redirect"`
frontend/app/oauth/openrouter/callback/                                 # halaman callback
frontend/slices/settings/components/AIConnectCard.tsx                   # kartu "Sambungkan Akun" (hidup di slice settings, bukan ai-settings)
frontend/slices/settings/lib/aiConnectResult.ts                         # parser `?ai=<provider|error>`

# Backend
convex/ai/                                                              # full domain (queries + mutations + actions + oauth + catalog + skillHandlers + schema)
convex/_shared/aiProviders.ts                                           # AI_PROVIDERS catalog + auth capability + listProvidersPublic
convex/_shared/aiCrypto.ts                                              # AES-256-GCM key at rest (butuh env AI_CRED_SECRET)
convex/_shared/pkce.ts                                                  # verifier + S256 (dipakai bareng MCP OAuth)
convex/_shared/rateLimit.ts                                             # token bucket gate
convex/_shared/sanitize.ts                                              # prompt sanitization
convex/_shared/auth.ts                                                  # requireUser, optionalUser, requireOwnedDoc
convex/_seeds/aiDefaults.ts                                             # DEFAULT_AI_SKILLS + DEFAULT_AI_TOOLS catalog
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

# Slice (re-export only)
mkdir -p "$DST/frontend/slices"
cp -r "$SRC/frontend/slices/ai-settings" "$DST/frontend/slices/"

# Real component
mkdir -p "$DST/frontend/shared/components/ai-settings"
cp "$SRC/frontend/shared/components/ai-settings/AISettingsPanel.tsx" "$DST/frontend/shared/components/ai-settings/"

# Backend
cp -r "$SRC/convex/ai" "$DST/convex/"

mkdir -p "$DST/convex/_shared"
cp "$SRC/convex/_shared/aiProviders.ts" "$DST/convex/_shared/"
cp "$SRC/convex/_shared/aiCrypto.ts"    "$DST/convex/_shared/"
cp "$SRC/convex/_shared/pkce.ts"        "$DST/convex/_shared/"
cp "$SRC/convex/_shared/rateLimit.ts"   "$DST/convex/_shared/"
cp "$SRC/convex/_shared/sanitize.ts"    "$DST/convex/_shared/"
cp "$SRC/convex/_shared/auth.ts"        "$DST/convex/_shared/"           # if not already ported

mkdir -p "$DST/convex/_seeds"
cp "$SRC/convex/_seeds/aiDefaults.ts" "$DST/convex/_seeds/"
```

**Schema additions** — copy semua tabel dari `convex/ai/schema.ts`:

```ts
import { aiTables } from "./ai/schema";

// inside defineSchema({...}):
...aiTables,    // chatConversations + aiSettings + globalAISettings + aiUserModelOverrides + aiSkills + aiTools + rateLimitEvents
```

Atau copy literal definitions (lihat snippet di "Data Flow" atas).

Indexes wajib lengkap:
- `aiSettings.by_user`
- `aiUserModelOverrides.by_user`
- `aiOAuthFlows.by_user_provider`
- `aiSkills.by_key`, `aiSkills.by_slash`
- `aiTools.by_type`
- `chatConversations.by_user`, `by_user_session`, `by_user_updated`
- `rateLimitEvents.by_user_key_time`

**Convex api.d.ts**:

```ts
import type * as ai_actions       from "../ai/actions.js";
import type * as ai_catalog       from "../ai/catalog.js";
import type * as ai_mutations     from "../ai/mutations.js";
import type * as ai_oauth         from "../ai/oauth.js";
import type * as ai_queries       from "../ai/queries.js";
import type * as ai_skillHandlers from "../ai/skillHandlers.js";

declare const fullApi: ApiFromModules<{
  // ...
  "ai/actions":       typeof ai_actions;
  "ai/catalog":       typeof ai_catalog;
  "ai/mutations":     typeof ai_mutations;
  "ai/oauth":         typeof ai_oauth;
  "ai/queries":       typeof ai_queries;
  "ai/skillHandlers": typeof ai_skillHandlers;
}>;
```

**npm deps** — none specific (panel pure shadcn).

**Env vars** — wajib (fallback chain butuh ini kalau tidak ada user/global config):
- `CONVEX_OPENAI_BASE_URL` — OpenAI-compatible endpoint
- `CONVEX_OPENAI_API_KEY` — provider key

Opsional, dan cuma relevan kalau ikut port OAuth connect:
- `AI_CRED_SECRET` — tanpa ini key disimpan plaintext (semua tetap jalan) tapi `startOAuthConnect` menolak
- `APP_URL` — origin publik app; dipakai merangkai callback URL (`requireEnv`, jadi absennya = mutation throw)

**Manifest + binder wiring** — N/A (slice tipis, tidak punya manifest).

**Nav registration** — `dashboardRoutes.tsx` resolve `"ai-settings"` ke `SETTINGS` view (alias):

```ts
// dashboardRoutes.tsx
"ai-settings": SETTINGS,    // legacy bookmark; SettingsView punya tab AI built-in
```

Tidak ada entri terpisah di `navConfig.ts` — surfaced via tab di Settings.

**i18n** — Indonesian:
- Field labels: "Provider", "Model", "URL Dasar", "Kunci API"
- Button: "Simpan", "Uji Koneksi", "Hapus"
- Status: "Aktif" / "Nonaktif", "Berhasil" / "Gagal"
- Provider list display labels (kunci tetap English: `openai`, `openrouter`, `groq`)

**Consumer integration** — semua AI action lain (cv / matcher / interview / roadmap) **wajib** baca config via `internal.ai.queries._getForUser`. Jika port slice AI tunggal tanpa `convex/ai/`, action tersebut crash. Selalu port `ai-settings` bersama `ai-agent` slice atau slice lain yang ada AI feature.

**Common breakage after port:**

- **`testConnection` 401** — env var `CONVEX_OPENAI_*` salah atau user paste invalid key. Cek detail toast: backend echo error provider.
- **Rate limit immediate trigger** — `rateLimitEvents.by_user_key_time` index miss → query scan full table → reject. Pastikan index ada di schema.
- **Admin "Seed default" no-op** — auth guard di `seedDefaultsAITools` butuh `userProfiles[caller].role === "admin"`. Bootstrap admin via env `ADMIN_BOOTSTRAP_EMAILS`.
- **`getMyAISettings` apiKey leak** — masking bug kalau target ubah field shape. Pastikan `maskKey` di queries.ts dipakai sebelum return.
- **Cross-slice AI action 500** — slice AI lain (matcher.scanCV, cv.tailorCVForJob) panggil `internal.ai.queries._getForUser`. Tanpa `convex/ai/` ported, internal API undefined.
- **Skills+tools catalog kosong di admin UI** — `aiDefaults.ts` belum ported atau "Seed default" belum diklik.
- **"Login provider belum aktif"** — `AI_CRED_SECRET` belum diset di deployment Convex target. Bukan bug adapter.
- **Connect balik ke origin yang salah / mutation throw `APP_URL`** — `APP_URL` di deployment target masih menunjuk origin repo asal.
- **Tombol OAuth tidak muncul padahal adapter ada** — blok `auth.oauth` di `AI_PROVIDERS` belum ditambahkan; UI membaca kapabilitas, bukan id.
- **AI action error "Kredensial AI tidak bisa didekripsi"** — baris `encv1:` di-restore/di-copy ke deployment yang `AI_CRED_SECRET`-nya beda. Simpan ulang key-nya; tidak ada script re-encrypt.

**Testing the port:**

1. Navigate `/dashboard/ai-settings` → redirect ke `/dashboard/settings` tab AI (atau langsung render kalau alias)
2. Pilih provider OpenRouter → field baseUrl auto-prefilled
3. Paste API key + pilih model → "Simpan" → toast sukses
4. Klik "Uji Koneksi" → status "Berhasil" + sample response
5. Reload → key tampil masked (4 char prefix + ••• + 4 char suffix)
6. Toggle enabled off → next AI action fallback ke env default
7. Klik "Hapus" → row di-delete, fallback ke global/env
8. **Admin flow** (login as admin):
   - Buka admin panel → AI Settings
   - "Seed default" → `aiSkills` + `aiTools` ter-populate
   - Set globalAISettings → user tanpa config sendiri pakai ini
   - Set per-user model override → user tertentu pakai model premium

Run `_porting-guide.md` §9 checklist.
