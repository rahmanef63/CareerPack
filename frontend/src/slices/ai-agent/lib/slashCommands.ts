"use client";

import type { AgentAction } from "./agentActions";
import { SLASH_SKILLS, SKILLS_BY_SLASH } from "@/shared/lib/sliceRegistry";

export interface SlashCommand {
  cmd: string;
  description: string;
  example: string;
}

/**
 * Legacy slash commands — kept for the popover so users with muscle
 * memory don't lose discoverability. Emit `nav.go` only; the actual
 * work happens on the destination page (where the slice's manifest
 * binders take over).
 *
 * Pre-2026-05-06 these emitted hand-crafted actions
 * (`cv.fillExperience`, `roadmap.generate`, `match.recommend`, …)
 * but those types had no listener — `apply()` toasted "diterapkan"
 * and silently did nothing. See `docs/progress/2026-05-06-ai-dispatch-audit.md`.
 */
const LEGACY_SLASH: SlashCommand[] = [
  { cmd: "/cv", description: "Buka CV Generator", example: "/cv" },
  { cmd: "/roadmap", description: "Buka Roadmap Karir", example: "/roadmap" },
  { cmd: "/review", description: "Buka CV untuk review", example: "/review" },
  { cmd: "/interview", description: "Buka simulasi wawancara", example: "/interview" },
  { cmd: "/match", description: "Buka pencocok lowongan", example: "/match" },
];

const LEGACY_NAV: Record<string, string> = {
  "/cv": "cv",
  "/roadmap": "roadmap",
  "/review": "cv",
  "/interview": "interview",
  "/match": "matcher",
};

/** Slash commands derived from the slice manifests. Each manifest skill
 *  with a `slashCommand` becomes an entry here automatically. */
const MANIFEST_SLASH: SlashCommand[] = SLASH_SKILLS.map((s) => {
  const argName = s.args ? Object.keys(s.args)[0] : null;
  const arg = argName && s.args ? s.args[argName] : null;
  return {
    cmd: s.slashCommand!,
    description: s.label,
    example: arg?.example
      ? `${s.slashCommand} ${arg.example}`
      : s.slashCommand!,
  };
});

export const SLASH_COMMANDS: SlashCommand[] = [
  ...LEGACY_SLASH,
  ...MANIFEST_SLASH,
];

export interface AgentReply {
  text: string;
  actions: AgentAction[];
}

/**
 * Slash-command-only action parser. Returns just the action array (no
 * synthesized text). Used by the live AI flow — natural-language reply
 * comes from the backend chat action, but slash commands still inject
 * structured actions client-side so users can approve them.
 *
 * Resolution order:
 * 1. Manifest skill match (e.g. `/phone 0812…` → settings.update-phone)
 *    — generic, derived from slice manifests at registry load.
 * 2. Legacy nav fallback (e.g. `/cv` → nav.go(cv)). Bare nav for the
 *    pre-manifest slash commands.
 */
export function extractSlashActions(userInput: string): AgentAction[] {
  const trimmed = userInput.trim();
  if (!trimmed.startsWith("/")) return [];

  const cmdMatch = trimmed.match(/^(\/[a-z][a-z0-9_-]*)\s*(.*)$/i);
  if (!cmdMatch) return [];
  const cmd = cmdMatch[1].toLowerCase();
  const rest = cmdMatch[2];

  // 1. Manifest-driven skill.
  const skill = SKILLS_BY_SLASH.get(cmd);
  if (skill && skill.argsFromText) {
    const payload = skill.argsFromText(rest);
    if (payload) {
      return [{ type: skill.id, payload } as unknown as AgentAction];
    }
  }

  // 2. Legacy nav fallback — `/cv`, `/roadmap`, etc. all jump to a page.
  const view = LEGACY_NAV[cmd];
  if (view) {
    return [{ type: "nav.go", payload: { view } }];
  }

  return [];
}

/**
 * Offline / gateway-failure fallback. Returns a friendly text reply
 * with NO actions — keeps the consoles' assistant message non-empty
 * when the backend chat action throws (rate-limit, network, AI key
 * misconfig). Slash commands have already produced their nav.go via
 * `extractSlashActions`; this fallback only handles the natural-text
 * case.
 */
export function runAgent(userInput: string): AgentReply {
  const lower = userInput.trim().toLowerCase();
  if (lower.startsWith("/")) {
    return {
      text: "Coba lagi setelah beberapa saat — perintah slash sudah saya terima.",
      actions: [],
    };
  }
  if (/(cv|resume)/.test(lower)) {
    return {
      text: "Buka CV Generator untuk menyusun atau mengedit CV Anda.",
      actions: [],
    };
  }
  if (/(wawancara|interview)/.test(lower)) {
    return {
      text: "Buka simulasi wawancara untuk mulai latihan Q&A.",
      actions: [],
    };
  }
  if (/(roadmap|skill|belajar)/.test(lower)) {
    return {
      text: "Buka Roadmap Karir — pilih template atau racik milestone sendiri.",
      actions: [],
    };
  }
  if (/(gaji|salary|penghasilan)/.test(lower)) {
    return {
      text: "Buka Kalkulator Gaji untuk simulasi pendapatan + budget.",
      actions: [],
    };
  }
  return {
    text:
      "Saya AI agent CareerPack. Coba slash command seperti **/cv**, **/roadmap**, **/match**, atau ketik pertanyaan Anda.",
    actions: [],
  };
}
