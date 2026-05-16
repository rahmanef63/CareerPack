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

// Tiap slice tidak boleh import internal slice lain (components/hooks/utils).
// `types` barrel boleh sebagai public contract antar slice.
// admin-panel dikecualikan (meta-tool generator mock data).
const ISOLATED_SLICES = SLICES.filter((s) => s !== "admin-panel");
const sliceIsolation = ISOLATED_SLICES.map((slice) => ({
  files: [`slices/${slice}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ISOLATED_SLICES.filter((s) => s !== slice).flatMap((s) => [
              `@/slices/${s}/components/*`,
              `@/slices/${s}/hooks/*`,
              `@/slices/${s}/utils/*`,
            ]),
            message:
              "Cross-slice internal import terlarang. Pakai @/shared atau public `types` barrel.",
          },
        ],
      },
    ],
  },
}));

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
