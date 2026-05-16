# Hero (Marketing Landing)

> **Portability tier:** S — slice-only.

## Tujuan

Halaman marketing publik untuk visitor belum login. Jual proposisi
(CV ATS, roadmap, checklist, AI agent) + CTA ke sign-up/login + tombol
"Coba Demo" yang membuat sesi anonim dengan data sample.

## Route & Entry

- URL: `/`
- Page file: `frontend/app/(marketing)/page.tsx` — redirect `/dashboard` jika sudah login.
- Slice: `frontend/slices/hero/`
- Komponen utama: `HeroSection.tsx`

## Struktur Slice

```
hero/
├─ index.ts                   export { HeroSection }
└─ components/HeroSection.tsx IntersectionObserver slide-up + Demo CTA
```

## Data Flow

Tidak ada query Convex langsung. Demo button delegasi ke `useAuth().loginAsDemo()` (Anonymous provider) → seed sample data lewat `seedForCurrentUser` → push to `/dashboard`.

## State Lokal

- `heroRef` — anchor untuk `IntersectionObserver` (`animate-on-scroll` children).
- `isDemoLoading` — guard CTA reentry while seeding.

## Dependensi

- `@/shared/components/brand/Logo` → `BrandMark`.
- `@/shared/hooks/useAuth` — `loginAsDemo`.
- `@/shared/lib/notify` — sonner wrapper.
- `@/shared/lib/routes` — `ROUTES.dashboard.home`.
- shadcn `button`, `badge`.
- `lucide-react` icons.
- CSS keyframes from `shared/styles/App.css` (`@keyframes slide-up`).

## Catatan Desain

- Hero langsung render walau auth state masih loading; redirect via `useEffect`. Trade-off: SEO/OG content-first, kemungkinan flash kecil.
- Demo session (`Anonymous` provider) seeds CV/checklist/roadmap contoh — useful untuk PWA install preview tanpa daftar dulu.

## Extending

- Section testimonial / pricing — append child di `HeroSection`.
- A/B test CTA via `useUIPrefs` atau query param.
- Native video player untuk preview produk (ganti `Play` icon dummy).

---

## Portabilitas

**Tier:** S

**Files (1 slice + 1 page):**

```
frontend/slices/hero/
frontend/app/(marketing)/page.tsx                       # invokes <HeroSection />
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
mkdir -p "$DST/frontend/slices" "$DST/frontend/app/(marketing)"
cp -r "$SRC/frontend/slices/hero" "$DST/frontend/slices/"
cp "$SRC/frontend/app/(marketing)/page.tsx" "$DST/frontend/app/(marketing)/"
```

**Shared deps:**
- `@/shared/components/brand/Logo` (BrandMark)
- `@/shared/hooks/useAuth` (only for demo CTA — replace with `() => router.push("/login")` if no demo flow desired)
- `@/shared/lib/notify`, `@/shared/lib/routes`

**Schema / npm / env:** none.

**Integration:** `<HeroSection onGetStarted={() => router.push("/login")} />`.

**i18n:** Indonesian feature list + CTA labels. Bulk edit on transplant.

**Common breakage:**
- Demo CTA throws → port `Anonymous` provider in `convex/auth.ts` + `loginAsDemo` in `useAuth`. Or just remove the Demo button.
- `ROUTES.dashboard.home` undefined → port `frontend/shared/lib/routes.ts` or hardcode `"/dashboard"`.

**Testing:**
1. Visit `/` while logged-out → hero renders, scroll triggers slide-up.
2. Click "Coba Demo" → toast "Sesi demo dimulai" → land on `/dashboard` with sample data.
3. Visit `/` while logged-in → auto-redirect `/dashboard`.

See `_porting-guide.md` for baseline stack.
