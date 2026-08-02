import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const SLICES = [
  "admin-panel",
  "ai-agent",
  "ai-settings",
  "auth",
  "calendar",
  "career-dashboard",
  "cv-generator",
  "dashboard-home",
  "database",
  "document-checklist",
  "financial-calculator",
  "help",
  "hero",
  "library",
  "matcher",
  "mock-interview",
  "networking",
  "notifications",
  "personal-branding",
  "portfolio",
  "settings",
  "skill-roadmap",
];

// Tiap slice tidak boleh import slice lain — barrel maupun internal.
// `types` barrel boleh sebagai public contract antar slice.
// admin-panel dikecualikan (meta-tool generator mock data).
//
// Bentuk rule-nya sengaja dipecah dua:
//   - `paths`  → exact match, buat blokir barrel telanjang `@/slices/x`.
//                Tidak bisa lewat `patterns`: `group` pakai semantik
//                gitignore, dan entry `@/slices/x` di situ mengecualikan
//                direktori BESERTA isinya, sehingga negasi `!.../types`
//                jadi mati (parent-nya sudah ter-exclude).
//   - `patterns` → glob dalam (`/**`) + varian relatif (`**/slices/x/**`),
//                dengan negasi yang me-whitelist balik `types` barrel.
const CROSS_SLICE_MSG =
  "Cross-slice import terlarang. Pakai @/shared atau public `types` barrel.";
const ISOLATED_SLICES = SLICES.filter((s) => s !== "admin-panel");
const sliceIsolation = ISOLATED_SLICES.map((slice) => {
  const others = ISOLATED_SLICES.filter((s) => s !== slice);
  return {
    files: [`slices/${slice}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: others.map((s) => ({
            name: `@/slices/${s}`,
            message: CROSS_SLICE_MSG,
          })),
          patterns: [
            {
              group: others.flatMap((s) => [
                `@/slices/${s}/**`,
                `**/slices/${s}/**`,
                `!@/slices/${s}/types`,
                `!@/slices/${s}/types/**`,
                `!**/slices/${s}/types`,
                `!**/slices/${s}/types/**`,
              ]),
              message: CROSS_SLICE_MSG,
            },
          ],
        },
      ],
    },
  };
});

const eslintConfig = [
  {
    ignores: [".next/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  ...sliceIsolation,
];

export default eslintConfig;
