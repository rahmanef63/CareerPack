// One-shot extractor: turns the monolithic
// `convex/_seeds/roadmapTemplates.ts` into per-skill JSON files,
// grouped by `domain`, with auto-generated index.ts aggregators.
//
// Run via Node 22+ which understands `--experimental-strip-types`:
//   node --experimental-strip-types scripts/split-roadmap-templates.mjs
//
// Re-runnable: it overwrites JSONs and index.ts files. After running,
// the original monolithic .ts file should be deleted manually so the
// folder takes its place at the same import path.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const srcTs = path.join(repoRoot, "convex/_seeds/roadmapTemplates.ts");
const outDir = path.join(repoRoot, "convex/_seeds/roadmapTemplates");

const { defaultRoadmapTemplates } = await import(
  // The .ts loader handles strip-types under Node 22's flag.
  pathToFileUrl(srcTs)
);

if (!Array.isArray(defaultRoadmapTemplates)) {
  console.error("defaultRoadmapTemplates is not an array");
  process.exit(1);
}

console.log(`extracted ${defaultRoadmapTemplates.length} templates`);

fs.mkdirSync(outDir, { recursive: true });

// --- types.ts (extracted from the monolith) -----------------------------
fs.writeFileSync(
  path.join(outDir, "types.ts"),
  `export interface RoadmapTemplateResource {
  id: string;
  title: string;
  type: string;
  url: string;
  free: boolean;
}

export interface RoadmapTemplateNode {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  parentId?: string;
  category?: string;
  resources: RoadmapTemplateResource[];
}

export interface RoadmapTemplateManifest {
  version?: string;
  license?: string;
  language?: string;
  outcomes?: string[];
  prerequisites?: string[];
  targetAudience?: string;
}

export interface RoadmapTemplateConfig {
  xpPerHour?: number;
  theme?: string;
  questFlavor?: string;
}

export interface RoadmapTemplateData {
  title: string;
  slug: string;
  domain: string;
  icon: string;
  color: string;
  description: string;
  tags: string[];
  order: number;
  isPublic: boolean;
  isSystem: boolean;
  nodes: RoadmapTemplateNode[];
  manifest?: RoadmapTemplateManifest;
  config?: RoadmapTemplateConfig;
}
`,
);

// --- group preserving original array order ------------------------------
const byDomain = new Map();
const domainOrder = [];
for (const t of defaultRoadmapTemplates) {
  if (!byDomain.has(t.domain)) {
    byDomain.set(t.domain, []);
    domainOrder.push(t.domain);
  }
  byDomain.get(t.domain).push(t);
}

// --- per-domain folder + index.ts ---------------------------------------
const slugToIdent = (s) => s.replace(/[^a-zA-Z0-9_]/g, "_");

for (const domain of domainOrder) {
  const list = byDomain.get(domain);
  const dir = path.join(outDir, domain);
  fs.mkdirSync(dir, { recursive: true });

  for (const t of list) {
    fs.writeFileSync(
      path.join(dir, `${t.slug}.json`),
      JSON.stringify(t, null, 2) + "\n",
    );
  }

  const lines = [
    `/**`,
    ` * Roadmap templates — domain "${domain}".`,
    ` *`,
    ` * Edit individual JSON files directly. This index lists the order`,
    ` * they appear in the seed catalog. Add a new skill by creating`,
    ` * <slug>.json then adding the import + array entry below.`,
    ` */`,
    `import type { RoadmapTemplateData } from "../types";`,
    ``,
    ...list.map((t) => `import ${slugToIdent(t.slug)} from "./${t.slug}.json";`),
    ``,
    `export const ${slugToIdent(domain)}Templates: ReadonlyArray<RoadmapTemplateData> = [`,
    ...list.map((t) => `  ${slugToIdent(t.slug)} as RoadmapTemplateData,`),
    `];`,
    ``,
  ];
  fs.writeFileSync(path.join(dir, "index.ts"), lines.join("\n"));
}

// --- root index.ts ------------------------------------------------------
const rootLines = [
  `/**`,
  ` * Default seed catalog for roadmap templates.`,
  ` *`,
  ` * The catalog is split per skill (one JSON file each, grouped by`,
  ` * domain) so individual skills can be edited or replaced without`,
  ` * touching the others. Per-domain index.ts files export an ordered`,
  ` * list; this root concatenates them in the canonical domain order.`,
  ` *`,
  ` * To add a new skill:`,
  ` *   1. Create \`<domain>/<slug>.json\` (copy an existing one as a template).`,
  ` *   2. Add the import + array entry to \`<domain>/index.ts\`.`,
  ` * To add a new domain:`,
  ` *   1. mkdir <domain>/, create at least one <slug>.json + index.ts.`,
  ` *   2. Add the import + spread to this file.`,
  ` */`,
  `export type {`,
  `  RoadmapTemplateData,`,
  `  RoadmapTemplateNode,`,
  `  RoadmapTemplateResource,`,
  `  RoadmapTemplateManifest,`,
  `  RoadmapTemplateConfig,`,
  `} from "./types";`,
  `import type { RoadmapTemplateData } from "./types";`,
  ``,
  ...domainOrder.map(
    (d) => `import { ${slugToIdent(d)}Templates } from "./${d}";`,
  ),
  ``,
  `export const defaultRoadmapTemplates: ReadonlyArray<RoadmapTemplateData> = [`,
  ...domainOrder.map((d) => `  ...${slugToIdent(d)}Templates,`),
  `];`,
  ``,
];
fs.writeFileSync(path.join(outDir, "index.ts"), rootLines.join("\n"));

// --- summary ------------------------------------------------------------
console.log(`wrote ${outDir}/`);
for (const domain of domainOrder) {
  console.log(`  ${domain}/  (${byDomain.get(domain).length} skills)`);
}

function pathToFileUrl(p) {
  // Cross-platform absolute path -> file:// URL for `await import`.
  return new URL(`file://${path.resolve(p)}`).href;
}
