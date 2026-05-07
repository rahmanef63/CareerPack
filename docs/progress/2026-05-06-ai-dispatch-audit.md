# AI dispatch consolidation — audit + plan

Date: 2026-05-06.
Scope: backlog item #1 — Konsolidasi 3 dispatch path AI → satu jalur manifest.

## Three current surfaces

### 1. Manifest binders (modern, SSOT)

- `frontend/src/slices/<slice>/components/<slice>Capabilities.tsx`
- 12 productive slices have a `*Capabilities` component.
- Each subscribes to manifest skill IDs (`cv.create`, `calendar.create-event`,
  `matcher.add-job`, …) via `aiActionBus.subscribe()`.
- Calls real Convex mutations / actions; surfaces success / error via `notify`.
- All mounted once in `frontend/src/shared/providers/Providers.tsx`.
- Source of action: AI tool calls from `convex/ai/actions.ts` →
  `ApproveActionCard` → user approves → bus publish.

### 2. Slash command parser (`extractSlashActions`)

`frontend/src/slices/ai-agent/lib/slashCommands.ts` (243 lines).

- **Manifest path** (lines 64-75): matches user input against
  `SKILLS_BY_SLASH`, builds a `BusAction` via `skill.argsFromText()`.
  Returns array containing the manifest skill action. Clean.
- **Legacy path** (lines 81-243, `runAgent()`): hardcoded `if/else` for
  `/cv`, `/roadmap`, `/review`, `/interview`, `/match`. Emits
  hand-crafted action objects with legacy types
  (`cv.fillExperience`, `roadmap.generate`, `match.recommend`, …).

`SLASH_COMMANDS` exported list = `LEGACY_SLASH` (5 entries) + manifest-derived
slashes. Used by Composer popover.

### 3. Legacy CV bus listeners (`useCVAIActions`)

`frontend/src/slices/cv-generator/hooks/useCVAIActions.ts` (66 lines).

- Subscribes to legacy types
  `cv.fillExperience` / `cv.improveSummary` / `cv.addSkills` / `cv.setFormat`.
- Mutates **local React state** of `CVGenerator` — no backend call.
- Only consumer of those legacy action types.

## Symptom audit

| Legacy slash | Action type emitted | Listener | Effect |
|---|---|---|---|
| `/cv "desc"` | `cv.fillExperience` + `cv.improveSummary` | useCVAIActions | Mutates local state only — refresh = data lost |
| `/roadmap "path"` | `roadmap.generate` + `nav.go` | (none) + AIAgentConsole | Zombie action — apply button checkmarks but does nothing; nav works |
| `/review` | `nav.go` | AIAgentConsole | Works (nav-only) |
| `/interview "topic"` | `interview.startSession` + `nav.go` | (none) + AIAgentConsole | Zombie + nav |
| `/match` | `match.recommend` + `nav.go` (implicit) | (none) | Pure zombie |

ApproveActionCard renders these zombies as if they did something —
`apply()` publishes to bus, `notify.success("X diterapkan")`, but no
subscriber processes them. UX bug masked by toast.

## Migration plan — phases

### Phase A (≈ 2 hours, bounded, low risk) — kill the zombies

Replace each legacy slash output with `nav.go` to the right page:

```ts
// /cv "desc"  →  nav.go(cv) ; user types in CV form, AI no longer fakes experience
// /roadmap PATH  →  nav.go(roadmap) ; user uses RoadmapBrowser to start template
// /review        →  nav.go(cv)
// /interview T   →  nav.go(interview)
// /match         →  nav.go(matcher)
```

Then:
1. Delete `frontend/src/slices/cv-generator/hooks/useCVAIActions.ts`
2. Remove its call from `CVGenerator.tsx`
3. Remove legacy types from `frontend/src/shared/types/agent.ts`
   (`cv.fillExperience` / `cv.improveSummary` / `cv.addSkills` /
   `cv.setFormat` / `roadmap.generate` / `interview.startSession` /
   `match.recommend`). Keep `nav.go`.
4. Remove their `ACTION_META` entries.
5. Drop matching `case` arms from `ApproveActionCard` `ActionPreview()`.

Risk: existing user with `/cv` muscle-memory expects fake experience to
appear. Trade-off acceptable — fake data wasn't persisted anyway.

Net: -4 files / +0 files / ~-200 LoC. One dispatch path (manifest) remains.

### Phase B (≈ 4-6 hours, behavioural) — manifest-power the legacy slashes

If we want the legacy slashes to do MORE than nav, wire them to
real manifest skills:

| Slash | Manifest skill | Existing? |
|---|---|---|
| `/cv DESC` | `cv.create` + `cv.add-experience` | ✅ both exist |
| `/roadmap SLUG` | `roadmap.start-from-template` | ✅ exists |
| `/match` | `matcher.list-jobs` | ✅ exists (query) |
| `/interview TYPE` | (need `interview.start` mutation) | ❌ doesn't exist yet |
| `/review` | (need `cv.score` action) | ❌ doesn't exist yet |

For B, parse user text into the manifest skill's `argsFromText` if
present, else fall back to nav. Then drop `runAgent` entirely.

Phase B requires 2 new manifest skills (`interview.start`, `cv.score`)
which are real backend changes — out of scope for the consolidation
itself.

### Phase C (≈ 1 hour) — AI tool catalog cleanup

`convex/_seeds/aiDefaults.ts` may still seed legacy tool entries
(`cv.fillExperience` etc.) for the `aiTools` admin catalog. Check +
remove. AI prompts shouldn't advertise tools that have no handler.

## Recommended order

1. **Phase A first**, ship as small commit (no behaviour regressions:
   nav-only is what the zombies effectively did).
2. **Phase C** sweep (fast, eliminates dead tool catalog rows).
3. **Phase B** when there's appetite for new manifest skills.

## 2026-05-06 update — Phase A + C landed, Phase B deferred

Both Phase A and Phase C shipped the same day:
- Phase A — 7 zombie types removed (`refactor(ai): polish sprint`).
- Phase C — `DEFAULT_AI_TOOLS` rebuilt to reference only live manifest
  skill IDs + `nav.go`.

**Phase B reconsidered + intentionally deferred.** Adding `slashCommand`
to existing manifest skills (`cv.create`, `matcher.list-jobs`,
`roadmap.start-from-template`) would create a dual-dispatch problem:

1. Client `extractSlashActions("/cv DESC")` — emits manifest action
   immediately for ApproveActionCard.
2. Same message goes to backend chat action — backend swaps system
   prompt to `cv-builder` (per `aiSkills` slashCommand mapping), AI
   responds with its own tool_calls (also `cv.create` + likely
   `cv.add-experience`).
3. Net result: 2-3 cards from one user input. Confusing UX.

The legacy slashes currently emit `nav.go` only (instant feedback) and
the AI's tool_call output handles the structured action (delayed but
contextual). That's the right separation. Phase B is closed without
changes.

If a future skill is genuinely standalone (no AI tool_call counterpart),
adding `slashCommand` to its manifest entry is fine — pattern lives in
`settings/manifest.ts` with `/phone`, `/target`, `/lokasi`, `/bio`.

## Done criteria — verified 2026-05-07

- [x] Only `aiActionBus` subscribers are `*Capabilities` components +
      `AIAgentConsole`'s `nav.go` listener. (Verified — 18
      `subscribe()` callsites, all in `*Capabilities` or AIAgentConsole.)
- [x] `runAgent()` reduced to pass-through (text-only fallback, 130
      LoC down from 243; no legacy action emission).
- [x] No `subscribe("cv.fillExperience"…)` anywhere. (Type union no
      longer contains the legacy arms; useCVAIActions deleted.)
- [x] `agent.ts` action union shrunk to `nav.go` only — manifest skill
      IDs flow via `BusAction` carrying `skill.id`.
- [x] `aiTools` seed (`DEFAULT_AI_TOOLS`) references only live skill
      IDs + `nav.go` (1+64 entries; no zombie tools).

## Files touched

Phase A:
- `frontend/src/slices/ai-agent/lib/slashCommands.ts` — strip ~120 lines
- `frontend/src/slices/cv-generator/hooks/useCVAIActions.ts` — DELETE
- `frontend/src/slices/cv-generator/components/CVGenerator.tsx` — remove import + call
- `frontend/src/shared/types/agent.ts` — shrink discriminated union
- `frontend/src/slices/ai-agent/components/ApproveActionCard.tsx` —
  drop `case` arms

Phase B (later):
- `convex/mockInterview/mutations.ts` — add `start` mutation
- `convex/cv/actions.ts` — add `score` action
- `frontend/src/slices/mock-interview/manifest.ts` — register
- `frontend/src/slices/cv-generator/manifest.ts` — register

Phase C:
- `convex/_seeds/aiDefaults.ts` — drop legacy tool defs
