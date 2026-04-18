# CareerPack Docs

Peta lengkap context project. Setiap dokumen self-contained — bisa dibaca terpisah.

## Entry Points

| Dokumen | Kapan dibaca |
|---|---|
| [architecture.md](./architecture.md) | Paham layout repo, routing Next.js, pola slice |
| [backend.md](./backend.md) | Paham schema Convex + semua query/mutation/action |
| [auth.md](./auth.md) | Paham flow login / sign-up / guard |
| [development.md](./development.md) | Setup lokal, env, scripts, testing, konvensi |
| [deployment.md](./deployment.md) | Deploy Convex self-hosted + frontend (Vercel / Dokploy) |
| [features/README.md](./features/README.md) | Index per-fitur (12 slice) |

## Quick Map

```
CareerPack/
├─ frontend/          Next.js 15 App Router (slice-based)
│  ├─ app/            Route tree — layouts + pages (thin, delegasi ke slices)
│  └─ src/
│     ├─ shared/      Cross-cutting: providers, hooks, UI kit, containers
│     └─ slices/      Feature slice (self-contained, barrel via index.ts)
├─ convex/            Backend — schema + query/mutation/action
│  └─ _lib/           Server helpers (auth guard, rate limit, sanitize, env)
├─ backend/convex-self-hosted/   Opsional: Docker Compose stack
├─ docs/              ← you are here
└─ .github/workflows/ CI (typecheck/lint/test/build) + Convex auto-deploy
```

## Design Prinsip

1. **Slice-based architecture** — setiap fitur = satu folder di `src/slices/<name>/`. Komponen, hooks, types, constants hidup berdampingan. Cross-slice coupling dilarang — pakai `@/shared/*` sebagai jembatan.
2. **App Router + catch-all dashboard** — semua dashboard view di-resolve via `/dashboard/[[...slug]]/page.tsx` yang memakai `DASHBOARD_VIEWS` registry (SSOT di `src/shared/lib/dashboardRoutes.tsx`). Tiap view di-lazy via `next/dynamic` — code-splitting otomatis per slice.
3. **Convex = SSOT data** — tidak ada REST/tRPC layer. Frontend pakai `useQuery`/`useMutation` langsung. Auth pakai `@convex-dev/auth`.
4. **Typecheck ketat** — `strict: true`, ESLint `--max-warnings=0`, `tsc --noEmit` untuk frontend + Convex. CI gagal kalau ada warning.
5. **Env lazy** — `src/shared/lib/env.ts` baca env via getter, bukan time module load, supaya Next layout bundle tidak crash sebelum ErrorBoundary siap.
