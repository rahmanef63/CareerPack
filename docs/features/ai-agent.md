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

Backend: `convex/chat.ts` (tabel `chatConversations`).

| Operasi | Convex |
|---|---|
| Load riwayat | `api.chat.getUserConversation` |
| Simpan pesan | `api.chat.saveMessage` (cap 4000 char, 200 msg/convo) |
| Clear convo | `api.chat.clearConversation` |

AI response:
- Heuristik offline: `runAgent(input)` di `lib/slashCommands.ts` — detect pattern → return `{ text, actions: AgentAction[] }`
- Online via `convex/ai.ts` action `generateCareerAdvice({ question, userContext })` — optional, rate-limited

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
