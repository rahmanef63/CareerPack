"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Sparkles, MessageSquare } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/shared/components/ui/sheet";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { TypingDots } from "@/shared/components/interactions/MicroInteractions";
import { cn } from "@/shared/lib/utils";
import { runAgent, extractSlashActions } from "../lib/slashCommands";
import { subscribe } from "@/shared/lib/aiActionBus";
import { newSession, type Message } from "../types/console";
import type { AIProgress, StepStatus, StepType } from "../types/progress";
import { MessageBubble } from "./ai-agent-console/MessageBubble";
import { HistoryRail } from "./ai-agent-console/HistoryRail";
import { Composer } from "./ai-agent-console/Composer";
import { useSessionSync } from "../hooks/useSessionSync";
import { api } from "../../../../../convex/_generated/api";

interface AIAgentConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function AIAgentConsole({
  open,
  onOpenChange,
  onNavigate,
  currentView,
}: AIAgentConsoleProps) {
  const { sessions, setSessions, activeId, setActiveId, deleteSession } = useSessionSync();
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const chatAction = useAction(api.ai.actions.chat);

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

      // Slash commands inject structured actions even when the AI
      // reply is plain prose — kept client-side so action approval
      // doesn't depend on AI obeying a JSON contract.
      const slashActions = extractSlashActions(text);

      let assistantText: string;
      let assistantProgress: AIProgress | undefined;
      try {
        const result = await chatAction({
          messages: history,
          view: currentView,
        });
        assistantText = result.text;
        // Backend types steps with `string` for type/status (no Convex
        // union validators on the return shape). Narrow at the boundary
        // so renderers can rely on the AIProgress contract.
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
        actions: slashActions,
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

  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "p-0 flex flex-col bg-card",
          isMobile
            ? "h-[92dvh] max-h-[92dvh] rounded-t-3xl"
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
          <HistoryRail
            sessions={sessions}
            activeId={activeId}
            mobileHistoryOpen={mobileHistoryOpen}
            onStartNew={startNewChat}
            onSelect={selectSession}
            onDelete={deleteSession}
          />

          <div className="flex-1 flex flex-col min-w-0">
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
      </SheetContent>
    </Sheet>
  );
}
