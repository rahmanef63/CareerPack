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
