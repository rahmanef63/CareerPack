# CareerPack — Audit Bug & Saran Improvement (Code-Level)

> **Tanggal:** 2026-06-11
> **Cakupan:** Audit kode mendalam lintas backend (Convex), frontend (Next.js/React), UI/UX & aksesibilitas, security, dan kualitas kode/DX.
> **Metode:** 5 agent paralel membaca kode aktual + verifikasi manual atas temuan ber-severity tertinggi. Setiap temuan menyertakan `file:line`, severity, tingkat keyakinan, dan fix konkret.
> **Pelengkap, bukan pengganti** [`2026-06-11-full-project-audit.md`](./2026-06-11-full-project-audit.md) (yang fokus pada progress/proses/3-perspektif). Dokumen ini fokus **bug nyata + improvement teknis**.

## Legenda

| Simbol | Arti |
|---|---|
| 🔴 | Kritis — bug nyata / kerentanan / kehilangan data. Harus diperbaiki sebelum/segera setelah rilis. |
| 🟡 | Moderat — bug yang mengganggu fungsi/UX atau memperlambat maintenance. |
| 🟢 | Minor — polish, konsistensi, nice-to-have. |
| ✅ **VERIFIED** | Saya buka & konfirmasi langsung di kode. |
| ◽ *agent* | Dilaporkan agent dari pembacaan kode; keyakinan tinggi tapi belum saya buka ulang satu per satu. |

**Catatan disiplin:** sesi sebelumnya nyaris "memperbaiki" kode yang sebenarnya benar (false positive delimiter `\x01`). Round ini setiap klaim 🔴 saya trace ulang ke kode sebelum dimasukkan. Beberapa klaim agent yang ternyata **bukan bug** sengaja saya buang (lihat §8).

---

## 0. Ringkasan Eksekutif

Kondisi kode **secara struktural sehat**: disiplin auth-guard kuat (hampir semua mutation pakai `requireUser`/`requireOwnedDoc`, list query pakai `optionalUser`), **nol `any` di convex**, **nol cross-slice import**, **nol `console.log` di logika bisnis**, CSP & header keamanan solid, dan sweep IDOR lintas 20+ domain sebagian besar bersih pasca-`7dba33b`.

Tapi ada **3 temuan kritis** yang nyata dan layak diprioritaskan:

| # | Temuan | Dampak | Status |
|---|---|---|---|
| **C1** | `resolveAI()` divergen di 4 file — CV/matcher/planner **mengabaikan** admin global key + per-user model override | Admin set 1 global key → chat jalan, tapi CV translate/matcher/planner **gagal** "belum dikonfigurasi" | ✅ VERIFIED |
| **C2** | Stored XSS — bypass sanitizer HTML lewat handler `on*` yang dipisah `/` di halaman publik `/<slug>` | Visitor anonim kena XSS saat hover | ✅ VERIFIED |
| **C3** | `cascadeDeleteUser` tidak menghapus 4 tabel ber-`userId` + blob `_storage` yatim saat hapus akun | Gap erasure (GDPR), data klaim/outcome tertinggal | ◽ *agent, keyakinan tinggi* |

Selebihnya: ~30 temuan moderat (data-integrity backend, error-handling frontend yang menelan kegagalan diam-diam, dan UX/a11y) + quick-win polish. Roadmap perbaikan ada di §7.

---

## 1. 🔴 Temuan Kritis (lintas-dimensi)

### C1 — `resolveAI()` divergen: CV/matcher/planner mengabaikan admin global key + per-user override ✅ VERIFIED

**File kanonik (benar):** `convex/ai/actions.ts:26-63`
**Copy divergen (salah):** `convex/cv/actions.ts:33-57`, `convex/matcher/actions.ts:47-67`, `convex/engine/plan/actions.ts:19-41`, `convex/matcher/external.ts:518` (`resolveAIConfig`)

Resolver kanonik melakukan **user → admin global → per-user model override → env default**. Empat copy hanya melakukan **user → env default**, lalu `throw` kalau env kosong:

```ts
// cv/actions.ts:33 — TIDAK pernah cek _getGlobalAISettings / _getUserModelOverride
const userId = await getAuthUserId(ctx);
if (userId) { const cfg = …_getAISettingsForUser…; if (cfg) return {…}; }
const baseUrl = optionalEnv("CONVEX_OPENAI_BASE_URL");   // langsung ke env
if (!baseUrl || !apiKey) throw new ConvexError("…belum dikonfigurasi…");
```

**Dampak (bukan sekadar DRY — bug perilaku):** Skenario paling umum untuk operator — admin meng-set **satu** global OpenRouter key di Admin Panel, user tidak set key sendiri — membuat **AI chat jalan** tapi **CV translate, CV tailoring, matcher JD-extraction, dan planner compile semua gagal** dengan pesan "belum dikonfigurasi". Per-user model override ("rute user premium ke model lebih kuat") juga tak berlaku di jalur-jalur itu.

**Fix:** Ekstrak satu `resolveAI(ctx, fallbackModel)` ke `convex/_shared/aiProviders.ts`, honor urutan resolusi penuh, lalu re-use di kelima titik. Rekonsiliasi bentuk return (field `source` dan Error-vs-ConvexError) ke bentuk terkaya. **Ini sekaligus menyelesaikan duplikasi D1/D2 di bawah.**

---

### C2 — Stored XSS: bypass sanitizer HTML via handler `on*` berpemisah `/` ✅ VERIFIED

**Sanitizer:** `convex/profile/blocks/helpers.ts:73` (`sanitizeHtml`) → **dirender ke publik** di `frontend/slices/personal-branding/themes/BlockRenderer.tsx:312` (`dangerouslySetInnerHTML`) dan `…/templateHydrator/manualBlocks.ts:226` (iframe `innerHTML`).

Blok tipe `html` ditulis user di builder Personal Branding, disanitasi server-side saat write, lalu dirender di halaman **publik** `/<slug>` ke visitor anonim. Stripper handler menuntut whitespace sebelum `on`:

```ts
// helpers.ts:73
s = s.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
```

Atribut yang dipisah `/` tetap HTML valid tapi **tidak** didahului whitespace, jadi lolos step 2. Step 4 (`helpers.ts:93`) mengembalikan tag **verbatim** kalau nama tag ada di allowlist (`a` ada):

```html
<a href="https://x"/onmouseover="alert(document.cookie)">hover</a>
```

Payload ini lolos kelima step. CSP (`script-src 'self' 'unsafe-inline'`) **tidak** memblok inline event handler, jadi payload jalan saat visitor hover.

**Catatan dampak:** Surface `BlockRenderer` (`dangerouslySetInnerHTML`) berjalan di origin utama → pencurian cookie/sesi mungkin. Surface iframe (`manualBlocks.ts`) di-`sandbox` `allow-scripts` tanpa `allow-same-origin` → di sana dampak turun ke phishing/redirect, bukan ATO penuh.

**Fix (harden, bukan swap — tetap regex sanitizer dalam stack):**
1. Perketat stripper agar juga menangkap handler yang didahului `/` atau pemisah atribut lain: `/[\s/]on[a-z]+\s*=/i`.
2. Lebih kokoh: ganti pendekatan **blocklist `on*`** dengan **allowlist atribut** (`href`, `target`, `rel` saja) — drop semua atribut lain pada tag yang dipertahankan.
3. Tambah test `convex/profile/blocks/helpers.test.ts` (belum ada) yang menutup bypass: pemisah `/`, `>` di dalam atribut, double-encoding.

---

### C3 — `cascadeDeleteUser` membiarkan 4 tabel ber-`userId` + blob `_storage` yatim ◽ *agent, keyakinan tinggi*

**File:** `convex/admin/lib/cascadeDelete.ts:13-31`

Loop `owned` menghapus 17 tabel tapi melewatkan beberapa yang membawa `userId`:
- `truthAtoms` (`engine/schema.ts`) — index `by_user_cv` (tak ada `by_user` polos), baris bisa pegang `proofStorageId` → blob `_storage` yang juga tak terhapus.
- `outcomeEvents` (`engine/outcomes/schema.ts`) — riwayat outcome job-search personal.
- `careerQuests` (`engine/plan/schema.ts`) — rencana karir terkompilasi.
- `aiUserModelOverrides` (`ai/schema.ts`).

Setelah `deleteUser`/`bulkDeleteUsers`, baris `users` hilang tapi tabel-tabel ini bertahan dengan `userId` menggantung — **gap erasure** (retensi permanen teks klaim, riwayat outcome, blob proof yatim).

**Fix:** Tambah `outcomeEvents`, `careerQuests`, `aiUserModelOverrides` ke loop `owned`. Untuk `truthAtoms`, loop khusus pakai `.withIndex("by_user_cv", q => q.eq("userId", userId))` dan `ctx.storage.delete(atom.proofStorageId)` (try/catch) sebelum hapus baris — mirror loop `files` yang sudah ada.

---

## 2. Backend — Korektnes & Data Integrity

> Disiplin guard kuat secara umum. Temuan di bawah adalah celah validasi/integritas, bukan IDOR masif.

### 🟡 B1 — Portfolio create/update & CV avatar pin `storageId` tanpa cek owner (storage IDOR) ◽ *agent*
`convex/portfolio/mutations.ts` (`createPortfolioItem`/`updatePortfolioItem`: `coverStorageId`, `media[].storageId`); kemungkinan sama untuk `avatarStorageId` di `convex/cv/mutations.ts` (`updateCV`).
StorageId disimpan tanpa verifikasi ada baris `files` dengan `tenantId === userId.toString()`. Read path lalu `ctx.storage.getUrl(storageId)` untuk apa pun yang tersimpan → user yang tahu storageId tenant lain bisa pin & dapat signed URL blob orang lain. Severity moderat karena storageId di-mint server & tak ditebak.
**Fix:** Resolve tiap `storageId` via `files` index `by_storage`, tolak (`"Berkas tidak ditemukan"`) kalau hilang / `tenantId` beda. Pasang guard yang sama untuk avatar CV.

### 🟡 B2 — `saveFile` dedup mengembalikan baris milik tenant lain ◽ *agent*
`convex/files/mutations.ts:67-71` — short-circuit dedup hanya match `storageId`, `return existing._id` tanpa cek `existing.tenantId === userId.toString()`. Kalau dua user pernah berbagi storageId, user B dapat id baris user A.
**Fix:** Short-circuit hanya bila `existing.tenantId === userId.toString()`; selain itu insert baris baru ber-tenant.

### 🟡 B3 — Agregat dihitung di atas `.take()` yang ter-truncate diam-diam ◽ *agent*
`convex/engine/outcomes/queries.ts:53-58` (`.take(5_000)`), `convex/engine/dp/queries.ts:45-50`, `convex/engine/outcomes/calibrator.ts:32-43` (`.take(10_000)` di `by_from_to`, filter window 180-hari **setelah** take).
Saat tabel tumbuh, `runCalibrator` memotong event terbaru sebagian edge sebelum filter window jalan → posterior dipublikasikan dari cohort basi/parsial. `cohortStatsDP` menghitung klaim privasi + floor k-anonymity di atas count ter-truncate.
**Fix:** Index ter-urut waktu (mis. `by_target_time` pada `occurredAt`) + range-scan `gte("occurredAt", cutoff)`, atau counter inkremental. Minimal expose flag `truncated`.

### 🟡 B4 — `createQuest` menyimpan `etaMonths` NaN/tak terbatas + lewati cap validator ◽ *agent*
`convex/engine/plan/mutations.ts:33-56` — `etaMonths: v.number()` menerima `NaN`/`Infinity`/negatif. Validator (`plan/lib.ts:66-69`) hanya jalan di action `compile`, bukan di mutation `createQuest` yang directly-callable. Cap `actions.length`, length-cap field, dan reject duplicate `actions[].id` juga di-bypass (sehingga `toggleAction` bisa flip dua action sekaligus).
**Fix:** Mirror batas validator di mutation: clamp `etaMonths` finite 1..60, cap array, length-cap, reject id duplikat.

### 🟡 B5 — `contacts` create/update tanpa cap panjang / guard NaN-empty ◽ *agent*
`convex/contacts/mutations.ts:25-75` — `createContact` hanya `.trim()` `name` (tanpa cek non-empty/length); `company/position/email/phone/linkedinUrl/notes/avatarEmoji/avatarHue` disimpan verbatim; `updateContact` blind-copy. `notes` free-text tak terbatas, lalu `listContacts` `.collect()` semua. Satu-satunya domain yang mengabaikan konvensi `trimLen`/`MAX_*`.
**Fix:** Helper `trimLen`-style + cap tiap field (name 1–200, company/position ≤200, email ≤320, notes ≤2000, emoji/hue ≤16); reject `name` kosong.

### 🟡 B6 — Recompute progress roadmap bisa menyimpan `NaN` ◽ *agent*
`convex/roadmap/mutations.ts:199` (`updateSkillProgress`), `:139` — `Math.round((completedSkills / updatedSkills.length) * 100)` tanpa guard array kosong (skema mengizinkan `skills[]` kosong). Beda dari `goals/mutations.ts:93` yang sudah guard `total === 0 ? 0 : …`.
**Fix:** `updatedSkills.length === 0 ? 0 : …` di kedua titik; defensif juga di `documents/mutations.ts:140,223`.

### 🟢 B7 — Calendar `createEvent`/`updateEvent` terima string tak tervalidasi/uncapped ◽ *agent*
`convex/calendar/mutations.ts:5-69` — `title/date/time/location/type/notes` disimpan mentah tanpa cap & tanpa validasi format `date`/`time`. Cron reminder (`parseEventStart`) aman me-`null` kalau malformed, tapi `notes`/`title` tak terbatas tetap muncul di notifikasi.
**Fix:** `trimLen` cap + validasi `date` `^\d{4}-\d{2}-\d{2}$`, `time` `^\d{2}:\d{2}$`.

### 🟢 B8 — `compile` tak refund quota saat respons 200-tapi-sampah ◽ *agent*
`convex/engine/plan/actions.ts:127-144` — quota direfund hanya saat `!response.ok`. Saat gateway balas 200 dengan JSON invalid/plan tak ter-validasi, user tetap kena charge token padahal `_refundAIQuota` sudah di-import.
**Fix:** Panggil `_refundAIQuota` sebelum dua branch `throw` invalid-JSON/unvalidatable.

### 🟢 B9 — `toggleResource` match resource roadmap by `title` non-unik + no-op senyap ◽ *agent*
`convex/roadmap/mutations.ts:208-239` — resource di-key by `title` (skema tak punya `id`); dua resource sejudul ikut toggle. Tak ada guard `touched`, jadi `skillId`/`resourceTitle` salah sukses diam-diam.
**Fix:** Tambah `id` ke skema resource & key padanya; guard `touched` → throw `"Skill tidak ditemukan"`.

---

## 3. Security & Hardening

> Sweep IDOR & file-upload sebagian besar **bersih** (lihat §9). Celah utama: sanitizer HTML (C2 di atas), satu fallback crypto lemah, dan throttle login yang bisa di-bypass.

### 🟡 S1 — Token reset password fallback ke konstanta HMAC publik yang ter-commit ✅ VERIFIED
`convex/passwordReset.ts:94-97`
```ts
const HMAC_SECRET_FALLBACK = "careerpack-default-reset-hmac-key-do-not-rely-on-this";
function hmacKey() { return process.env.PASSWORD_RESET_HMAC_SECRET ?? HMAC_SECRET_FALLBACK; }
```
Kalau `PASSWORD_RESET_HMAC_SECRET` tak di-set di prod, kunci HMAC = string publik yang ter-commit → properti "tak bisa rainbow-table token hash" hilang. (Eksploitasi penuh butuh kemampuan tulis ke tabel `passwordResetTokens`, yang tak terbuka publik — jadi ini menghilangkan defense-in-depth, bukan ATO langsung.)
**Fix:** `hmacKey()` **throw di production** kalau env absen (fail closed); set `PASSWORD_RESET_HMAC_SECRET` di env backend Dokploy. Helper `requireEnv` sudah ada.

### 🟡 S2 — Throttle brute-force login bergantung frontend & bisa di-bypass + dead `LOGIN_RATE_LIMIT` ◽ *agent*
`convex/authCheckEmail.ts:91-136`; aturan mati `convex/_shared/rateLimit.ts:15-19`. Path verify-password `signIn()` (disegel `@convex-dev/auth`, jalan via WebSocket) **tak punya rate limit server-side**; throttle bergantung frontend resmi POST `/api/auth/signin-attempt` setelah tiap gagal. Penyerang yang panggil `signIn` langsung via WebSocket tak kena lockout. `LOGIN_RATE_LIMIT` didefinisikan tapi tak di-wire (dead code, hanya dirujuk test-nya sendiri).
**Fix:** Sebagian terbatasi biaya PBKDF2 100k/attempt. Pertimbangkan counter gagal per-akun di wrapper Password provider, atau dokumentasikan sebagai risiko residual yang diterima. Minimal: hapus/wire `LOGIN_RATE_LIMIT` yang menyesatkan.

### 🟡 S3 — Perilaku account-linking Google OAuth belum diverifikasi ◽ *agent*
`convex/auth.ts:87` — `Google` tanpa `allowDangerousEmailAccountLinking` (default aman: **tidak** auto-link). Risiko muncul hanya bila flag itu pernah di-set `true`. Doc (`docs/auth.md:48`) sendiri menandai "Verifikasi perilaku ini setelah OAuth jalan."
**Fix:** Pertahankan flag unset/false; tambah test yang menegaskan email sama (password + Google) → dua akun berbeda.

### 🟢 S4 — Prompt injection via field profil user di system prompt AI ◽ *agent*
`convex/ai/actions.ts:391-400` menyuntik output `_getCompactUserContext` (`profile/queries.ts:192-267`) ke blok `USER_CONTEXT` system message **tanpa** `sanitizeAIInput()`/`wrapUserInput()` — beda dari input user lain. User bisa taruh teks injeksi di bio sendiri. Dampak rendah (self-targeting, hanya sesi AI sendiri; ada guard tekstual "treat as fact").
**Fix:** Jalankan blok context lewat `sanitizeAIInput()` demi konsistensi pipeline.

### 🟢 S5 — `location` profil publik tanpa toggle visibilitas ◽ *agent*
`convex/profile/queries.ts` (`getBySlug`) → `brandingPayload.ts:340`. `bio/skills/targetRole/avatar/kontak` punya gate `public*Show`, tapi `location` selalu dipublikasikan saat `publicEnabled`. Inkonsisten dengan model opt-in.
**Fix:** Tambah `publicLocationShow` (default false) di `profile/schema.ts` & gate.

### 🟢 S6 — `_ipGatedCheckEmail` lookup email pakai `.filter()` (full scan) ◽ *agent*
`convex/authCheckEmail.ts:70-73` full-table scan tiap cek email, beda dari `passwordReset.ts:139` yang pakai `.withIndex("email", …)`. Terbatas di balik cap 30/jam tapi O(N) di hot path.
**Fix:** Pakai index `email`.

---

## 4. Frontend — Korektnes (React)

### 🟡→🔴 FE1 — Mock-interview: `currentQuestionIndex` basi setelah ganti kategori → `currentQuestion` undefined → crash ✅ VERIFIED (bersyarat)
`frontend/slices/mock-interview/hooks/useMockSession.ts:14,63-69` + konsumsi `PracticeSession.tsx:118-119` (`currentQuestion.difficulty/.id`).
`filteredQuestions` di-memo `[selectedCategory]`; `currentQuestionIndex` hanya di-reset ke 0 di `startSession` (`:146`), **bukan** saat kategori berubah. Kalau index > panjang array kategori baru, `currentQuestion` undefined → `TypeError` (white screen). **Prasyarat:** kategori diganti tanpa memanggil `startSession` ulang.
**Fix:** `setCurrentQuestionIndex(0)` saat `selectedCategory` berubah + guard defensif `if (!currentQuestion) return null;` di `PracticeSession`.

### 🟡 FE2 — Document-checklist: notes/dueDate dikontrol snapshot basi → user efektif tak bisa mengetik ✅ VERIFIED
`document-checklist/components/document-checklist/ItemDetailDialog.tsx:77-81,68-72`; sumber snapshot `DocumentChecklist.tsx:19,60,92` (`selectedItem` di-set sekali, tak pernah re-sync dari `items` reaktif).
`<Textarea value={selectedItem.notes || ""} onChange={…onUpdate(id, {notes})}>` memicu mutation `updateDocumentStatus` **tiap keystroke**, tapi `selectedItem` snapshot sekali → nilai yang ditampilkan beku di snapshot sementara tiap ketukan mengirim full-value write. User melihat field "tak menerima input" + storm mutation per-keystroke. Sama untuk date-picker.
**Fix:** Simpan `notes`/`dueDate` di state lokal yang di-seed dari `selectedItem` saat open; flush ke `onUpdate` on-blur / debounced.

### 🟡 FE3 — Networking: mutation kontak tanpa error handling → unhandled rejection senyap ◽ *agent*
`frontend/slices/networking/hooks/useNetworking.ts:58-71` mengembalikan mutation mentah (tak ada `withMutationToast`, beda dari `useApplications.ts:96-104`). Di `NetworkingView.tsx:133-142,213-222` handler `await toggleFavorite/bumpInteraction/remove` **tanpa try/catch** → gagal = tanpa toast + unhandled rejection. `onDelete` juga skip `notify.success` diam-diam.
**Fix:** Bungkus mutation dengan `withMutationToast` di hook (samakan dengan `useApplications`), atau try/catch + `notify.fromError` di call site.

### 🟡 FE4 — AI-agent console: `thinking` boolean global (bukan per-sesi) + tanpa `finally` (spinner nyangkut) + bocor error mentah ◽ *agent*
`frontend/slices/ai-agent/components/AIAgentConsole.tsx:60,139,169,225-264`.
- **Global `thinking`:** saat `chatAction` in-flight lalu pindah sesi, spinner muncul di sesi salah & composer terkunci lintas percakapan.
- **Tanpa `finally`:** `setThinking(false)` hanya di `:264`; apa pun yang throw di luar inner try (`extractSlashActions` `:171`, `ALL_SKILLS.map` `:178`, projeksi `setSessions` `:253`) membuat `thinking` nyangkut `true` → Composer disabled permanen tanpa toast.
- **Bocor error:** catch menginterpolasi `err.message` mentah ke bubble (`⚠️ AI gateway error: …`) & tak panggil `notify.fromError`, lalu di-persist via upsert debounce.
**Fix:** Lacak `thinkingSessionId` (gate spinner/disable padanya); pindah `setThinking(false)` ke `finally`; `notify.fromError` + string humanized di bubble.

### 🟡 FE5 — Admin `OpenRouterModelPicker`: `load()` async tanpa guard unmount/race ◽ *agent*
`frontend/slices/admin-panel/components/OpenRouterModelPicker.tsx:54-70` — `await fetchModels` lalu `setModels`/`setLoading`/`setError` tanpa `ignore`/Abort. Panel lazy-mount di `<Tabs>`; unmount mid-flight = setState di komponen ter-unmount; tombol "Refresh" bisa race (respons lama menimpa baru). Dua mount site.
**Fix:** Flag `ignore` di cleanup effect; gate `setModels` padanya.

### 🟡 FE6 — Lain-lain (moderat, *agent*)
- **SalaryInsightsCard** `matcher/components/SalaryInsightsCard.tsx:32,59-61` — pembagian by `globalMax` bisa `NaN`/`Infinity` width bila semua bucket `p50===0`. Fix: `denom = globalMax > 0 ? globalMax : 1`.
- **AIConfigPanel** `admin-panel/components/AIConfigPanel.tsx:391` — `disabled={saving || (!dirty && !current)}` → tombol "Simpan" tetap enabled saat tak dirty, re-submit `apiKey:""`. Fix: `disabled={saving || !dirty}`.
- **PortfolioForm** `portfolio/components/PortfolioForm.tsx:58` — `useEffect(if open) setValues(baseValues)` dengan `baseValues` re-memo saat `initialItem` (reaktif) berubah → clobber edit yang belum disimpan. Fix: seed hanya pada transisi `false→true` / key by `_id`.
- **DocumentChecklist** `:20,53,85` — satu `filterCategory` dipakai dua tab (lokal & internasional) → filter sub-kategori lokal lalu pindah Internasional = list kosong. Fix: reset di `Tabs.onValueChange` / state per-tab.

### 🟢 FE7 — Minor (*agent*)
- **ID non-unik `Date.now()`** di `cv-generator/hooks/useCVHandlers.ts:138,152,166,180,194` & `AIAgentConsole.tsx:142,246` — dua klik cepat sub-ms = key duplikat → edit/remove dua baris. Fix: `crypto.randomUUID()`.
- **Key array-index pada list reorderable** `portfolio/.../MediaEditor.tsx:75`, `LinksEditor.tsx:47` — fokus/input lompat saat reorder. Fix: `uid` stabil.
- **Mock-interview `isRecording`** no-op yang menampilkan indikator "Sedang merekam…" palsu (tak ada `MediaRecorder`). Fix: wire recorder asli / relabel placeholder.
- **`favorites` di-init dari `localStorage` di `useState` initializer** (`useMockSession.ts:20-30`) → risiko hydration mismatch. Fix: init kosong, load di `useEffect`.
- **CareerTimeMachine** `skill-roadmap/.../CareerTimeMachine.tsx:85-98` effect dep `r` (objek fresh tiap render) → effect jalan tiap render (hanya `appliedRef` mencegah misbehave). Fix: dep nilai stabil spesifik.
- **useSessionSync** debounced upsert tak di-flush on unmount (`ai-agent/hooks/useSessionSync.ts:155-186`) → turn terakhir bisa hilang bila console ditutup <400ms.
- **RoadmapBrowser** `:297` ternari pluralisasi mati (`roadmap{x===1?"":""}`).

---

## 5. UI/UX & Aksesibilitas

> Error-handling mutation umumnya solid (calendar/CV/most flows pakai `try/catch` + `notify.fromError`). LoginPage dalam kondisi baik (label, aria, autoComplete, loading states). Temuan di bawah terkonsentrasi di loading-state, a11y form, dan touch.

### 🔴 UX1 — `bg-muted/50/50` (utility ganda-opacity invalid) di 4 file ✅ VERIFIED
`CertificationsSection.tsx:33`, `EducationSection.tsx:33`, `ProjectsSection.tsx:34`, `ChecklistItemCard.tsx:28`. Tailwind tak bisa parse `/50/50` → class di-drop → surface "redup" render full `bg-muted`/tanpa bg, inkonsisten dengan sibling. **Fix global trivial:** `bg-muted/50/50` → `bg-muted/50`.

### 🔴 UX2 — Aksi destruktif tanpa konfirmasi ◽ *agent (calendar ✅ verified)*
- Calendar agenda delete `CalendarView.tsx:170-180` → `remove(id)` langsung (✅ verified).
- Saved roadmap delete `SavedRoadmapsGrid.tsx:101-114`.
- CV section row deletes (experience/education/cert/project) — one-tap.
- Avatar "Hapus foto" `ProfileSection.tsx:225-234`.
Mostly tanpa undo; tap tak sengaja di HP = kehilangan data nyata (reminder interview, entri CV).
**Fix:** Bungkus `ResponsiveAlertDialog` (sudah dipakai untuk theme-reset / delete-all-notifications).

### 🔴 UX3 — ChecklistItemCard: toggle tanpa `aria-label` + card clickable `<div>` tak keyboard-accessible ◽ *agent*
`document-checklist/.../ChecklistItemCard.tsx:21-48` — toggle hanya ikon `CheckCircle2`/`Circle` (SR: "button" tanpa label); root `<div onClick>` `cursor-pointer` tanpa `role`/`tabIndex`/key-handler → user keyboard & SR tak bisa buka detail.
**Fix:** `aria-label` dinamis di toggle; ubah card jadi `<button>` atau `role="button" tabIndex={0}` + handler Enter/Space.

### 🟡 UX4 — Loading state hilang → flash "kosong-lalu-terisi" ◽ *agent*
- `notifications/components/NotificationsView.tsx` (~198) — `isLoading` ada di hook tapi tak dibaca; saat query resolve user lihat "Belum ada notifikasi".
- `settings/components/ProfileSection.tsx:59-62` — form init dari `EMPTY_PROFILE` saat `currentUser` masih `undefined`.
- `document-checklist/hooks/useChecklistData.ts` — `isLoading` tak di-expose; area list kosong 2-3s.
- (🟢) `dashboard-home/.../DashboardHome.tsx:193,200,234` — KPI tampil "—" saat loading (terbaca "tanpa data"); pakai `<Skeleton>` + `aria-live`.
**Fix:** Render skeleton sebelum empty-state; expose `isLoading`.

### 🟡 UX5 — A11y form: `<Label>` tanpa `htmlFor` + `<Input>` tanpa `id` (WCAG 1.3.1) ◽ *agent*
CV sections (`CertificationsSection.tsx:47-64`, `EducationSection`, `ExperienceSection`, `ProjectsSection`, `SkillsSection`), `ProfileSection.tsx:386-388` (ChipInput), `ItemDetailDialog` (~67,76), `OnboardingWizard.tsx` (~219). Plus icon-button tanpa `aria-label`: PracticeSession/QuestionBank Star, ThemePresetPicker swatch.
**Fix:** `id` stabil + `htmlFor`; `aria-label` Indonesia di tiap icon-button & select trigger.

### 🟡 UX6 — Touch: tap target <44px + aksi hover-only tak terlihat di HP ◽ *agent (calendar ✅ verified)*
- Hover-only (HP tak punya hover): calendar edit/delete `CalendarView.tsx:464` (`opacity-0 group-hover:opacity-100`), notif dismiss `NotificationsView.tsx` (~189). ✅ verified calendar.
- Tap <44px: calendar `h-7 w-7`, notif `h-7 w-7`, kanban add `h-6 w-6`, SavedRoadmaps delete `w-6 h-6`, ContactCard `h-8 w-8`.
**Fix:** Aksi terlihat reduced-opacity di `<lg` / overflow-menu "⋮"; bump ikon ke `h-9 w-9`+.

### 🟡 UX7 — Kanban sembunyikan 3 kolom di tablet ◽ *agent*
`career-dashboard/.../ApplicationKanban.tsx:92` — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`: di `sm`/`md` hanya 2 dari 5 kolom status tampil, sisanya tak terjangkau (tanpa scroll horizontal).
**Fix:** `md:grid-cols-3 xl:grid-cols-5` atau `overflow-x-auto`.

### 🟢 UX8 — i18n: bahasa Inggris bocor ke UI Indonesia ◽ *agent*
`aria-label="Drag handle"` (`ExperienceSection.tsx:56`, `SkillsSection.tsx:50`), `aria-label="Layout preview"` (`PreviewToolbar.tsx:34`), "gunakan fitur translate browser" (`AppearanceSection.tsx:132`), literal `<code>/r/registry.json</code>` dirender sebagai teks (`ThemePresetPicker.tsx:45`), `<Label>Password</Label>` (LoginPage `:228`).
**Fix:** Terjemahkan; untuk `<code>` kembalikan JSX bukan string.

### 🟢 UX9 — Misc a11y/dark-mode ◽ *agent*
ProgressGrid color-only signaling (`ProgressGrid.tsx`), CategoryFilter tanpa `focus-visible` ring, PreviewSidebar badge border tanpa `dark:border-*`, submit button tak ubah label saat saving (`CalendarView.tsx` ~696), validasi gagal senyap (`:572` `return` tanpa pesan), text `text-[9px]`/`text-[11px]` di bawah minimum mobile.

---

## 6. Kualitas Kode & DX

> Bersih di banyak axis: **0 `any` di convex**, **0 cross-slice import**, **0 `console.log` logika bisnis**, **0 TODO/FIXME di source** (26 marker itu di `docs/`). Isu utama: duplikasi & file raksasa.

### 🟡 D1 — `requireQuota()` duplikat dengan tipe error beda ◽ *agent*
`convex/ai/actions.ts:13-17` (`Error`) vs `convex/cv/actions.ts:21-25` (`ConvexError`) → client lihat semantik gagal berbeda untuk kondisi sama. Konsolidasikan; standardkan ke `ConvexError` (yang sampai bersih ke client).

### 🟡 D2 — Error-handling AI-gateway copy-paste 4× ◽ *agent*
`convex/cv/actions.ts:~142,290,447,652` — pola `response.text()` → `recordError()` → refund → throw, dengan cap truncate drift `.slice(0,400)` vs `.slice(0,300)`. Ekstrak `handleAIGatewayError(ctx, response, source, userId)`. (Bersama C1 & D1, ini menyelesaikan 3 dari 4 duplikasi sekaligus.)

### 🟡 D3 — File raksasa (god files) ◽ *agent*
| File | Baris | Saran split |
|---|---|---|
| `convex/ai/actions.ts` | 831 | `ai/core.ts` (requireQuota/resolveAI/callAI) + `ai/simple.ts`; sisakan `chat` |
| `convex/cv/actions.ts` | 759 | `cv/core.ts`, `cv/translate.ts`, `cv/generation.ts`, `cv/ledger.ts` |
| `convex/profile/queries.ts` | 739 | `profile/public.ts` + `profile/settings.ts` (`getBySlug` = 243 baris) |
| `convex/ai/mutations.ts` | 624 | `ai/config.ts`, `ai/skills-tools.ts`, `ai/quota.ts`, `ai/sessions.ts` |
| `frontend/.../CalendarView.tsx` | 708 | ekstrak `useAgendaFiltering` + `AgendaFormDialog`/`AgendaRow` |
| `frontend/app/[slug]/page.tsx` | 556 | pisah `ProfileView`+`PortfolioTile`; `buildPersonJsonLd` → `lib/schema.ts` |
| `frontend/.../CVGenerator.tsx` | 447 | `useTemplateSwiper`, `useAccordionTabs`, `CVEditorHeader`, `usePreviewExport` |
> `frontend/shared/components/ui/sidebar.tsx` (773) = shadcn vendored, biarkan.

### 🟡 D4 — Magic number param AI tak ber-nama ◽ *agent*
~35 `max_tokens:`/`temperature:`/`detail.slice(0,N)` inline lintas 5 file (temp 0.2–0.8, max_tokens 5–2500) tanpa konstanta bernama. `COMPLETENESS_WEIGHTS` (`profile/queries.ts:79-162`, nilai 5/10/15/20…) dan WIB offset `7*60*60*1000` (`ai/actions.ts:472`) sebaiknya jadi konstanta.

### 🟡 D5 — Double-cast type-safety ◽ *agent*
`admin-panel/hooks/useTemplatePanel.ts:110,122,260,298` — 4× `as unknown as LoadedTemplate/AuditableTemplate` (model tipe template tak selaras; rekonsiliasi, jangan double-cast). `ConvexClientProvider.tsx:38` patch method privat Convex (rapuh antar-upgrade; beri komen + test guard). `ai-agent/lib/slashCommands.ts:89` & `AIAgentConsole.tsx:210` cast payload arbitrer ke `AgentAction` tanpa validasi boundary.

### 🟡 D6 — Gap test pure-logic ber-risiko tinggi ◽ *agent*
Hanya 24 test file. Modul pure-logic tanpa test, urut risiko:
1. 🔴 `convex/engine/outcomes/calibrator.ts` (150) — kalibrasi Bayesian yang men-feed ranking graph. Error sign/clamp = korup rekomendasi roadmap diam-diam.
2. 🟡 `convex/engine/atoms/lib.ts` (89) — `atomHash()` FNV-1a, `canonicalizeClaim()`. Kolisi/canonicalize buruk = atom truth-ledger duplikat/hilang.
3. 🟡 `frontend/slices/skill-roadmap/lib/gamification.ts` (179) — `levelFromXp`/`computeStreak`/`evaluateAchievements`. `computeStreak` ada risiko off-by-one date-boundary.
4. 🟡 `frontend/slices/skill-roadmap/lib/treeBuilder.ts` (62) — rekonstruksi hierarki parentId.
5. 🟢 `convex/_shared/aiProviders.ts` (`resolveProviderBaseUrl` trailing-slash) — relevan ke konsolidasi C1.
6. 🟢 `frontend/shared/components/onboarding/lib/parser.ts` (`parseQuickFillJSON`) — parse output LLM tak tepercaya, target fuzz bagus.
> `matcher/atsScore.test.ts` ada tapi hanya cover `normalize()`/`flattenCVText()`; bobot `scoreATS()` (35/25/15/15/10) & `inferYearsOfExperience()` belum ditest.

---

## 7. Roadmap Perbaikan (urut dampak/biaya)

### Quick wins (≤1 jam, dampak nyata)
1. **`bg-muted/50/50` → `bg-muted/50`** (4 file, satu find/replace) — UX1.
2. **`resolveAI` konsolidasi (C1)** — ekstrak satu helper, ganti 4 call site. Memperbaiki bug konfigurasi AI **dan** menutup D1/D2.
3. **Confirm dialog aksi destruktif (UX2)** — `ResponsiveAlertDialog` sudah ada.
4. **HMAC fail-closed di prod (S1)** + set env.

### Sprint kecil (½–1 hari)
5. **Sanitizer HTML allowlist-atribut + test (C2)** — tutup stored XSS.
6. **cascadeDelete lengkapi tabel + storage (C3)** — tutup gap erasure.
7. **Guard crash & frozen-input frontend (FE1, FE2)** + error-handling (FE3, FE4, FE5).
8. **Loading states (UX4)** + a11y form `htmlFor`/`aria-label` (UX5, UX3) + touch (UX6, UX7).
9. **Storage IDOR portfolio/avatar (B1)** + dedup tenant (B2).

### Hardening berkelanjutan
10. **Validasi input domain** (B4 plan, B5 contacts, B6 roadmap NaN, B7 calendar).
11. **Test pure-logic** (D6: calibrator → atoms → gamification).
12. **Split god files** (D3) saat menyentuh area terkait.
13. Index waktu untuk agregat engine (B3); `_ipGatedCheckEmail` index (S6).

---

## 8. False Positive yang Dibuang (jaga integritas audit)

- **`ItemDetailDialog onOpenChange={onClose}`** — *bukan* bug. Untuk dialog prop-controlled tanpa trigger internal Radix, Radix hanya fire `onOpenChange(false)` saat dismiss; `onClose` yang abaikan boolean aman.
- **Array read-modify-write (roadmap/goals/saved-templates)** — *bukan* race. Mutation Convex = transaksi serializable; append konkuren retry, bukan clobber.
- **Template/jobListings publik non-owner-scoped** — memang sengaja publik, benar.
- **`FileUpload` double-revoke URL** — no-op browser, harmless.
- **`matcher/external.ts` SSRF** — hanya fetch URL feed hardcoded; teks JD user di-parse AI, tak pernah di-`fetch`. Aman.

---

## 9. Diverifikasi Bersih (tak perlu di-audit ulang)

- **Sweep IDOR** lintas cv/applications/documents/roadmap/calendar/contacts/notifications/portfolio/mockInterview/financial/goals/profile/matcher/feedback/engine/onboarding/files/ai — ownership ditegakkan di tiap fungsi penerima-ID. Admin pakai `requireAdmin`/`requireSuperAdmin`; `bootstrap.ts` internal-only.
- **File upload:** MIME allowlist ketat (`image/webp`+`application/pdf`) + cap ukuran (`files/mutations.ts:24-38`); `uploadedBy` dari sesi; URL download di-gate `tenantId`. (Minor: MIME client-declared, tak byte-sniffed — blob tak pernah dieksekusi, low.)
- **HTTP endpoints:** `check-email`/`password-reset`/`signin-attempt` semua IP-rate-limited + origin-gated + anti-enumeration (`{ok:true}` selalu). `/api/health` tak bocor PII. Webhook Resend verifikasi HMAC Svix constant-time.
- **Pipeline AI:** `requireQuota → sanitizeAIInput → wrapUserInput` konsisten di cv/matcher/mockInterview/ai-chat/onboarding; refund quota saat gateway 5xx.
- **CSP/header:** `frame-ancestors 'none'`, `object-src 'none'`, `connect-src` scoped, HSTS, nosniff. (`script-src 'unsafe-inline'` tradeoff terdokumentasi — relevan ke dampak C2.)
- **Secrets/env:** tak ada secret asli ter-commit; `convex.env.example` placeholder kosong; `.gitignore` cover `convex.env`/`.env.local`; tak ada bocor `NEXT_PUBLIC_`.
- **`auth.ts` PBKDF2** custom (100k iter, v1/v2 compat, constant-time compare) — benar; jangan revert ke Scrypt.
- **LoginPage** — label, `aria-label`/`aria-pressed` toggle password, `autoComplete`, loading states, skip-link, `aria-hidden` SVG Google. Baik.
- **Calendar/CV/applications** flows — hooks order stabil, mutation try/catch + `notify.fromError`, key list stabil.

---

## 10. Metode

- 5 agent paralel (general-purpose) membaca kode aktual, masing-masing scoped: backend-korektnes, frontend-korektnes, UI/UX-a11y, security-ops, kualitas-DX. Setiap agent diinstruksikan **hanya melaporkan temuan terverifikasi dengan `file:line`** dan menandai keyakinan, dengan peringatan eksplisit bahwa false-positive lebih buruk dari miss.
- Temuan 🔴 (C1, C2, S1) + sampel 🟡 (FE1, FE2, UX1) saya **buka & trace ulang sendiri** sebelum dimasukkan.
- Constraint stack dihormati: semua fix dalam stack terkunci (Convex / `@convex-dev/auth` / Next.js / Dokploy / pnpm / Vitest). Tak ada saran swap engine/framework/provider.

---

## 11. Eksekusi — Fix yang Diterapkan (2026-06-11)

Seluruh temuan kritis + sebagian besar moderat dikerjakan dalam sesi yang sama. **Gate hijau:** `pnpm typecheck` ✓ · `pnpm exec vitest run` → **294/294 pass (27 file)** ✓ · `pnpm lint` (zero-warning) ✓.

### Kritis
- ✅ **C1** — `resolveAI` dikonsolidasi ke `convex/_shared/aiResolve.ts` (satu-satunya copy, urutan resolusi penuh user→global→override→env). 5 call site (ai/cv/matcher/plan/external) rewire. Memperbaiki bug konfigurasi AI + menutup duplikasi D-series.
- ✅ **C2** — Sanitizer HTML (`profile/blocks/helpers.ts`) diubah ke **allowlist-atribut** + protocol-check href (termasuk unquoted). Test regresi `helpers.test.ts` (12 kasus, termasuk bypass `/`-separator, quote-adjacent, unquoted `javascript:`).
- ✅ **C3** — `cascadeDeleteUser` melengkapi `aiUserModelOverrides`, `truthAtoms` (+ hapus blob proof), `outcomeEvents`, `careerQuests`.

### Backend
- ✅ **B1** storage IDOR — helper `files/ownership.ts` `assertOwnedStorages`, dipakai di portfolio create/update (cover+media) & CV avatar.
- ✅ **B2** dedup `saveFile` di-gate tenant. ✅ **B4** `createQuest` clamp eta/cap/dedupe-id. ✅ **B5** contacts caps (`_shared/validate.ts`). ✅ **B6** roadmap NaN guard. ✅ **B7** calendar format+caps. ✅ **B8** refund quota plan 200-sampah.
- ✅ **S1** HMAC reset fail-closed (JWT_PRIVATE_KEY fallback, no public constant). ✅ **S2** dead `LOGIN_RATE_LIMIT` dihapus. ✅ **S4** profil di-`sanitizeAIInput` sebelum system prompt. ✅ **S6** `authCheckEmail` pakai index `email`.

### Frontend
- ✅ **FE1** mock-interview reset index + guard. ✅ **FE2** checklist input lokal (flush on blur/close). ✅ **FE3** networking `withMutationToast`. ✅ **FE4** AI console `finally` + per-sesi `thinkingId` + error toast. ✅ **FE5** OpenRouterModelPicker race/unmount guard. ✅ **FE6** SalaryInsightsCard denom, AIConfigPanel disabled, PortfolioForm seed-on-open, DocumentChecklist filter per-tab.

### UI/UX & a11y
- ✅ **UX1** `bg-muted/50/50`→`bg-muted/50` (4 file). ✅ **UX2** confirm dialog (calendar agenda, saved roadmap). ✅ **UX3** ChecklistItemCard keyboard + aria. ✅ **UX5** label `htmlFor`/`id` CV sections + ChipInput + mock-interview. ✅ **UX6** tap target ≥36px + aksi terlihat di touch (calendar, notif, contact, saved-roadmap). ✅ **UX7** kanban breakpoint tablet. ✅ **UX8** i18n (drag handle, layout preview, translate, `<code>`).

### Test baru
- ✅ `convex/profile/blocks/helpers.test.ts` (XSS), `frontend/slices/skill-roadmap/lib/gamification.test.ts` (15), `convex/engine/atoms/lib.test.ts` (11). Total suite 294 pass.

### Sengaja ditunda (butuh keputusan/perubahan lebih besar)
- **B3** index waktu agregat engine (perlu skema index baru + migrasi). **B9** `toggleResource` id (perlu skema resource baru). **S3** account-linking Google (watch-item; default sudah aman). **S5** `publicLocationShow` (perlu toggle UI baru — menambah field default-false akan menyembunyikan lokasi yang sekarang tampil, regresi). **D3** split god-file (refactor besar, nol nilai korektnes). **UX2** confirm pada hapus baris CV/avatar (stakes rendah, mudah re-add).
