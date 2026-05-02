"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Sparkles, MessageSquare, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { runAgent, extractSlashActions } from "../lib/slashCommands";
import { subscribe } from "@/shared/lib/aiActionBus";
import { ALL_SKILLS } from "@/shared/lib/sliceRegistry";
import { newSession, type Message } from "../types/console";
import type { AIProgress, StepStatus, StepType } from "../types/progress";
import type { AgentAction } from "@/shared/types/agent";
import { MessageBubble } from "./ai-agent-console/MessageBubble";
import { HistoryRail } from "./ai-agent-console/HistoryRail";
import { Composer } from "./ai-agent-console/Composer";
import { ThinkingProgress } from "./ai-agent-console/ThinkingProgress";
import { useSessionSync } from "../hooks/useSessionSync";
import { api } from "../../../../../convex/_generated/api";

interface AIAgentConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

interface QuickPrompt {
  label: string;
  text: string;
}

const QUICK_PROMPTS: ReadonlyArray<QuickPrompt> = [
  { label: "Bantu isi CV", text: "/cv" },
  { label: "Buatkan roadmap", text: "/roadmap" },
  { label: "Review CV saya", text: "/review" },
  { label: "Latihan wawancara", text: "/interview" },
  { label: "Cari lowongan cocok", text: "/match" },
];

export function AIAgentConsole({
  open,
  onOpenChange,
  onNavigate,
  currentView,
}: AIAgentConsoleProps) {
  const { sessions, setSessions, activeId, setActiveId, deleteSession } =
    useSessionSync();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const chatAction = useAction(api.ai.actions.chat);
  const isMobile = useIsMobile();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribe("nav.go", (a) => {
      if (a.type !== "nav.go") return;
      onNavigate(a.payload.view);
      onOpenChange(false);
    });
  }, [onNavigate, onOpenChange]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId),
    [sessions, activeId],
  );

  // Auto-scroll to bottom on new message / thinking-state change.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [activeSession?.messages.length, thinking]);

  // Mobile keyboard: when virtual keyboard opens/closes, viewport
  // height changes via visualViewport. Re-scroll to bottom so the
  // composer + last message stay in view as the layout settles.
  // Belt-and-suspenders fallback for browsers where dvh updates lag
  // behind keyboard transitions (older iOS Safari).
  useEffect(() => {
    if (!isMobile || !open) return;
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const el = scrollRef.current;
      if (!el) return;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, [isMobile, open]);

  const showSlashPopover =
    input.startsWith("/") && !input.includes(" ") && !thinking;

  const contextHint = useMemo(() => {
    if (currentView === "cv") return "Di CV — coba /review atau /cv";
    if (currentView === "roadmap") return "Di Roadmap — coba /roadmap";
    if (currentView === "interview") return "Di Interview — coba /interview";
    return "Ketik / untuk perintah, atau tanya bebas";
  }, [currentView]);

  const startNewChat = useCallback(() => {
    const fresh = newSession();
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setInput("");
    setMobileHistoryOpen(false);
  }, [setSessions, setActiveId]);

  const selectSession = useCallback(
    (id: string) => {
      setActiveId(id);
      setMobileHistoryOpen(false);
    },
    [setActiveId],
  );

  const send = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      if (!text || thinking || !activeSession) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text,
        ts: Date.now(),
      };

      // Snapshot history BEFORE optimistic update so we send the right
      // payload to the backend (including the brand new user turn).
      const history = activeSession.messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      history.push({ role: "user", content: text });

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                title: s.messages.length <= 1 ? text.slice(0, 48) : s.title,
                messages: [...s.messages, userMsg],
                updatedAt: Date.now(),
              }
            : s,
        ),
      );
      setInput("");
      setThinking(true);

      const slashActions = extractSlashActions(text);

      // Serialise manifest skills for the backend so it can build
      // OpenAI tools and let the model emit tool_calls (Vercel AI SDK
      // / OpenAI function-calling style). Drops `argsFromText` (a
      // function — non-serialisable) and flattens the args record
      // into an array.
      const availableSkills = ALL_SKILLS.map((s) => ({
        id: s.id,
        description: `${s.label}: ${s.description}`,
        kind: s.kind,
        args: s.args
          ? Object.entries(s.args).map(([name, field]) => ({
              name,
              type: field.type,
              required: field.required ?? false,
              description:
                field.label +
                (field.example ? ` (contoh: ${field.example})` : ""),
            }))
          : [],
      }));

      let assistantText: string;
      let assistantProgress: AIProgress | undefined;
      let toolActions: AgentAction[] = [];
      try {
        const result = await chatAction({
          messages: history,
          sessionId: activeSession.id,
          view: currentView,
          availableSkills,
        });
        assistantText = result.text;
        toolActions = (result.toolCalls ?? []).map(
          (tc) =>
            ({
              type: tc.skillId,
              payload: tc.args,
            }) as unknown as AgentAction,
        );
        assistantProgress = {
          steps: result.progress.steps.map((s) => ({
            id: s.id,
            type: s.type as StepType,
            status: s.status as StepStatus,
            label: s.label,
            detail: s.detail,
            durationMs: s.durationMs,
            error: s.error,
          })),
          totalDurationMs: result.progress.totalDurationMs,
          isComplete: result.progress.isComplete,
        };
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        const fallback = runAgent(text);
        assistantText = `⚠️ AI gateway error: ${reason}\n\n${fallback.text}`;
        assistantProgress = {
          steps: [
            {
              id: "client-fallback",
              type: "inference",
              status: "error",
              label: "Generate respons",
              durationMs: 0,
              error: reason,
            },
          ],
          totalDurationMs: 0,
          isComplete: true,
        };
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: assistantText,
        actions: [...slashActions, ...toolActions],
        progress: assistantProgress,
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
            : s,
        ),
      );
      setThinking(false);
    },
    [activeSession, input, thinking, setSessions, chatAction, currentView],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  // Show quick prompts only on a brand-new session (just welcome msg).
  const showQuickPrompts =
    activeSession?.messages.length === 1 && !thinking;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 flex flex-col bg-card",
          isMobile
            ? "h-[80dvh] max-h-[80dvh] rounded-t-3xl"
            : "w-full sm:max-w-2xl lg:max-w-3xl",
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Asisten AI CareerPack</SheetTitle>
          <SheetDescription>
            Obrolan dengan agen AI yang bisa melakukan tindakan di aplikasi.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 min-h-0 min-w-0">
          <HistoryRail
            sessions={sessions}
            activeId={activeId}
            mobileHistoryOpen={mobileHistoryOpen}
            onStartNew={startNewChat}
            onSelect={selectSession}
            onDelete={deleteSession}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Header — sticky at top of right column. */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <button
                type="button"
                className="md:hidden inline-flex h-9 w-9 -ml-1 items-center justify-center rounded-md hover:bg-accent"
                onClick={() => setMobileHistoryOpen((v) => !v)}
                aria-label="Toggle riwayat percakapan"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {activeSession?.title || "Asisten AI"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {contextHint}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={startNewChat}
                aria-label="Percakapan baru"
                className="h-9 w-9 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Badge
                variant="secondary"
                className="text-[10px] hidden lg:inline-flex"
              >
                Mode Demo
              </Badge>
            </div>

            {/* Scroll body — native overflow + min-h-0 makes flex-1
                 actually compress so this region scrolls instead of
                 the whole sheet inflating. overscroll-contain stops
                 the page underneath from also scrolling on iOS rubber
                 band. */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
            >
              <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {activeSession?.messages.map((m) => (
                  <MessageBubble key={m.id} msg={m} />
                ))}
                {showQuickPrompts && (
                  <div className="pl-9">
                    <p className="text-[11px] text-muted-foreground mb-2">
                      Mulai cepat
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p.text}
                          type="button"
                          onClick={() => send(p.text)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent text-foreground transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {thinking && <ThinkingProgress />}
              </div>
            </div>

            {/* Composer — sticky bottom of right column. Border + bg
                 separate from messages above. */}
            <div className="shrink-0 border-t border-border bg-card">
              <Composer
                input={input}
                setInput={setInput}
                thinking={thinking}
                showSlashPopover={showSlashPopover}
                onSubmit={onSubmit}
                send={send}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
