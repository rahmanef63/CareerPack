# Convex Backend (Project-Specific)

Folder ini berisi schema dan functions Convex untuk CareerPack.

## Default Dev Mode (Cloud)

Dari root project:

```bash
pnpm run backend:dev
```

Untuk push sekali tanpa watch:

```bash
pnpm run backend:push
```

## Important Files

- `schema.ts` data model utama
- `auth.ts` konfigurasi auth provider
- `users.ts` data user/profile
- `seed.ts` starter seed data

## Notes

- Generated types ada di `convex/_generated/*` dan di-update oleh Convex CLI.
- Frontend membaca API dari `convex/_generated/api`.
