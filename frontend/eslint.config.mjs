import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const SLICES = [
  "admin",
  "ai-agent",
  "auth",
  "calendar",
  "career-dashboard",
  "cv-generator",
  "dashboard-home",
  "document-checklist",
  "financial-calculator",
  "hero",
  "mock-interview",
  "settings",
  "skill-roadmap",
];

// Tiap slice tidak boleh import internal slice lain (components/hooks/utils).
// `types` barrel boleh sebagai public contract antar slice.
// Admin dikecualikan (meta-tool generator mock data).
const ISOLATED_SLICES = SLICES.filter((s) => s !== "admin");
const sliceIsolation = ISOLATED_SLICES.map((slice) => ({
  files: [`src/slices/${slice}/**/*.{ts,tsx}`],
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
