// One-shot codemod: flatten `frontend/src/{slices,shared}/` up one level to
// `frontend/{slices,shared}/`. Moves trees with `git mv` (history preserved),
// rewrites every relative import inside the moved files via path-math, and
// patches the 5 config files that hardcode the old prefix.
//
// Run:
//   node scripts/flatten-frontend-src.mjs            # apply
//   node scripts/flatten-frontend-src.mjs --dry-run  # preview, write nothing
//
// Refuses to run when:
//   - working tree is dirty (avoid mixing the move with unrelated edits)
//   - `frontend/slices/` or `frontend/shared/` already exists
//
// After it finishes successfully `frontend/src/` is removed and the gate
// `pnpm typecheck && pnpm lint && pnpm test && pnpm build` should pass.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const DRY = process.argv.includes("--dry-run");

const log = (...a) => console.log(...a);
const die = (msg) => {
  console.error(`flatten-frontend-src: ${msg}`);
  process.exit(1);
};

// 1. Preflight ---------------------------------------------------------------

if (!DRY) {
  const dirty = execSync("git status --porcelain", {
    cwd: repoRoot,
    encoding: "utf8",
  }).trim();
  // Allow the script itself to be staged/untracked but block everything else.
  const offending = dirty
    .split("\n")
    .filter((l) => l.trim() && !/scripts\/flatten-frontend-src\.mjs$/.test(l));
  if (offending.length) {
    die(
      "working tree is dirty — commit or stash first:\n" + offending.join("\n"),
    );
  }
}

const SRC_ROOT = path.join(repoRoot, "frontend/src");
const NEW_SLICES = path.join(repoRoot, "frontend/slices");
const NEW_SHARED = path.join(repoRoot, "frontend/shared");

if (!fs.existsSync(SRC_ROOT)) die("frontend/src/ not found");
if (fs.existsSync(NEW_SLICES)) die("frontend/slices/ already exists");
if (fs.existsSync(NEW_SHARED)) die("frontend/shared/ already exists");

// 2. Move trees with git ------------------------------------------------------

function gitMv(from, to) {
  log(
    `${DRY ? "[dry] " : ""}git mv ${path.relative(repoRoot, from)} ${path.relative(repoRoot, to)}`,
  );
  if (!DRY) {
    execSync(`git mv "${from}" "${to}"`, { cwd: repoRoot, stdio: "inherit" });
  }
}

gitMv(path.join(SRC_ROOT, "slices"), NEW_SLICES);
gitMv(path.join(SRC_ROOT, "shared"), NEW_SHARED);

// 3. Walk moved trees, rewrite relative imports -------------------------------

function* walk(dir) {
  // In dry-run mode the files are still at frontend/src/* because we skipped
  // the git mv. Re-route lookups so the rest of the script can pretend the
  // move happened.
  const realDir = DRY
    ? dir.replace(/\/frontend\/(slices|shared)/, "/frontend/src/$1")
    : dir;
  if (!fs.existsSync(realDir)) return;
  for (const entry of fs.readdirSync(realDir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

// Match `from "X"` / `from 'X'`, `import("X")` / `import('X')`,
// `require("X")` / `require('X')`. Captures the quote + specifier.
const IMPORT_RE =
  /(\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(["'])([^"']+)(["'])/g;

function rewriteSpecifier(spec, newFileAbs) {
  if (!spec.startsWith(".")) return spec; // alias / bare / node:
  const oldFileAbs = newFileAbs.replace("/frontend/", "/frontend/src/");
  const absTarget = path.resolve(path.dirname(oldFileAbs), spec);
  const srcRootSlash = SRC_ROOT + path.sep;
  let newAbsTarget;
  if (absTarget === SRC_ROOT || absTarget.startsWith(srcRootSlash)) {
    // target moves with us — strip the `src/` segment
    newAbsTarget =
      absTarget === SRC_ROOT
        ? path.join(repoRoot, "frontend")
        : path.join(
            repoRoot,
            "frontend",
            absTarget.slice(srcRootSlash.length),
          );
  } else {
    newAbsTarget = absTarget;
  }
  let newRel = path.relative(path.dirname(newFileAbs), newAbsTarget);
  if (!newRel.startsWith(".")) newRel = `./${newRel}`;
  return newRel.split(path.sep).join("/");
}

const stats = { files: 0, rewrites: 0 };

for (const tree of [NEW_SLICES, NEW_SHARED]) {
  for (const file of walk(tree)) {
    const readFrom = DRY
      ? file.replace(/\/frontend\/(slices|shared)/, "/frontend/src/$1")
      : file;
    const src = fs.readFileSync(readFrom, "utf8");
    let touched = 0;
    const out = src.replace(IMPORT_RE, (m, head, q1, spec, q2) => {
      const next = rewriteSpecifier(spec, file);
      if (next === spec) return m;
      touched += 1;
      return `${head}${q1}${next}${q2}`;
    });
    if (touched) {
      stats.files += 1;
      stats.rewrites += touched;
      if (!DRY) fs.writeFileSync(file, out);
    }
  }
}

log(
  `${DRY ? "[dry] " : ""}rewrote ${stats.rewrites} imports across ${stats.files} files`,
);

// 4. Patch configs ------------------------------------------------------------

function patchFile(rel, transform) {
  const abs = path.join(repoRoot, rel);
  const before = fs.readFileSync(abs, "utf8");
  const after = transform(before);
  if (before === after) {
    log(`  (skip) ${rel} — no change`);
    return;
  }
  log(`${DRY ? "[dry] " : ""}patch ${rel}`);
  if (!DRY) fs.writeFileSync(abs, after);
}

patchFile("frontend/tsconfig.json", (s) =>
  s.replace(`"@/*": ["./src/*"]`, `"@/*": ["./*"]`),
);

patchFile("frontend/tailwind.config.ts", (s) =>
  s.replace(
    `"./src/**/*.{js,ts,jsx,tsx,mdx}",`,
    `"./slices/**/*.{js,ts,jsx,tsx,mdx}",\n    "./shared/**/*.{js,ts,jsx,tsx,mdx}",`,
  ),
);

patchFile("frontend/components.json", (s) =>
  s.replace(
    `"css": "src/shared/styles/index.css"`,
    `"css": "shared/styles/index.css"`,
  ),
);

patchFile("frontend/eslint.config.mjs", (s) =>
  s.replace(
    "`src/slices/${slice}/**/*.{ts,tsx}`",
    "`slices/${slice}/**/*.{ts,tsx}`",
  ),
);

patchFile("vitest.config.ts", (s) =>
  s
    .replace(
      `"frontend/src/**/*.test.{ts,tsx}"`,
      `"frontend/{shared,slices}/**/*.test.{ts,tsx}"`,
    )
    .replace(
      `"frontend/src/shared/lib/**/*.ts"`,
      `"frontend/shared/lib/**/*.ts"`,
    ),
);

// 5. Remove now-empty frontend/src/ ------------------------------------------

if (!DRY) {
  const remaining = fs.readdirSync(SRC_ROOT);
  if (remaining.length === 0) {
    fs.rmdirSync(SRC_ROOT);
    log("removed empty frontend/src/");
  } else {
    die(
      `frontend/src/ not empty after move (contents: ${remaining.join(", ")}) — investigate`,
    );
  }
}

log(`${DRY ? "[dry] done (no changes written)" : "done"}`);
