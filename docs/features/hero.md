# Hero (Landing)

## Tujuan

Halaman marketing public untuk visitor belum login. Jual proposisi CareerPack (CV ATS, roadmap, checklist, AI) + CTA ke sign-up/login.

## Route & Entry

- URL: `/`
- Page file: `frontend/app/(marketing)/page.tsx` — redirect `/dashboard` kalau sudah login
- Slice: `frontend/src/slices/hero/`
- Komponen utama: `HeroSection.tsx`

## Struktur Slice

```
hero/
├─ index.ts                      export { HeroSection }
└─ components/HeroSection.tsx    IntersectionObserver untuk slide-up animation
```

## Data Flow

Tidak ada data Convex. Pure static marketing page. CTA `onGetStarted` di-wire dari page ke `router.push("/login")`.

## State Lokal

- `heroRef` — anchor untuk `IntersectionObserver` yang tambah class `animate-slide-up` ke `.animate-on-scroll` children.

## Dependensi

- `@/shared/components/Logo` → `BrandMark`
- `@/shared/components/ui/button`, `badge`
- `lucide-react` icons (ArrowRight, Sparkles, Target, TrendingUp, Users, CheckCircle)

## Catatan Desain

- Hero langsung render bahkan saat auth state masih loading — redirect terjadi di `useEffect`. Trade-off: flash cepat, tapi content-first untuk SEO / open-graph.
- Animasi scroll-triggered pakai CSS keyframes dari `shared/styles/App.css` (`@keyframes slide-up`).

## Extending

- Tambah section testimonial / pricing → append child section di `HeroSection`, tidak perlu route baru.
- A/B test CTA → hook variant via `useUIPrefs` atau query param.

---

## Portabilitas

**Tier:** S — slice-only, self-contained marketing landing component.

**Files (1):**

```
frontend/src/slices/hero/
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
mkdir -p "$DST/frontend/src/slices"
cp -r "$SRC/frontend/src/slices/hero" "$DST/frontend/src/slices/"
```

**Shared deps:** `@/shared/components/brand/Logo` (BrandMark). Copy or swap for your own logo component.

**Schema / npm / env:** none.

**Integration:** import `<HeroSection />` in target's `app/(marketing)/page.tsx`.

**i18n:** Indonesian copy (features list, CTA labels). Bulk edit when transplanting.

See `_porting-guide.md` for baseline stack requirements.
