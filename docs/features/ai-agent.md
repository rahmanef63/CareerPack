# AI Agent (Console + Manifest Framework)

> **Portability tier:** XL — slice + manifest plumbing + capability binders + chat persistence + agentic backend action.

## Tujuan

Side-panel AI global — chat + slash commands + OpenAI tool-calling
yang bisa trigger aksi cross-slice (CRUD CV, lamaran, kontak,
kalender, profil, dll). Aksi mutasi WAJIB approval eksplisit lewat
`<ApproveActionCard>`; aksi `kind: "query"` dijalankan inline di
server lalu hasilnya di-feed-back ke LLM untuk multi-hop reasoning.

## Route & Entry

- Tidak punya URL sendiri — di-mount sebagai Sheet side-panel.
- Entry: AI FAB (mobile) atau tombol di `SiteHeader` (desktop), dibuka dari `ResponsiveContainer`.
- Slice: `frontend/src/slices/ai-agent/`.

## Struktur Slice

```
ai-agent/
├─ index.ts                                     export AIAgentConsole, ApproveActionCard, runAgent, SLASH_COMMANDS
├─ components/
│  ├─ AIAgentConsole.tsx                        Sheet + chat UI + slash popover
│  ├─ ApproveActionCard.tsx                     Per-action approve/reject card
│  └─ ai-agent-console/
│     ├─ AIProgressDisplay.tsx                  Step-timeline (resolve_config → finalize)
│     ├─ Composer.tsx                           Input + slash popover
│     ├─ HistoryRail.tsx                        Session list + delete
│     ├─ MessageBubble.tsx                      User / assistant rendering
│     └─ ThinkingProgress.tsx                   Live "thinking" indicator
├─ hooks/
│  └─ useSessionSync.ts                         Mirror local Message[] ↔ Convex chatConversations
├─ lib/
│  ├─ agentActions.ts                           Re-export @/shared/types/agent
│  ├─ slashCommands.ts                          LEGACY_SLASH ∪ MANIFEST_SLASH; runAgent(input) heuristic
│  └─ stepIcons.ts                              Lucide icon map per step type
└─ types/
   ├─ console.ts                                Message, Session shapes
   └─ progress.ts                               Step / Progress shapes
```

## Manifest Framework — the new plumbing

The console is just the UI shell. The plumbing that turns slices into
AI-callable surfaces is split across three layers:

### 1. Per-slice manifest (`SliceManifest`)

Source: `frontend/src/shared/types/sliceManifest.ts`. Each slice that
opts into AI / nav / routing exports a `manifest.ts` declaring its
`id`, `route`, `nav` placement, and a `skills: SliceSkill[]` array.
`SliceSkill.kind` is one of:

- `"query"` — read-only fetch; server-side handler runs inline, result
  fed back to the LLM.
- `"mutation"` — writes data; returned to client unexecuted, rendered
  as `ApproveActionCard`, applied by the slice's capability binder
  after user approve.
- `"compose"` — creates a new entity (CV, roadmap node). Same approval
  flow as mutation.
- `"navigate"` — pure router push; auto-applied (no approval needed).

Each skill optionally declares `slashCommand`, `args` (JSON-schema-lite
used to brief the LLM and render the approval form), and `argsFromText`
for client-side slash parsing.

### 2. Central registry (`sliceRegistry.ts`)

Source: `frontend/src/shared/lib/sliceRegistry.ts`. Imports each
slice's manifest and exposes derived collections:

| Export | Purpose |
|---|---|
| `SLICE_REGISTRY` | Ordered manifest array — single source of truth |
| `NAV_PRIMARY` / `NAV_MORE` | Nav components read these instead of `navConfig.ts` |
| `ALL_SKILLS` | Flattened skill list (sent to chat action as `availableSkills`) |
| `SKILLS_BY_ID` | O(1) lookup for `ApproveActionCard` |
| `SKILLS_BY_SLASH` | O(1) lookup for slash popover |
| `SLASH_SKILLS` | Sorted slash-only subset |
| `llmSkillBrief()` | Compact text catalog for system prompt (truncates description to 120 chars) |

Adding a slice = ONE import + one entry in `SLICE_REGISTRY`. Nav, AI
catalog, and slash popover all update automatically.

### 3. Capability binders (`Providers.tsx`)

Source: `frontend/src/shared/providers/Providers.tsx`. Each
`<XxxCapabilities>` component subscribes to the `aiActionBus` for the
slice's skill IDs and runs each one via the slice's local hooks
(useMutation, useRouter). Mounting them all in `Providers.tsx` keeps
the lifecycle bound to the auth-aware tree without forcing a route
match — bus subscriptions live as long as the user session.

Currently mounted: `SettingsCapabilities`, `CalendarCapabilities`,
`CareerDashboardCapabilities`, `NetworkingCapabilities`,
`DocumentChecklistCapabilities`, `CVCapabilities`. Add a new binder by
exporting `<XxxCapabilities />` from the slice's `index.ts` and
inserting one JSX line in `Providers.tsx`.

### 4. Action bus (`aiActionBus.ts`)

Source: `frontend/src/shared/lib/aiActionBus.ts`. `publish()` /
`subscribe()` keyed by `action.type`. Two overloads:

- Legacy: type-narrowed `AgentActionType` literals (`"nav.go"`,
  `"cv.fillExperience"`) for the discriminated `AgentAction` union.
- Manifest: arbitrary skill id (`"settings.update-phone"`,
  `"calendar.create-event"`) → generic `BusAction<P>`.

`"*"` subscribes to all events. Console emits onto bus after user
approves an action; binders consume.

## Backend — `convex/ai/`

```
convex/ai/
├─ schema.ts            chatConversations, aiSettings, globalAISettings,
│                       aiUserModelOverrides, aiSkills, aiTools, rateLimitEvents
├─ actions.ts           generateCareerAdvice, generateInterviewQuestions,
│                       evaluateInterviewAnswer, chat, listOpenRouterModels,
│                       testConnection, parseImportText
├─ queries.ts           listAIProviders, getMyAISettings, listChatSessions,
│                       getChatSession, listAISkills, listAITools,
│                       _getAISettingsForUser, _getGlobalAISettings,
│                       _getUserModelOverride, _getEnabledSkillBySlash,
│                       _getEnabledTools, _getChatHistoryForUser
├─ mutations.ts         setMyAISettings, toggleAIEnabled, clearMyAISettings,
│                       setGlobalAISettings, clearGlobalAISettings,
│                       setUserAIModelOverride, clearUserAIModelOverride,
│                       seedAISkills, upsertAISkill, toggleAISkill, deleteAISkill,
│                       seedAITools, upsertAITool, toggleAITool, deleteAITool,
│                       upsertChatSession, deleteChatSession, deleteAllChatSessions,
│                       _checkAIQuota
└─ skillHandlers.ts     SKILL_HANDLERS: Record<skillId, (ctx, args) ⇒ result>
```

### `chat` action — agentic loop (key file)

`convex/ai/actions.ts → chat`. Per turn:

1. **`requireQuota`** — token-bucket 10/min + 100/day per user.
2. **Resolve AI config** — per-user → admin global → env defaults.
3. **Resolve skill override** — admin-curated `aiSkills` row matching
   slash command (e.g. `/cv`) overrides system prompt.
4. **Load context** — `_getCompactUserContext` returns only populated
   fields; absent data invisible to the LLM (anti-halu).
5. **Server-side history merge** — when client passes `sessionId`,
   action loads canonical history from `chatConversations` via
   `_getChatHistoryForUser` and merges with the latest client message.
   Resolves the race where local React state hadn't hydrated.
6. **Build OpenAI tools** — convert `availableSkills` (from frontend
   `ALL_SKILLS`) to OpenAI `function`-tool schema. Tool names use
   underscores (OpenAI rejects dots) — reverse-mapped back to
   `skill.id` when parsing tool_calls.
7. **Multi-hop loop (MAX_HOPS = 4)** — each hop = one LLM call:
   - No tool_calls → final answer, exit.
   - `kind: "query"` tool_calls → run handler from
     `SKILL_HANDLERS`, push `role: "tool"` result into conversation,
     loop.
   - `kind: "mutation" | "compose" | "navigate"` tool_calls → collect
     into `clientToolCalls`, push stub "queued_for_user_approval"
     result, exit on next iteration.
8. **Step recording** — every stage emits one entry into the `progress`
   timeline (`resolve_config`, `resolve_skill`, `load_context`,
   `inference`, `finalize`) so the client can render
   `<AIProgressDisplay>` transparently.

Returns `{ text, toolCalls, progress }`.

### `skillHandlers.ts` — server-side query executor

`SKILL_HANDLERS: Record<string, (ctx, args) ⇒ Promise<unknown>>`.
Currently registered query skills:

- `calendar.list-events`, `applications.list`, `contacts.list`,
  `documents.list`, `cv.list`.

Each trims response to fields the AI actually needs (drops
`_creationTime`, `userId`, etc.) and caps to 50–100 rows so the
context budget stays bounded. Adding a new query skill = declare it in
the slice manifest with `kind: "query"` + add an entry here.

### Chat persistence (`upsertChatSession`)

`convex/ai/mutations.ts`. Caps: 4000 chars/msg, 200 msgs/session, 50
sessions/user (FIFO eviction), 10 actions/msg. Action `type` validated
against `^[a-z][a-z0-9]*(?:\.[a-zA-Z0-9-]+)+$` (manifest skill id
shape). Status whitelist:
`pending|approved|rejected|executed|failed`.

### Seed catalog (`convex/_seeds/aiDefaults.ts`)

`DEFAULT_AI_SKILLS` (5 prompt-template entries: cv-fill,
roadmap-generate, cv-review, interview-start, job-match) and
`DEFAULT_AI_TOOLS` (~30 entries spanning calendar, applications,
contacts, documents, cv, settings, navigation). Loaded into
`aiSkills` / `aiTools` via the admin-only mutations
`seedAISkills` / `seedAITools` — idempotent upsert: rows with
`isSeed: true` get refreshed; admin-edited rows (`isSeed: false`) are
left alone. Seed entries cannot be deleted (only disabled).

## Data Flow

| Operasi | Convex | Catatan |
|---|---|---|
| List sessions | `api.ai.queries.listChatSessions` | Optional auth (returns `[]` if anon) |
| Load session | `api.ai.queries.getChatSession` | Owner-scoped |
| Mirror session | `api.ai.mutations.upsertChatSession` | Caps + action validation |
| Delete session | `api.ai.mutations.deleteChatSession` / `deleteAllChatSessions` | — |
| Chat turn | `api.ai.actions.chat` | Multi-hop tool-calling, returns `{ text, toolCalls, progress }` |
| AI settings (user) | `api.ai.queries.getMyAISettings` / `mutations.setMyAISettings` | Optional per-user provider override |
| AI settings (admin) | `api.ai.queries.getGlobalAISettings` / `mutations.setGlobalAISettings` | Falls back when user config absent |
| Skills (admin) | `api.ai.queries.listAISkills` / `mutations.{seedAISkills,upsertAISkill,toggleAISkill,deleteAISkill}` | Slash-prompt overrides |
| Tools (admin) | `api.ai.queries.listAITools` / `mutations.{seedAITools,upsertAITool,toggleAITool,deleteAITool}` | Action-type catalog |
| Free-form Q&A | `api.ai.actions.generateCareerAdvice` | Single-shot, no tools |
| Interview gen | `api.ai.actions.generateInterviewQuestions` / `evaluateInterviewAnswer` | Mock-interview backend |
| Quick Fill parse | `api.ai.actions.parseImportText` | Resume/LinkedIn → JSON |

## State Lokal

- `messages: Message[]` — chat buffer; mirrored via `useSessionSync`.
- `currentSessionId` — UUIDv4 created on first send; persisted in localStorage.
- Pending actions per message; status transitions
  `pending → approved → executed | rejected | failed`.
- Slash-popover open/close + filter input.
- Progress timeline: streamed step entries from the chat action.

## Dependensi

- `@/shared/lib/aiActionBus` — pub-sub.
- `@/shared/lib/sliceRegistry` — `ALL_SKILLS`, `SKILLS_BY_ID`, `SKILLS_BY_SLASH`, `llmSkillBrief()`.
- `@/shared/types/agent` — `AgentAction`, `AgentActionType`, `AGENT_ACTION_META`.
- `@/shared/types/sliceManifest` — `SliceManifest`, `SliceSkill`, `SkillAction`.
- `@/shared/hooks/useAuth` — gating session features.
- shadcn: `sheet`, `button`, `input`, `scroll-area`, `avatar`, `badge`, `separator`, `command`, `popover`, `card`.
- `TypingDots` dari `MicroInteractions`.

## Catatan Desain

- **Approval-first for mutations.** `kind: "mutation" | "compose"`
  tool_calls NEVER auto-execute. Server returns them as
  `clientToolCalls`; client renders `<ApproveActionCard>`. Trust + audit
  trail.
- **Server-authoritative history.** When `sessionId` is provided, the
  chat action loads `chatConversations` and ignores stale client state
  to prevent context loss on first render.
- **Anti-halu USER_CONTEXT block.** Compact profile snapshot is wrapped
  in delimited block with strict rules ("don't claim absent data").
- **Prompt injection mitigation.** `sanitizeAIInput` (length cap +
  control-char strip) + `wrapUserInput` (delimited block) before
  hitting OpenAI.
- **Dot-rejection workaround.** OpenAI tool names can't contain dots,
  so `skill.id="settings.update-phone"` becomes
  `tool.name="settings_update-phone"` with a reverse map for parsing.
- **Indonesian system prompt** — fixed locale; the agent always replies
  in Bahasa Indonesia regardless of user input language.
- **WIB date injection** — "today" is computed in WIB (UTC+7) and
  injected so relative time expressions ("besok", "lusa") resolve to
  YYYY-MM-DD that calendar tools accept.

## Onboarding a new slice (manifest path)

1. **Manifest** — `slices/<slice>/manifest.ts`:
   ```ts
   export const fooManifest: SliceManifest = {
     id: "foo",
     label: "Foo",
     description: "What this slice does (~1 line).",
     icon: FooIcon,
     route: { slug: "foo", component: () => import("./components/FooView").then(m => ({ default: m.FooView })) },
     nav: { placement: "more", order: 50, hue: "from-emerald-400 to-emerald-600" },
     skills: [
       { id: "foo.list", kind: "query", label: "Lihat foo", description: "...", slashCommand: "/foo" },
       { id: "foo.create", kind: "mutation", label: "Tambah foo", description: "...", args: { name: { type: "string", label: "Nama", required: true } } },
     ],
   };
   ```
2. **Registry** — append `import { fooManifest } from "@/slices/foo";` + entry in `SLICE_REGISTRY`.
3. **Binder** — export `<FooCapabilities />` from `slices/foo/index.ts`; mount in `Providers.tsx`.
4. **Seed catalog (optional)** — mirror tools in `convex/_seeds/aiDefaults.ts → DEFAULT_AI_TOOLS` so admin can toggle them.
5. **Server-side query handler (only for `kind: "query"`)** — add entry in `convex/ai/skillHandlers.ts → SKILL_HANDLERS`.

No edits to `aiActionBus`, no edits to `chat` action — both stay
generic.

## Extending

- Streaming via SSE / Convex websocket fanout (currently buffered).
- Voice input (Web Speech API → composer).
- `agentActionEvents` audit table — log every approve/reject for
  reviewable history.
- Multi-modal (image upload → vision model) once provider supports.

---

## Portabilitas

**Tier:** XL — slice + manifest plumbing + chat persistence + agentic loop.

**Files untuk dicopy:**

```
# Slice
frontend/src/slices/ai-agent/

# Shared infra (manifest framework — REQUIRED)
frontend/src/shared/types/sliceManifest.ts
frontend/src/shared/types/agent.ts
frontend/src/shared/lib/aiActionBus.ts
frontend/src/shared/lib/sliceRegistry.ts
frontend/src/shared/components/ai/AIFab.tsx
frontend/src/shared/providers/Providers.tsx          # binder mount points

# Backend
convex/ai/
convex/_seeds/aiDefaults.ts
convex/_shared/rateLimit.ts
convex/_shared/sanitize.ts
convex/_shared/aiProviders.ts
convex/_shared/env.ts
```

**cp commands:**

```bash
SRC=~/projects/CareerPack
DST=~/projects/<target>

mkdir -p "$DST/frontend/src/slices" \
         "$DST/frontend/src/shared/types" \
         "$DST/frontend/src/shared/lib" \
         "$DST/frontend/src/shared/components/ai" \
         "$DST/frontend/src/shared/providers" \
         "$DST/convex/ai" \
         "$DST/convex/_seeds" \
         "$DST/convex/_shared"

cp -r "$SRC/frontend/src/slices/ai-agent"               "$DST/frontend/src/slices/"
cp "$SRC/frontend/src/shared/types/sliceManifest.ts"    "$DST/frontend/src/shared/types/"
cp "$SRC/frontend/src/shared/types/agent.ts"            "$DST/frontend/src/shared/types/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"        "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/lib/sliceRegistry.ts"      "$DST/frontend/src/shared/lib/"
cp -r "$SRC/frontend/src/shared/components/ai"          "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/providers/Providers.tsx"   "$DST/frontend/src/shared/providers/"

cp -r "$SRC/convex/ai/"                                 "$DST/convex/"
cp "$SRC/convex/_seeds/aiDefaults.ts"                   "$DST/convex/_seeds/"
cp "$SRC/convex/_shared/rateLimit.ts"                   "$DST/convex/_shared/"
cp "$SRC/convex/_shared/sanitize.ts"                    "$DST/convex/_shared/"
cp "$SRC/convex/_shared/aiProviders.ts"                 "$DST/convex/_shared/"
```

**Schema additions** — copy from `convex/ai/schema.ts` verbatim:

- `chatConversations` — indexes `by_user`, `by_user_session`, `by_user_updated`.
- `aiSettings`, `globalAISettings`, `aiUserModelOverrides`.
- `aiSkills` — index `by_key`, `by_slash`.
- `aiTools` — index `by_type`.
- `rateLimitEvents` — for `_checkAIQuota`.

**Convex api.d.ts** — add `import type * as ai from "../ai/index.js";` + `ai: typeof ai`.

**npm deps:** none — markdown rendering is homemade (custom inline parser).

**Env vars:**
- `CONVEX_OPENAI_API_KEY` — fallback when no per-user / global config.
- `CONVEX_OPENAI_BASE_URL` — OpenAI-compatible endpoint (e.g. OpenRouter).

**Integration steps:**

1. Mount `<AIFab />` from `MobileContainer` + `DesktopContainer`.
2. Mount `<AIAgentConsole />` once at the responsive shell level.
3. For each slice with AI capabilities: write `manifest.ts`, register
   in `sliceRegistry.ts`, mount its `<XxxCapabilities />` in
   `Providers.tsx`, add `SKILL_HANDLERS` entries for query skills.
4. Run `seedAISkills` + `seedAITools` once from Admin Panel to populate
   the catalog.

**i18n:** welcome message, slash command descriptions, system prompts,
all step labels, error messages — Indonesian. Bulk edit if porting to
another locale.

**Common breakage after port:**

- **Skills not appearing in slash popover** — check the slice's
  manifest is exported via its `index.ts` and imported in
  `sliceRegistry.ts`.
- **Mutation auto-fires without approval** — capability binder
  should subscribe via `useEffect` with cleanup; missing cleanup leaks
  subscriptions, double-firing.
- **Session "forgets" first turn** — `useSessionSync` must persist on
  every assistant reply; check the client passes `sessionId` to the
  chat action so the server can merge stored history.
- **OpenAI 400 on tool name** — names with dots silently rejected;
  ensure the `_` ↔ `.` mapping in `chat` action stays bidirectional.
- **Seed mutation fails** — admin role check (`requireAdmin`) — only
  role=admin users can seed.

**Testing the port:**

1. Open Console → type `/cv saya frontend dev` → ApproveActionCard appears.
2. Approve → CV updates; check Convex `cvs` row mutated.
3. Type "list lamaran saya" → server runs `applications.list`, AI
   replies with structured summary (multi-hop query).
4. Reject an action → status persisted as `rejected`, no mutation runs.
5. Reload → previous session restored; new turn merges with stored history.

Run `_porting-guide.md` §9 checklist.
