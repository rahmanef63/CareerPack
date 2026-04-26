"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Send, Sparkles, Plus, MessageSquare, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { TypingDots } from "@/shared/components/interactions/MicroInteractions";
import { cn } from "@/shared/lib/utils";
import { runAgent, SLASH_COMMANDS } from "../lib/slashCommands";
import type { AgentAction } from "@/shared/types/agent";
import { subscribe } from "@/shared/lib/aiActionBus";
import { ApproveActionCard } from "./ApproveActionCard";
import { api } from "../../../../../convex/_generated/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AgentAction[];
  ts: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface AIAgentConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

const STORAGE_KEY = "careerpack_ai_sessions";
const MIGRATION_DONE_KEY = "careerpack_ai_sessions_migrated_v1";
const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text:
    "Halo, saya **Asisten AI** CareerPack. Saya bisa **melakukan tindakan** di aplikasi ini — " +
    "auto-isi CV, buat roadmap, mulai simulasi wawancara, dan lain-lain. " +
    "Coba ketik `/` untuk melihat perintah, atau tanya bebas.",
  ts: Date.now(),
};

function newSession(): ChatSession {
  const now = Date.now();
  return {
    id: `s-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "Percakapan baru",
    messages: [WELCOME],
    createdAt: now,
    updatedAt: now,
  };
}

function loadSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AIAgentConsole({
  open,
  onOpenChange,
  onNavigate,
  currentView,
}: AIAgentConsoleProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Convex multi-session chat store. Frontend is the source of truth on
  // edit (optimistic updates to local state, then mirror to server).
  // Gate every Convex chat write behind auth — the queries already
  // tolerate unauth (`optionalUser` returns []), but mutations call
  // `requireUser` and throw "Tidak terautentikasi" when fired before
  // the WebSocket auth token has resolved (typical race on first load).
  const { state: authState } = useAuth();
  const canWriteChat = authState.isAuthenticated;

  // listSessions returns trimmed metadata; getSession fetches transcript
  // for the active session when it changes.
  const serverSessions = useQuery(
    api.ai.queries.listChatSessions,
    canWriteChat ? {} : "skip",
  );
  const activeServerSession = useQuery(
    api.ai.queries.getChatSession,
    activeId && canWriteChat ? { sessionId: activeId } : "skip",
  );
  const upsertSessionRaw = useMutation(api.ai.mutations.upsertChatSession);
  const deleteSessionMutation = useMutation(api.ai.mutations.deleteChatSession);
  /** Wrapper that no-ops when unauthenticated. Avoids the
   *  "Tidak terautentikasi" server throw during the brief
   *  pre-auth window on first paint / after logout. */
  const upsertSession = useCallback(
    (args: Parameters<typeof upsertSessionRaw>[0]) => {
      if (!canWriteChat) return Promise.resolve(null);
      return upsertSessionRaw(args);
    },
    [upsertSessionRaw, canWriteChat],
  );
  const hydratedRef = useRef(false);
  const migratedRef = useRef(false);
  const pendingUpserts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // On first mount:
  //  1. if localStorage has sessions AND we haven't migrated yet, ship
  //     them to Convex (upsertSession for each) and mark migrated.
  //  2. hydrate UI from server; if server empty, create a fresh session.
  useEffect(() => {
    if (serverSessions === undefined) return; // loading
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const alreadyMigrated =
      typeof window !== "undefined" &&
      window.localStorage.getItem(MIGRATION_DONE_KEY) === "1";
    const legacy = !alreadyMigrated ? loadSessions() : [];

    if (legacy.length > 0 && !migratedRef.current) {
      migratedRef.current = true;
      Promise.all(
        legacy.map((s) =>
          upsertSession({
            sessionId: s.id,
            title: s.title || "Percakapan",
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            messages: s.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.text,
              timestamp: m.ts,
              actions: m.actions?.map((a) => ({
                type: a.type,
                payload: a.payload,
                status: "pending" as const,
              })),
            })),
          }).catch(() => null),
        ),
      ).finally(() => {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(MIGRATION_DONE_KEY, "1");
          window.localStorage.removeItem(STORAGE_KEY);
        }
      });
      // Optimistic local display while migration finalizes.
      setSessions(legacy);
      setActiveId(legacy[0].id);
      return;
    }

    if (serverSessions.length === 0) {
      const fresh = newSession();
      setSessions([fresh]);
      setActiveId(fresh.id);
      upsertSession({
        sessionId: fresh.id,
        title: fresh.title,
        createdAt: fresh.createdAt,
        updatedAt: fresh.updatedAt,
        messages: fresh.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.text,
          timestamp: m.ts,
        })),
      }).catch(() => null);
    } else {
      // Hydrate shells from metadata; messages filled by activeServerSession.
      const shells: ChatSession[] = serverSessions.map((s) => ({
        id: s.sessionId,
        title: s.title,
        messages: [],
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));
      setSessions(shells);
      setActiveId(shells[0].id);
    }
  }, [serverSessions, upsertSession]);

  // When the active session's transcript arrives from the server, merge
  // it into local state (preserves optimistic appends — server wins only
  // when message id is new to us).
  useEffect(() => {
    if (!activeServerSession) return;
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeServerSession.sessionId) return s;
        const localIds = new Set(s.messages.map((m) => m.id));
        const serverMsgs = activeServerSession.messages
          .filter((m) => !localIds.has(m.id))
          .map<Message>((m) => ({
            id: m.id,
            role: (m.role === "user" ? "user" : "assistant") as Message["role"],
            text: m.content,
            ts: m.timestamp,
            actions: m.actions?.map(
              (a) => ({ type: a.type, payload: a.payload }) as AgentAction,
            ),
          }));
        if (s.messages.length === 0 && serverMsgs.length > 0) {
          return {
            ...s,
            messages: serverMsgs,
            title: activeServerSession.title,
            createdAt: activeServerSession.createdAt,
            updatedAt: activeServerSession.updatedAt,
          };
        }
        return s;
      }),
    );
  }, [activeServerSession]);

  // Debounced upsert to Convex — fires 400 ms after sessions change so
  // multi-keystroke flurries collapse into one write.
  useEffect(() => {
    if (!hydratedRef.current) return;
    for (const s of sessions) {
      if (s.messages.length === 0) continue;
      const existing = pendingUpserts.current.get(s.id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        upsertSession({
          sessionId: s.id,
          title: s.title || "Percakapan",
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messages: s.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.text,
            timestamp: m.ts,
            actions: m.actions?.map((a) => ({
              type: a.type,
              payload: a.payload,
              status: "pending" as const,
            })),
          })),
        }).catch(() => null);
        pendingUpserts.current.delete(s.id);
      }, 400);
      pendingUpserts.current.set(s.id, t);
    }
  }, [sessions, upsertSession]);

  // Subscribe to nav.go — switch view + close console
  useEffect(() => {
    return subscribe("nav.go", (a) => {
      if (a.type !== "nav.go") return;
      onNavigate(a.payload.view);
      onOpenChange(false);
    });
  }, [onNavigate, onOpenChange]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId),
    [sessions, activeId]
  );

  // Autoscroll to bottom on message change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [activeSession?.messages.length, thinking]);

  const showSlashPopover =
    input.startsWith("/") && !input.includes(" ") && !thinking;

  const contextHint = useMemo(() => {
    if (currentView === "cv") return "Di CV sekarang — coba /review atau /cv";
    if (currentView === "roadmap") return "Di Roadmap — coba /roadmap";
    if (currentView === "interview") return "Di Interview Prep — coba /interview";
    return "Tersedia: /cv, /roadmap, /review, /interview, /match";
  }, [currentView]);

  const startNewChat = useCallback(() => {
    const fresh = newSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setInput("");
    setMobileHistoryOpen(false);
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      deleteSessionMutation({ sessionId: id }).catch(() => null);
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = newSession();
          setActiveId(fresh.id);
          return [fresh];
        }
        if (id === activeId) setActiveId(next[0].id);
        return next;
      });
    },
    [activeId, deleteSessionMutation]
  );

  const selectSession = useCallback((id: string) => {
    setActiveId(id);
    setMobileHistoryOpen(false);
  }, []);

  const send = useCallback(
    (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || thinking || !activeSession) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
        ts: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                title: s.messages.length <= 1 ? text.slice(0, 48) : s.title,
                messages: [...s.messages, userMsg],
                updatedAt: Date.now(),
              }
            : s
        )
      );
      setInput("");
      setThinking(true);

      window.setTimeout(() => {
        const reply = runAgent(text);
        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply.text,
          actions: reply.actions,
          ts: Date.now(),
        };
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSession.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
        setThinking(false);
      }, 620);
    },
    [activeSession, input, thinking]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 flex flex-col bg-card",
          isMobile
            ? "h-[85vh] rounded-t-3xl"
            : "w-full sm:max-w-2xl lg:max-w-3xl",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Asisten AI CareerPack</SheetTitle>
          <SheetDescription>
            Obrolan dengan agen AI yang bisa melakukan tindakan di aplikasi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* History rail — static di desktop, drawer di mobile */}
          <aside
            className={cn(
              "w-64 flex-shrink-0 border-r border-border bg-muted/30 flex-col",
              "hidden md:flex",
              mobileHistoryOpen && "absolute inset-y-0 left-0 z-10 flex w-72 bg-card shadow-xl md:static md:shadow-none"
            )}
            aria-label="Riwayat percakapan"
          >
            <div className="p-3 border-b border-border">
              <Button
                onClick={startNewChat}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Percakapan Baru
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <ul className="p-2 space-y-0.5">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selectSession(s.id)}
                      className={cn(
                        "w-full group flex items-start gap-2 p-2 rounded-md text-left transition-colors",
                        s.id === activeId
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/60"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {s.title || "Percakapan"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.messages.length} pesan
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(s.id);
                        }}
                        aria-label={`Hapus percakapan ${s.title}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          {/* Main chat pane */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <button
                type="button"
                className="md:hidden p-1 -ml-1 rounded hover:bg-accent"
                onClick={() => setMobileHistoryOpen((v) => !v)}
                aria-label="Toggle riwayat percakapan"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {activeSession?.title || "Asisten AI"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{contextHint}</p>
              </div>
              <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                Mode Demo
              </Badge>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4" viewportRef={scrollRef}>
              <div className="space-y-3 max-w-2xl mx-auto py-4">
                {activeSession?.messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
                {thinking && (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
                        <Sparkles className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="px-3 py-2 rounded-2xl bg-muted">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Separator />

            {/* Composer */}
            <Popover open={showSlashPopover}>
              <PopoverAnchor asChild>
                <form onSubmit={onSubmit} className="p-3 max-w-3xl mx-auto w-full">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ketik / untuk perintah, atau tanya bebas…"
                      disabled={thinking}
                      className="flex-1"
                      aria-label="Pesan ke Asisten AI"
                    />
                    <Button
                      type="submit"
                      disabled={thinking || !input.trim()}
                      className="bg-gradient-to-br from-brand-from to-brand-to hover:from-brand-from hover:to-brand-to text-brand-foreground"
                      aria-label="Kirim pesan"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {SLASH_COMMANDS.map((c) => (
                      <button
                        key={c.cmd}
                        type="button"
                        onClick={() => send(c.example)}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-muted hover:bg-accent text-muted-foreground transition-colors"
                      >
                        {c.cmd}
                      </button>
                    ))}
                  </div>
                </form>
              </PopoverAnchor>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="p-0 w-[min(90vw,420px)]"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command>
                  <CommandInput
                    placeholder="Cari perintah…"
                    value={input}
                    onValueChange={setInput}
                  />
                  <CommandList>
                    <CommandEmpty>Perintah tidak ditemukan.</CommandEmpty>
                    <CommandGroup heading="Perintah AI">
                      {SLASH_COMMANDS.map((c) => (
                        <CommandItem
                          key={c.cmd}
                          value={c.cmd}
                          onSelect={() => setInput(c.cmd + " ")}
                        >
                          <code className="text-brand dark:text-brand font-mono text-xs">
                            {c.cmd}
                          </code>
                          <span className="flex-1">{c.description}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="w-7 h-7 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground">
            <Sparkles className="w-3 h-3" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex flex-col gap-2 min-w-0", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed break-words",
            isUser
              ? "bg-brand text-brand-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {renderMarkdown(msg.text)}
        </div>
        {msg.actions && msg.actions.length > 0 && (
          <div className="space-y-2 w-full max-w-[85%]">
            {msg.actions.map((a, i) => (
              <ApproveActionCard key={`${msg.id}-${i}`} action={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tiny markdown: **bold** dan `code`
function renderMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={`b-${i++}`}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code
          key={`c-${i++}`}
          className="px-1 py-0.5 rounded bg-foreground/10 text-[12px] font-mono"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
