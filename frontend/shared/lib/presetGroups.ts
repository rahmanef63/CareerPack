/** Curated grouping of the tweakcn preset registry by design mood.
 *  Presets not listed fall into "Other" dynamically.
 *
 *  Gimmicky names (Doom 64, Cyberpunk, Neo Brutalism, Retro Arcade,
 *  Bubblegum, Candyland, Pastel Dreams) are excluded — CareerPack is a
 *  career-tool, not a designer playground. Decision fatigue hurts
 *  conversion. Curated list shows ~20 professional themes grouped by
 *  mood. Hidden presets stay in the registry (data untouched) so users
 *  with `?theme=doom-64` deep links still work. */

export const HIDDEN_PRESETS: ReadonlySet<string> = new Set([
  "neo-brutalism",
  "doom-64",
  "retro-arcade",
  "cyberpunk",
  "bubblegum",
  "candyland",
  "pastel-dreams",
]);

export const PRESET_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  presets: ReadonlyArray<string>;
}> = [
  {
    id: "refined",
    label: "Profesional",
    presets: [
      "modern-minimal",
      "vercel",
      "claude",
      "supabase",
      "mono",
      "graphite",
      "clean-slate",
      "amber-minimal",
    ],
  },
  {
    id: "bold",
    label: "Bold",
    presets: ["t3-chat", "bold-tech", "twitter", "tangerine", "quantum-rose"],
  },
  {
    id: "warm",
    label: "Hangat",
    presets: [
      "mocha-mousse",
      "solar-dusk",
      "caffeine",
      "vintage-paper",
      "sunset-horizon",
    ],
  },
  {
    id: "artistic",
    label: "Artistik",
    presets: [
      "claymorphism",
      "kodama-grove",
      "nature",
      "northern-lights",
    ],
  },
  {
    id: "moody",
    label: "Gelap",
    presets: [
      "cosmic-night",
      "perpetuity",
      "catppuccin",
      "elegant-luxury",
      "ocean-breeze",
      "midnight-bloom",
      "starry-night",
    ],
  },
];

export interface PresetMeta {
  name: string;
  title: string;
}

export interface PresetGroup<T extends PresetMeta = PresetMeta> {
  id: string;
  label: string;
  items: T[];
}

export function groupPresets<T extends PresetMeta>(all: T[]): PresetGroup<T>[] {
  // Drop hidden presets entirely from picker. Registry data preserved
  // (deep-link `?theme=doom-64` still resolves via the unfiltered registry).
  const visible = all.filter((p) => !HIDDEN_PRESETS.has(p.name));
  const byName = new Map(visible.map((p) => [p.name, p]));
  const seen = new Set<string>();
  const grouped: PresetGroup<T>[] = PRESET_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.presets
      .map((n) => byName.get(n))
      .filter((x): x is T => {
        if (!x) return false;
        seen.add(x.name);
        return true;
      }),
  })).filter((g) => g.items.length > 0);

  const rest = visible.filter((p) => !seen.has(p.name));
  if (rest.length) {
    grouped.push({ id: "other", label: "Lainnya", items: rest });
  }
  return grouped;
}
