# AI Agent (Console)

## Tujuan

Side-panel AI global — chat + slash commands yang bisa trigger aksi cross-slice (edit CV bullet, buat roadmap, kick off mock interview, dll). Aksi butuh approval eksplisit sebelum dijalankan.

## Route & Entry

- Tidak punya URL sendiri — di-mount sebagai Sheet side-panel
- Entry: AI FAB (mobile) atau tombol di `SiteHeader` (desktop), dibuka dari `ResponsiveContainer`
- Slice: `frontend/src/slices/ai-agent/`

## Struktur Slice

```
ai-agent/
├─ index.ts                            export { AIAgentConsole, ApproveActionCard, runAgent, SLASH_COMMANDS }
├─ components/
│  ├─ AIAgentConsole.tsx               Sheet + chat UI + Popover slash-command picker
│  └─ ApproveActionCard.tsx            Kartu approval per action
└─ lib/
   ├─ agentActions.ts                  Re-export @/shared/types/agent (cross-slice contract)
   └─ slashCommands.ts                 `runAgent(input)` heuristic + SLASH_COMMANDS list
```

## Data Flow

Backend: `convex/ai/` (tabel `chatConversations`).

| Operasi | Convex |
|---|---|
| List sesi | `api.ai.queries.listChatSessions` |
| Load sesi tertentu | `api.ai.queries.getChatSession` |
| Upsert sesi (mirror state) | `api.ai.mutations.upsertChatSession` (cap 4000 char/msg, 200 msg/convo, 50 convo/user) |
| Hapus sesi | `api.ai.mutations.deleteChatSession` |
| Hapus semua | `api.ai.mutations.deleteAllChatSessions` |

AI response:
- Heuristik offline: `runAgent(input)` di `lib/slashCommands.ts` — detect pattern → return `{ text, actions: AgentAction[] }`
- Online via `convex/ai/actions.ts` action `generateCareerAdvice({ question, userContext })` — optional, rate-limited

Slash commands:
- `/cv` — auto-isi CV dari deskripsi
- `/roadmap <role>` — buat roadmap
- `/review` — skor CV
- `/interview <role>` — mulai simulasi
- `/match` — rekomendasi lowongan

Cross-slice action: di-publish ke `aiActionBus` (`@/shared/lib/aiActionBus`). Slice target (mis. CV generator) `subscribe()` dan eksekusi setelah user approve.

## Action Approval Flow

1. Agent reply dengan `actions: AgentAction[]`
2. Render `<ApproveActionCard>` per action — user klik Approve/Reject
3. Approved → `publish(action)` via bus → slice yang subscribe eksekusi
4. Pesan follow-up di-tulis ke chat

Design rationale: semua mutation yang menyentuh user data harus explicit approve — AI tidak auto-edit. User trust + audit trail.

## State Lokal

- `messages: Message[]` — chat buffer lokal (synced ke Convex on save)
- Input + slash-command Popover state
- Pending actions per message

## Dependensi

- `@/shared/lib/aiActionBus` — pub-sub kontrak
- `@/shared/types/agent` — `AgentAction`, `AgentActionType`, `AGENT_ACTION_META`
- shadcn: `sheet`, `button`, `input`, `scroll-area`, `avatar`, `badge`, `separator`, `command`, `popover`
- `TypingDots` dari `MicroInteractions`

## Catatan Desain

- Heuristic-first: `runAgent` berjalan murni client-side. Kalau user enable AI online (lewat AI Settings slice), call OpenAI-compat action lewat Convex. Heuristik tetap jadi fallback saat kuota habis / provider down.
- Prompt injection mitigation: `sanitizeAIInput` + `wrapUserInput` di Convex sebelum ke OpenAI.

## Extending

- Multi-turn memory dengan Claude/GPT function-calling → tambah `api.ai.chatTurn` action, return structured `actions`.
- Voice input → Web Speech API → textarea.
- Action log ke audit trail (mis. `agentActionEvents` table) untuk reviewable history.

---

## Portabilitas

**Tier:** XL — slice + global FAB + chat storage + action bus + slash commands (non-trivial).

**Files:**

```
frontend/src/slices/ai-agent/
frontend/src/shared/components/ai/AIFab.tsx             # floating action button
frontend/src/shared/lib/aiActionBus.ts                  # pub-sub for slice integrations
frontend/src/shared/types/agent.ts                      # AgentAction union type
convex/ai/                                          # multi-session chat persistence
convex/ai/actions.ts                                            # OpenAI-compatible action (generate, etc.)
convex/_shared/rateLimit.ts                                # token bucket for AI quota
convex/_shared/sanitize.ts                                 # sanitizeAIInput, wrapUserInput
```

**cp:**

```bash
SRC=~/projects/CareerPack DST=~/projects/<target>
cp -r "$SRC/frontend/src/slices/ai-agent"               "$DST/frontend/src/slices/"
cp -r "$SRC/frontend/src/shared/components/ai"          "$DST/frontend/src/shared/components/"
cp "$SRC/frontend/src/shared/lib/aiActionBus.ts"        "$DST/frontend/src/shared/lib/"
cp "$SRC/frontend/src/shared/types/agent.ts"            "$DST/frontend/src/shared/types/"
cp "$SRC/convex/ai/" "$SRC/convex/ai/actions.ts"            "$DST/convex/"
cp -r "$SRC/convex/_lib"                                "$DST/convex/"
```

**Schema:** add `chatConversations` (multi-session: sessionId + title + messages[] with `actions?[]`) + `rateLimitEvents`. Indexes: `by_user_session`, `by_user_updated`.

**Convex api.d.ts:** add `chat`, `ai`.

**npm deps:** none (markdown inline renderer is homemade).

**Env vars:**
- `CONVEX_OPENAI_API_KEY`, `CONVEX_OPENAI_BASE_URL` — OpenAI-compatible
- `ADMIN_BOOTSTRAP_EMAILS` (optional)

**Integration:**
- Global FAB: mount `<AIFab />` in `DesktopContainer` + `MobileContainer`
- Slice wiring: import `subscribe("<action.type>")` from `aiActionBus` in each consumer slice (cv-generator, skill-roadmap, etc.) and handle the action
- Slash commands: `slices/ai-agent/lib/slashCommands.ts` — hardcoded; customize for target domain

**i18n:** welcome message, slash command descriptions, context hints. All Indonesian.

**Common breakage:** action bus subscriptions must be in `useEffect` with cleanup — otherwise memory leaks. Each slice's AI integration doc covers this.

See `_porting-guide.md`.
