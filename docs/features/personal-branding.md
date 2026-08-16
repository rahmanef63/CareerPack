# Personal Branding (Public Profile Builder)

> **Portability tier:** XL — slice + public route + `convex/profile/` +
> iframe template renderer/hydrator + 4 static template documents + MCP tool
> surface.
>
> **Recent changes (2026-08-15):**
> - Manual block builder **dihapus**. `builder/`, `ManualBlocksCard`,
>   `ManualDesignCard`, `StyleCard`, `ModeWarning`, `ManualTab`/`AutoTab`,
>   `templateHydrator/manualBlocks.ts`, `v-manual.html`,
>   `convex/profile/blocks/{types,sanitize}.ts`, dan `buildAutoBlocks`
>   semuanya hilang. Lihat **History** di bawah.
> - Satu editor saja: `personal-branding-view/EditorPanel.tsx`, tujuh section
>   accordion. Tidak ada lagi switch mode auto/custom.
> - Baru: `userProfiles.publicHtml` — dokumen HTML lengkap milik user yang
>   **menggantikan** template bawaan, plus `sections/CustomHtmlCard.tsx`.
> - Baru: template bawaan `starter` (`starter.html`) + lima MCP tool
>   (`convex/mcp/tools/branding.ts`).
> - Baru: `convex/profile/loadBranding.ts` — perakitan payload yang dipakai
>   bareng oleh `getBySlug` (halaman publik) dan MCP `branding_data`.

## Tujuan

Halaman profil publik di `/[slug]` — pengganti Linktree / Bento yang isinya
ditarik otomatis dari data CareerPack (Profil + CV + Portofolio). User memilih
salah satu **template bawaan**, atau memasang **HTML sendiri** (biasanya ditulis
ChatGPT/Claude lewat MCP connector). Dua-duanya dirender lewat jalur yang sama,
diisi payload yang sama, jadi halaman tidak pernah jadi snapshot mati: ubah CV,
halaman publik ikut berubah.

## Route & Entry

- Editor: `/dashboard/personal-branding` — registry slug `personal-branding`
  (`placement: "more"`, icon `Globe`, badge `AI`) di
  `frontend/shared/lib/dashboardRegistry.ts`.
- Halaman publik: `/[slug]` → `frontend/app/[slug]/page.tsx`
  (`revalidate = 60`, `dynamic = "force-static"`, `dynamicParams = true`).
  File tetangga: `ProfileSummary.tsx`, `opengraph-image.tsx`, `error.tsx`.
  **Jangan tambah `loading.tsx`** di segment ini — komentar panjang di
  `page.tsx` menjelaskan kenapa (soft-404: shell ke-flush duluan → status 200
  untuk semua slug ngawur).
- Slice: `frontend/slices/personal-branding/`
- Komponen utama: `PersonalBrandingView.tsx` (orchestrator tipis) →
  `personal-branding-view/EditorPanel.tsx` (editornya).
- Template statis: `frontend/public/personal-branding/templates/`
  (`starter.html` ~18 KB, `v1.html` 81 KB, `v2.html` 81 KB, `v3.html` 67 KB).

## Struktur Slice

```
personal-branding/
├─ index.ts                        PersonalBrandingView + BrandingCapabilities + manifest
├─ manifest.ts                     Katalog skill AI in-app (status/slug/theme/availability)
├─ blocks/
│  └─ types.ts                     TEMPLATE_THEMES, TEMPLATE_URLS, THEME_LABELS
│                                  (nama folder legacy — isinya cuma registry template)
├─ components/
│  ├─ PersonalBrandingView.tsx     2 tab: "Edit halaman" | "Bagikan & pasang"
│  ├─ personal-branding-view/
│  │  └─ EditorPanel.tsx           SATU editor — 7 section accordion + preview split
│  ├─ MiniPreviewFrame.tsx         Preview live di kolom kanan (desktop)
│  ├─ PreviewDialog.tsx            Preview modal — viewport (desktop/tablet/mobile)
│  │                               + mode "Data Saya" vs "Template" (mock bawaan)
│  ├─ MobileActionBar.tsx          Bar Preview/Publikasikan sticky (mobile)
│  ├─ PBSectionNav.tsx             Nav 7 section (mobile)
│  ├─ BrandingShowMoreDialog.tsx   Modal "Lihat semua" untuk list yang dipotong di iframe
│  └─ BrandingCapabilities.tsx     Binder aiActionBus (di-mount di Providers)
├─ form/
│  ├─ types.ts                     FormState, Bind, SetField, SubmitOptions
│  ├─ defaults.ts                  DEFAULT_FORM_STATE, DEFAULT_SECTION_ORDER,
│  │                               FIELD_LIMITS, DEFAULT_RESERVED_SLUGS
│  ├─ slugValidation.ts            validateSlug() — mirror convex/profile/slug.ts
│  ├─ usePBForm.ts                 State machine: hydrate, bind, autosave 1.5s, submit
│  ├─ usePreviewBranding.ts        Bangun BrandingPayload versi klien (mirror backend)
│  └─ usePreviewProfile.ts         Rakit prop `profile` untuk PersonalBrandingPage
├─ sections/
│  ├─ PBSection.tsx                Wrapper accordion-card
│  ├─ SectionShell.tsx             Wrapper card biasa (mode noCard)
│  ├─ IdentityCard.tsx             Saklar publish + slug + headline
│  ├─ ThemeCard.tsx                Picker 4 template (tanpa mini-preview gambar)
│  ├─ CustomHtmlCard.tsx           Textarea publicHtml + Simpan / Hapus
│  ├─ HeroTogglesCard.tsx          Opt-in per kolom hero (avatar/bio/skills/…)
│  ├─ SectionLayoutCard.tsx        Urutan + show/hide section halaman publik
│  ├─ AvailabilityCard.tsx         Badge "tersedia untuk direkrut" (+ note ≤80)
│  ├─ CtaCard.tsx                  CTA tunggal (link/email/calendly/download)
│  ├─ ContactCard.tsx              Email / LinkedIn / Portfolio URL
│  ├─ IndexingCard.tsx             allowIndex (default mati)
│  ├─ ShareCard.tsx                URL publik + copy + share text
│  ├─ ExportCard.tsx               Kartu HTML / snippet embed / prompt AI
│  ├─ StatusBanner.tsx             Baca SERVER state (active/draft/empty)
│  ├─ SaveActions.tsx              Simpan draft / publikasikan + indikator autosave
│  ├─ BrandingValidationCard.tsx   Skor + jump-link (`pb-jump` CustomEvent)
│  ├─ brandingScore.ts             Skor 0–100 + grade A–E + GRADE_LABEL
│  └─ brandingScore.test.ts
└─ themes/                          Render layer
   ├─ index.tsx                    PersonalBrandingPage — pilih html kustom vs template
   ├─ TemplateLayout.tsx           Fetch/cache template, srcDoc iframe, postMessage bus
   ├─ TemplateSkeleton.tsx         Skeleton sebelum HTML siap
   ├─ BrandFooter.tsx              Footer "dibuat dengan CareerPack"
   ├─ FloatingMobileNav.tsx        Nav bawah di luar iframe (+ sanitasi SVG allowlist)
   ├─ inject.ts                    injectBrandingIntoHtml — splice __cp_data + hydrator
   ├─ types.ts                     BrandingPayload, ProfileShape, VALID_SHOW_MORE_LISTS
   ├─ starterTemplate.test.ts      Guard drift: starter.html vs kontrak hydrator
   ├─ templateHydrator.ts          Rakit IIFE hydrator (urutan fragment penting)
   └─ templateHydrator/
      ├─ preamble.ts               `var d` dari <script id="__cp_data">, bail kalau kosong
      ├─ style.ts                  style → --cp-primary/--cp-font/--cp-radius/--cp-density
      ├─ fillHelpers.ts            fill() / setAttr() / hideSection() / renderList()
      ├─ identityFills.ts          Isi semua slot + hide section per `has`
      ├─ pageExtras.ts             Badge availability, CTA, reorder, fluff, empty
      ├─ truncate.ts               Potong list panjang + tombol "Lihat semua"
      └─ iframeHelpers.ts          Anchor nav, auto-resize, ekstraksi floating nav
```

## Dua sumber konten, satu jalur render

`themes/index.tsx → PersonalBrandingPage` cuma punya satu percabangan:

| Sumber | Kapan dipakai | Dari mana |
|---|---|---|
| **Template bawaan** | `publicHtml` kosong | `fetch("/personal-branding/templates/<file>.html")` di klien, di-cache di `TEMPLATE_HTML_CACHE` (Map, per-session, key = theme id) |
| **`publicHtml`** | string non-kosong | Dikirim sebagai prop dari `getBySlug` — tidak pernah di-fetch, tidak pernah di-cache (berubah tiap user edit). `templateKey` = `custom-<length>` supaya ganti dokumen = remount iframe |

Setelah itu jalurnya identik. `injectBrandingIntoHtml(html, branding)`:

1. `<script id="__cp_data" type="application/json">…</script>` di-splice **sebelum `</head>`** — harus duluan, karena inline script milik template (mis. `v2`) membacanya saat eksekusi. JSON-nya di-escape (`<` jadi `\u003c`, plus U+2028/U+2029) supaya tidak ada tabrakan `</script>`.
2. `TEMPLATE_IFRAME_HELPERS_JS` + `TEMPLATE_HYDRATOR_JS` di-splice **sebelum `</body>`** (fallback `</html>`, lalu append).
3. Hasilnya jadi `srcDoc` iframe.

Kalau `branding` tidak dikirim (`showBranding={false}` — tab "Template" di
`PreviewDialog`), cuma helpers yang masuk: template tampil dengan mock content +
section `data-cp-fluff`-nya, tanpa data user.

Payload-nya dirakit **sekali** di `convex/profile/loadBranding.ts`
(avatar → portfolio visible → CV terbaru → `buildBrandingPayload`) dan dipakai
dua pemanggil: `api.profile.queries.getBySlug` (halaman publik) dan
`internal.mcp.data.branding.getBrandingData` (tool `branding_data`). Sengaja satu
implementasi: kalau keduanya beda, model akan menulis marker untuk data yang
tidak pernah dikirim halaman, dan bug-nya cuma kelihatan sebagai section kosong
di layar orang lain.

## Kontrak marker `data-cp`

Ini **antarmuka authoring** untuk manusia maupun AI host. SSOT-nya
`themes/templateHydrator/` (implementasi) dan `MARKER_CONTRACT` di
`convex/mcp/tools/branding.ts` (yang dikirim ke model). Kalau nambah marker,
update dua-duanya. `starter.html` mengimplementasikan seluruh tabel di bawah —
itu contoh terpendek yang benar.

Kontraknya cuma cocok-cocokan string di runtime, di dalam iframe, tanpa error
kalau meleset — jadi `themes/starterTemplate.test.ts` membacanya balik dari
source hydrator dan memastikan `starter.html` merender **setiap** key yang
diisi, punya tepat satu `data-cp-template` per list, tidak memakai nama section
di luar `has`, tidak meminta apa pun lewat jaringan, dan tidak membawa `<form>`
atau handler inline.

| Atribut | Arti |
|---|---|
| `data-cp="KEY"` | Isi `textContent` node dengan nilai `KEY`. |
| `data-cp-mode="src\|href\|html"` | Isi atribut itu, bukan teks. `html` → `innerHTML`. |
| `data-cp-list="NAME"` | Container berisi **satu** anak `data-cp-template`; anak itu di-clone per item, diisi, template asli dihapus. Sibling mock lain di container ikut dibuang. |
| `data-cp-section="NAME"` | Wrapper section — `display:none` saat `has.NAME` false. |
| `data-cp-empty="NAME"` | Kebalikannya: hanya tampil saat section itu kosong. |
| `data-cp-fluff` | Selalu di-hide begitu ada data nyata (testimoni palsu, metrik karangan, lorem). Tetap tampil di preview mode "Template". |
| `data-cp-list-max="N"` | Override ambang truncate per container. |
| `data-cp-skip-cta` | Di ancestor hero → hydrator tidak menyuntik tombol CTA. |

**Key teks:** `name`, `headline`, `target-role`, `location`, `bio`, `summary`,
`contact-email`.

**Key atribut:** `avatar` (`mode=src`), `contact-email-href` (`mode=href`,
prefix `mailto:` otomatis), `contact-linkedin`, `contact-portfolio` (dipakai
sebagai href sekaligus teks).

| List (`data-cp-list`) | Key item | Truncate default |
|---|---|---|
| `skills` | `skill-name` | 6 |
| `experience` | `exp-company`, `exp-position`, `exp-period`, `exp-description`, nested list `exp-achievements` → `achievement` | 2 |
| `education` | `edu-institution`, `edu-degree`, `edu-field`, `edu-period`, `edu-gpa` | 4 |
| `projects` | `proj-title`, `proj-description`, `proj-category`, `proj-cover` (emoji), `proj-link` (`mode=href`), nested list `proj-tech` → `tech-name` | 3 |
| `certifications` | `cert-name`, `cert-issuer`, `cert-date` | 3 |
| `languages` | `lang-name`, `lang-proficiency` | 6 |

`exp-period` / `edu-period` dirakit hydrator dari `startDate`/`endDate`
(`"2024 — Sekarang"` untuk `current`). Sub-list (`proj-tech`,
`exp-achievements`) **tidak pernah** dipotong.

**Nama section** (`data-cp-section` / `data-cp-empty` / `sectionOrder`):
`about`, `skills`, `experience`, `education`, `certifications`, `languages`,
`projects`, `contact` — persis `ALLOWED_SECTIONS` di `convex/profile/mutations.ts`.

**Yang disuntik hydrator tanpa marker:**

- Badge *availability* — disisipkan sebelum `h1` / `[data-cp-hero]` pertama.
- Tombol CTA — masuk ke `.hero-cta` / `.hero-actions` kalau ada, kalau tidak
  setelah `.hero-action`, kalau tidak setelah heading hero. Mengadopsi class
  `.btn-primary` / `.btn` milik template supaya warnanya nyambung.
- `style` (dari row lama, **hanya kalau ada `publicHtml`**) → `--cp-primary`,
  `--cp-font`, `--cp-radius`, `--cp-density` di `:root` + layer override.
- `sectionOrder` → urutan ulang sibling `[data-cp-section]` dalam parent yang sama.
- `.reveal` / `.js-reveal` / `.stagger` dipaksa `is-visible` — IntersectionObserver
  sering tidak pernah fire di srcdoc iframe dan hero-nya nyangkut `opacity:0`.
- Avatar kosong → seluruh `.hero-visual` (atau `[data-cp-avatar-wrap]`) di-hide
  dan `.hero-grid` dikolapskan jadi satu kolom.
- **Nilai `src`/`href` kosong menyembunyikan elemennya**, bukan cuma menghapus
  atribut. Sebelum ini, user tanpa LinkedIn tetap punya tombol "LinkedIn" yang
  mati dan masih memakai label mock template. Re-fill idempoten: nilai yang
  datang belakangan meng-unhide lagi.

**postMessage protocol** (iframe ⇄ parent, `TemplateLayout` yang jaga):

| Arah | Pesan | Efek |
|---|---|---|
| iframe → parent | `cp-resize {h}` | Tinggi iframe di-clamp 400–20000 px |
| iframe → parent | `cp-show-more {list}` | Buka `BrandingShowMoreDialog` (list divalidasi lewat `VALID_SHOW_MORE_LISTS`) |
| iframe → parent | `cp-floating-nav {items}` | Maks 6 item → `FloatingMobileNav` (SVG-nya disaring allowlist) |
| iframe → parent | `cp-anchor-y {y}` | Parent men-scroll viewport-nya sendiri |
| parent → iframe | `cp-goto {id}` | Cari elemen, balikin posisinya |

Parent **hanya** menerima pesan yang `event.source === iframe.contentWindow`
**dan** `event.origin === "null"` — origin opaque itu satu-satunya diskriminator
yang bisa dipercaya dari srcdoc tanpa `allow-same-origin`.

## Data Flow

Backend: `convex/profile/` — semua field menumpang row `userProfiles` yang sama
dengan Pengaturan (prefix `public*`).

| Operasi | Convex |
|---|---|
| Load editor state | `api.profile.queries.getMyPublicProfile` |
| Simpan / publish (manual + autosave 1.5s) | `api.profile.mutations.updateMyPublicProfile` |
| Lookup publik | `api.profile.queries.getBySlug` (unauth; `null` untuk semua jenis kegagalan) |
| Sitemap | `api.profile.queries.listIndexableSlugs` (index `by_public_index`, cap 5000) |
| Data preview editor | `api.profile.queries.getCurrentUser` + `api.cv.queries.getUserCVs` + `api.portfolio.queries.listPortfolio` |
| MCP baca | `internal.mcp.data.branding.getBranding` / `getBrandingData` |
| MCP tulis | `internal.mcp.data.branding.setHtml` / `clearHtml` |
| Import CV (isi profil + CV sekaligus) | di luar slice ini — komponen `CVImportButton` dari `@/shared/components/onboarding`, lihat `cv-generator.md` |

Field di `userProfiles` (lihat `convex/profile/schema.ts`): `publicEnabled`,
`publicSlug`, `publicHeadline`, `publicHtml`, `publicTheme`, `publicAccent`,
`publicAllowIndex`, `publicAvatarShow`, `publicBioShow`, `publicSkillsShow`,
`publicTargetRoleShow`, `publicLocationShow`, `publicPortfolioShow`,
`publicContactEmail`, `publicLinkedinUrl`, `publicPortfolioUrl`,
`publicAutoToggles`, `publicAvailableForHire`, `publicAvailabilityNote`,
`publicCta{Label,Url,Type}`, `publicSectionOrder`,
`public{Html,Embed,Prompt}Export`. Index: `by_public_slug` (unik global),
`by_public_index` (sitemap).

Legacy read-only, tidak ada yang menulis: `publicMode`, `publicBlocks`,
`publicHeaderBg`, `publicStyle`.

**Gating data, bukan cuma tampilan.** `buildBrandingPayload` menjatuhkan DATA
section yang dimatikan user (`about`/`skills`/`experience`/… jadi `""`/`[]`),
bukan sekadar menyetel `has.X = false`. `getBySlug` tidak terautentikasi —
menyembunyikan sesuatu di sisi klien bukan privasi. `location` default
**tersembunyi** sampai user opt-in.

## MCP tool surface

`convex/mcp/tools/branding.ts` (definisi) + `convex/mcp/data/branding.ts`
(query/mutation). Scope diturunkan dari `annotations.readOnlyHint`
(`convex/mcp/types.ts`): read-only → `mcp.read`, sisanya → `mcp.write`.

| Tool | Scope | Isi |
|---|---|---|
| `branding_get` | `mcp.read` | Status halaman: `published`, `slug`, `url`, `headline`, `indexable`, `template`, `source` (`template`\|`custom_html`), `html_chars`, `html_max_chars`. `include_html: true` untuk ikut mengembalikan HTML-nya |
| `branding_data` | `mcp.read` | `{ contract, data }` — payload `__cp_data` yang identik dengan halaman live, **plus** `MARKER_CONTRACT` |
| `branding_templates` | `mcp.read` | Tanpa argumen = daftar 4 template; dengan `template_id` = HTML-nya, di-fetch HTTP dari `APP_URL` (default `https://careerpack.org`) |
| `branding_set_html` | `mcp.write` | Ganti seluruh dokumen (`normalizePublicHtml`) |
| `branding_delete_html` | `mcp.write` | Kosongkan `publicHtml` → balik ke template |

Write lewat MCP kena `MCP_WRITE_LIMIT` (25/menit) + `MCP_WRITE_DAILY_LIMIT`
(400/hari) dari `convex/mcp/data/limits.ts` — token MCP hidup setahun dan jalan
tanpa manusia di depannya.

**Tidak ada publish tool, disengaja.** `publicEnabled`, `publicSlug`, dan
`publicAllowIndex` hanya bisa ditulis dari dashboard. AI boleh menyusun halaman;
keputusan menaruh nama sendiri di internet tetap di manusia. Kalau halamannya
belum aktif, tool-nya menyuruh model bilang ke user untuk menyalakan sendiri.

Agent in-app (`manifest.ts` + `BrandingCapabilities.tsx`) surface-nya berbeda dan
lebih sempit: `branding.get-status`, `toggle-public`, `set-slug`, `set-theme`,
`set-available`. Agent in-app **tidak** menulis HTML.

## State Lokal — `usePBForm`

- **`state: FormState`** — 25 field (lihat `form/types.ts`). Nambah field =
  4 sentuhan: `FormState` → `defaults.ts` → `seedFromServer` → section pemakainya.
- **`bind(key)`** → `{ value, onChange }`, tipenya di-narrow per field.
- **Hydrate sekali** saat data server datang; perubahan server berikutnya tidak
  menimpa editan lokal (biar tidak terasa reset hantu). Guard-nya di-reset saat
  mode auth berubah (demo ↔ login), termasuk baseline autosave.
- **Autosave** debounce 1500 ms, `submit({ silent: true })`. Dilewati kalau demo
  atau `canEnable` false. Snapshot JSON (`enabled` dikecualikan) mencegah
  re-render tanpa perubahan memicu save.
- **Demo mode** (`useDemoPBOverlay`) menyimpan ke overlay localStorage, bukan Convex.
- **Slug** divalidasi lokal (`validateSlug`) sebelum submit; tabrakan slug baru
  ketahuan di server (`"Slug sudah dipakai, pilih yang lain"`).
- **`html` tidak di-bind langsung.** `CustomHtmlCard` menyimpan buffer lokal dan
  baru commit saat tombol Simpan ditekan — field ini ikut loop autosave 1,5 detik,
  dan mengirim dokumen ~250 KB per ketikan jelas bukan ide bagus.

`usePreviewBranding` membangun `BrandingPayload` versi klien yang **meniru**
`convex/profile/brandingPayload.ts` baris per baris (gating toggle, urutan
portfolio featured-lalu-terbaru, CV terbaru menang). Kalau salah satu berubah,
ubah dua-duanya — kalau tidak, preview dan halaman live jadi beda.

## Dependensi

- `@/shared/hooks/{useAuth, useDemoOverlay}` — `useDemoPBOverlay`,
  `useDemoProfileOverlay`, `useDemoCVOverlay`, `useDemoPortfolioOverlay`.
- `@/shared/components/layout/{PageContainer, PreviewSplitLayout}`.
- `@/shared/components/onboarding` → `CVImportButton` (menggantikan `ImportCard`
  lama: `parseImportText` cuma mengisi `profile`, CV-nya tidak tersentuh).
- `@/shared/components/brand/Logo` (`BrandFooter`).
- `@/shared/components/ui/*` — badge, button, card, copy-button, input, label,
  progress, responsive-dialog, responsive-page-header, select, skeleton, switch,
  tabs, textarea.
- `@/shared/lib/{aiActionBus, notify, utils}`, `@/shared/types/sliceManifest`.
- `convex/react` (`useQuery`, `useMutation`), `convex/browser`
  (`ConvexHttpClient` di route publik).
- Tipe/konstanta backend yang di-import frontend lewat path relatif:
  `convex/profile/autoBlocks` (`AutoToggles`, `DEFAULT_AUTO_TOGGLES`).
- `lucide-react`. Tidak ada dependensi npm khusus.

## Catatan Desain — model keamanan

- **Iframe sandbox** — dua policy, di `themes/sandbox.ts` (dipisah dari
  komponen supaya bisa di-assert; lihat `sandbox.test.ts`):
  - template bawaan: `allow-scripts allow-popups allow-popups-to-escape-sandbox
    allow-forms`
  - dokumen user (`publicHtml`): sama, **minus `allow-forms`** — form login
    palsu di `careerpack.org/<slug>` satu-satunya penyalahgunaan yang tidak
    sudah dimatikan lapisan lain. `allow-popups-to-escape-sandbox` tetap ada,
    kalau dicabut semua link keluar user membuka tab origin-opaque yang rusak.

  Dua-duanya **tanpa `allow-same-origin`** dan tanpa `allow-top-navigation`.
  Diverifikasi dengan Chrome asli, dokumen penyerang di sandbox yang sama
  (2026-08-16):

  | Percobaan | Hasil |
  |---|---|
  | tulis DOM parent | `SecurityError` |
  | baca `top.document` / cookie aplikasi | `SecurityError` |
  | `document.cookie` sendiri | `SecurityError` |
  | `localStorage` (sesi Convex) | `SecurityError` |
  | redirect top frame ke situs lain | diblokir browser |
  | submit form ke host luar | diblokir browser (`allow-forms` dicabut) |
  | `fetch` ke host luar | diblokir CSP `connect-src` di produksi |
- **`publicHtml` sengaja tidak disanitasi.** Alasannya ada di
  `convex/profile/publicHtml.ts`: menyaring tag justru merusak template bawaan
  (yang butuh inline script-nya sendiri) sambil tidak membeli apa pun yang belum
  diberikan sandbox. Kalau suatu hari halaman dirender **di luar** iframe itu,
  `normalizePublicHtml` adalah tempat sanitiser dipasang — semua caller otomatis
  ikut.
- **Cap ukuran.** `PUBLIC_HTML_MAX = 250_000` karakter. Satu aturan dipakai dua
  jalur tulis (`updateMyPublicProfile` dan MCP `setHtml`) supaya limit tidak bisa
  berlaku di satu sisi saja. `CustomHtmlCard` mencerminkan angka yang sama di klien.
  Template terbesar 81 KB, jadi capnya longgar.
- **Enumerasi.** `getBySlug` mengembalikan `null` untuk semua jenis kegagalan
  (slug ngawur, tidak ada, atau ada tapi dimatikan) → `notFound()`. Halaman
  nonaktif 404, tidak bisa dibedakan dari yang tidak pernah ada. ISR
  `revalidate = 60` menyerap scraping sebelum sampai Convex (harganya: tiap slug
  yang di-probe meninggalkan ~44 KB cache).
- **Indexing default mati.** Tanpa `publicAllowIndex`, metadata mengirim
  `noindex, nofollow, nocache, noarchive, nosnippet` dan JSON-LD `Person` tidak
  di-emit sama sekali. `canonical` tetap dikirim (sengaja) — valid juga di halaman
  noindex.
- **Slug.** 3–30 karakter, `^[a-z][a-z0-9-]+[a-z0-9]$`, tanpa `--`, plus daftar
  reserved. SSOT-nya `convex/profile/slug.ts`; `form/defaults.ts` menyalinnya
  untuk validasi klien — jaga tetap sinkron, terutama saat menambah route root baru.
- **CSP.** Header aplikasi berlaku untuk semua path kecuali
  `/personal-branding/templates/*`. `about:srcdoc` mewarisi CSP parent dan
  meta-CSP hanya bisa memperketat — itulah kenapa Google Fonts dan
  `images.unsplash.com` diizinkan global di `next.config.ts`.
- **`FloatingMobileNav`** merender `iconHtml` yang datang dari iframe lewat
  `dangerouslySetInnerHTML` **di origin aplikasi**. Satu-satunya markup yang
  menyeberang batas itu. `TemplateLayout` sekarang mengosongkan `iconHtml`
  untuk dokumen user, jadi yang lewat cuma file template kita sendiri; allowlist
  tag/atribut di komponen itu tinggal lapis kedua (`class` sudah dicabut dari
  allowlist — `fixed inset-0` di sebuah ikon = overlay satu layar). Jangan
  longgarkan keduanya.
- **Batas yang diketahui.** `connect-src`/`img-src` aplikasi mengizinkan
  `https://*.convex.cloud` dan `https://*.convex.site` (wildcard untuk deploy
  origin yang berubah-ubah). Artinya script di halaman kustom bisa beacon ke
  proyek Convex mana pun — bukan data user lain (tidak ada yang bisa dibaca dari
  origin opaque), tapi cukup untuk menghitung pengunjung. Menyempitkannya ke
  origin yang sudah di-resolve adalah perubahan CSP tingkat aplikasi, bukan
  fitur ini.

## Known gaps

Ditulis biar tidak dicari-cari lagi:

- **`v2.html` tidak ikut protokol `data-cp-list`.** Nol marker list; dia membaca
  `__cp_data` dengan inline script-nya sendiri dan mengisi mount id
  (`skillsMount`, `experienceMount`, `casesMount`, `deckMount`). Karena itu
  `truncate.ts` punya **pass 2** khusus yang memotong mount-mount tersebut.
  Template ini juga default (`publicTheme` kosong → `template-v2`).
- **`v1.html` tidak punya section `education`** (section yang ada: `about`,
  `skills`, `experience`, `projects`, `contact`) — pendidikan user tidak akan
  muncul di template itu.
- **`v3.html` tidak punya section `about`** (yang ada: `skills`, `experience`,
  `education`, `projects`, `contact`).
- **Isi iframe tidak bisa di-index.** Origin opaque tidak punya URL; crawler
  tidak membaca apa pun di dalamnya, dan HTML template-nya di-fetch di klien.
  `ProfileSummary` (dirender server, di bawah iframe) adalah **satu-satunya**
  konten yang bisa dirayapi di route ini dan pemilik satu-satunya `<h1>`.
  Dia juga alasan halaman tetap berguna kalau fetch template gagal.
- **`?embed=1` tidak melakukan apa-apa.** `ExportCard.buildEmbedSnippet`
  menempelkannya, tapi `app/[slug]/page.tsx` tidak membaca `searchParams` sama
  sekali (dan `force-static` memang tidak bisa). Lebih jauh: header aplikasi
  memasang `frame-ancestors 'none'` + `X-Frame-Options: DENY` untuk route ini,
  jadi snippet iframe itu **tidak akan tampil** di Notion/Wix/WordPress. Yang
  boleh di-frame cuma `/personal-branding/templates/*` (`'self'`).
- **`api.profile.queries.isSlugAvailable` tidak punya pemanggil.** Editor hanya
  validasi format lokal; keunikan baru ketahuan saat save. Query-nya masih ada
  (butuh auth) — hapus atau pasang lagi, jangan biarkan menggantung.
- **Sisa builder di validator.** `updateMyPublicProfile` masih menerima
  `mode` / `blocks` / `style` lalu membuangnya, supaya tab lama yang belum
  reload tidak kena `ArgumentValidationError` tiap 1,5 detik. Hapus setelah
  satu-dua rilis.
- **Theme id legacy** `linktree` / `bento` / `magazine` masih diterima validator
  (read-compat) tapi tidak ada di picker; renderer memetakannya ke `template-v2`.
- **`publicStyle` tanpa penulis.** Tidak ada UI yang menulisnya lagi (StyleCard
  ikut terhapus). `loadBranding` cuma mengirimnya kalau row punya `publicHtml`,
  jadi halaman template tidak berubah tampilan gara-gara sisa setting mode
  manual — override `!important` dari hydrator (radius, density, font) sempat
  bocor ke dua halaman produksi sebelum gate ini dipasang. HTML kustom masih
  bisa membacanya dari `__cp_data`.

## Extending

- **Nambah template bawaan** = 1 file di `frontend/public/personal-branding/templates/`
  + `TEMPLATE_THEMES`/`TEMPLATE_URLS`/`THEME_LABELS` (`blocks/types.ts`)
  + union `publicTheme` di `convex/profile/schema.ts` **dan** validator
  `updateMyPublicProfile` + `TEMPLATES`/`TEMPLATE_PATH` di
  `convex/mcp/tools/branding.ts` + daftar tema di `manifest.ts` dan
  `VALID_THEMES` di `BrandingCapabilities.tsx`.
- **Nambah marker** = implementasi di `templateHydrator/` + entri di
  `MARKER_CONTRACT` + dukung di `starter.html` (itu yang dicontek AI host).
- Domain kustom (CNAME → route HTTP Convex).
- Analytics per slug publik (tabel `pageviews` sudah ada).
- Versioning `publicHtml` — sekarang `branding_set_html` menimpa tanpa undo,
  dan itu sebabnya tool-nya bertanda `destructiveHint: true`.

---

## Portabilitas

**Tier:** XL

**Prereq:**
- `auth.md` (auth + `userProfiles`).
- `file-upload.md` (avatar + cover portfolio).
- `portfolio.md` + `cv-generator.md` (sumber data payload).
- `mcp.md` opsional — tanpa itu, HTML kustom tetap bisa ditempel manual di
  `CustomHtmlCard`.

**Files untuk dicopy:**

```
# Slice
frontend/slices/personal-branding/

# Public route
frontend/app/[slug]/{page.tsx,ProfileSummary.tsx,opengraph-image.tsx,error.tsx}

# Template documents (WAJIB — tanpa ini halaman publik blank)
frontend/public/personal-branding/templates/{starter,v1,v2,v3}.html

# Shared
frontend/shared/hooks/useDemoOverlay.ts
frontend/shared/components/layout/{PreviewSplitLayout,PageContainer}.tsx
frontend/shared/components/onboarding/            # CVImportButton
frontend/shared/components/brand/Logo.tsx

# Backend
convex/profile/                                   # schema + queries + mutations +
                                                  # loadBranding + brandingPayload +
                                                  # publicHtml + slug + autoBlocks + blocks/
convex/mcp/tools/branding.ts                      # opsional (butuh MCP server)
convex/mcp/data/branding.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/slices" \
         "$DST/frontend/app/[slug]" \
         "$DST/frontend/public/personal-branding/templates" \
         "$DST/frontend/shared/hooks" \
         "$DST/frontend/shared/components/layout" \
         "$DST/convex/profile"

cp -r "$SRC/frontend/slices/personal-branding" "$DST/frontend/slices/"
cp -r "$SRC/frontend/app/[slug]/."             "$DST/frontend/app/[slug]/"
cp -r "$SRC/frontend/public/personal-branding/templates/." \
      "$DST/frontend/public/personal-branding/templates/"
cp    "$SRC/frontend/shared/hooks/useDemoOverlay.ts" "$DST/frontend/shared/hooks/"
cp    "$SRC/frontend/shared/components/layout/PreviewSplitLayout.tsx" \
      "$DST/frontend/shared/components/layout/"
cp -r "$SRC/convex/profile/." "$DST/convex/profile/"
```

**Schema additions** — salin blok field `public*` + `avatarStorageId` dari
`convex/profile/schema.ts` apa adanya, plus index `by_public_slug` dan
`by_public_index`. Kalau MCP tidak ikut diport, `publicHtml` tetap wajib —
`CustomHtmlCard` menulis field yang sama.

**Convex api.d.ts** — modul `profile` (`queries`, `mutations`), plus
`mcp/tools/branding` + `mcp/data/branding` kalau MCP ikut.

**npm deps:** tidak ada. Renderer memakai iframe + postMessage bawaan browser.

**Env vars:**
- `NEXT_PUBLIC_CONVEX_URL` — dipakai `ConvexHttpClient` di route publik.
- `APP_URL` (env Convex) — origin yang di-fetch `branding_templates`; default
  `https://careerpack.org`.
- Origin publik di `ShareCard`/`ExportCard` masih hardcode `https://careerpack.org`
  (`DEFAULT_ORIGIN`) — ganti saat porting.

**Nav registration** — satu entri di `frontend/shared/lib/dashboardRegistry.ts`
(lihat CLAUDE.md § Routing). Route publik `app/[slug]/page.tsx` harus di **luar**
route group `(marketing)` dan `(dashboard)` supaya match di root.

**Header/CSP** — port juga blok `TEMPLATE_HEADERS` + mapping `headers()` di
`next.config.ts`. Tanpa itu template iframe kena `frame-ancestors 'none'` dan
halaman publik jadi kotak kosong.

**Manifest + binder wiring** — daftarkan `personalBrandingManifest` di
`shared/lib/sliceRegistry.ts` dan mount `<BrandingCapabilities />` di `Providers`.

**i18n:** Indonesia sepenuhnya — judul section ("Identitas & URL", "Tampilan",
"Tampilkan di hero", "Privasi & SEO"), error server ("Slug harus 3-30 karakter",
"HTML terlalu besar (…)"), sampai label tombol di hydrator ("Lihat semua (12)",
"Tersedia untuk direkrut").

**Common breakage after port:**

- **Halaman publik blank / "Template gagal dimuat"** — file di
  `public/personal-branding/templates/` belum ikut, atau CSP path-nya belum
  diport. Pesan errornya menampilkan URL yang gagal.
- **Iframe cuma setinggi hero** — `iframeHelpers.ts` tidak jalan (helper ini
  di-inject bahkan tanpa data); cek `injectBrandingIntoHtml` menemukan `</body>`.
- **Semua section kosong padahal data ada** — `has` di payload semuanya false:
  toggle `publicBioShow`/`publicSkillsShow`/`publicAutoToggles` memang default
  opt-in. Cek juga urutan fragment hydrator (`preamble` harus pertama; `d` dipakai
  fragment lain).
- **Soft 404** — jangan tambahkan `loading.tsx` di `app/[slug]/`.
- **Autosave loop error** — `canEnable` butuh slug valid; validator klien dan
  `convex/profile/slug.ts` harus punya daftar reserved yang sama.
- **HTML kustom tersimpan tapi tidak kelihatan** — `getBySlug` harus
  mengembalikan `html`, dan `PersonalBrandingPage` harus meneruskannya ke
  `TemplateLayout.templateHtml`; kalau putus, user diam-diam kembali ke template.

**Testing the port:**

1. `/dashboard/personal-branding` → banner "Belum dipublikasikan", tab
   "Edit halaman" aktif.
2. Isi slug + headline → nyalakan saklar publish → Simpan → reload → persist.
3. Buka `/<slug>` di incognito → template terender, `ProfileSummary` ada di bawah.
4. Matikan `allowIndex` → cek `<meta name="robots" content="noindex, nofollow">`.
5. Matikan halaman publik → `/<slug>` harus **404** (bukan 200 dengan pesan).
6. Ganti template di ThemeCard → preview kanan ikut berubah, iframe remount.
7. Tempel dokumen HTML di CustomHtmlCard (pakai `starter.html` sebagai basis) →
   Simpan → badge "HTML kustom" muncul, ThemeCard menampilkan peringatan
   ter-override, halaman publik memakai dokumen itu.
8. Hapus HTML kustom → balik ke template pilihan.
9. Kalau MCP ikut: `branding_data` → tulis HTML bermarker via `branding_set_html`
   → ubah satu entri CV → reload halaman publik, isinya ikut berubah tanpa
   menyentuh HTML lagi. Itu inti fiturnya; kalau tidak berubah, marker-nya salah
   atau payload tidak ter-inject.

Run `_porting-guide.md` §9 checklist.

---

## History

Sampai **2026-08-15** slice ini punya dua editor: "Otomatis" (halaman dirakit
dari data user) dan "Atur sendiri" — block builder dengan sembilan tipe blok,
container bersarang, preset gallery, editor style sendiri, dan renderer kedua.
Backend-nya ikut: `publicBlocks` + `publicMode` di schema, sanitiser per tipe
blok, dan `buildAutoBlocks` yang merakit `Block[]` di setiap pembacaan halaman
publik — output yang **tidak pernah dirender siapa pun**, karena template iframe
hidrasi dari `buildBrandingPayload`.

Semuanya dihapus dalam satu langkah, diganti satu field: `publicHtml`. Satu
dokumen HTML mencakup semua layout yang bisa diungkap block tree dan banyak yang
tidak, dan AI host menulis HTML lebih baik daripada yang bisa diekspresikan UI
itu. Yang tidak punya AI host tetap punya empat template.

Angka yang membuat keputusannya gampang: dari **prod export 2026-08-15, nol user
memakai mode custom**. Tidak ada halaman produksi yang berubah tampilannya saat
builder-nya dicabut, dan `app/[slug]/page.tsx` sekaligus kehilangan fallback
`ProfileView` legacy 340 baris yang hanya bisa tercapai oleh profil custom-mode
tanpa blok — kondisi yang sekarang mustahil.

Sisa jejaknya sengaja dibiarkan dan sudah didaftar di **Known gaps**:
`publicMode`/`publicBlocks`/`publicHeaderBg`/`publicStyle` di schema (read-only,
supaya row lama tetap lolos validasi), argumen `mode`/`blocks`/`style` yang
diterima-lalu-dibuang oleh `updateMyPublicProfile` (biar tab lama tidak error
tiap 1,5 detik), dan nama folder `blocks/` di dua sisi (path import dipertahankan).
Jangan cari builder-nya di git — memang sudah tidak ada.
