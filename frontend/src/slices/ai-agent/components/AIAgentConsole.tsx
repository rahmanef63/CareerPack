"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, X, Trash2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/slices/shared/components/ui/drawer";
import { Button } from "@/slices/shared/components/ui/button";
import { Input } from "@/slices/shared/components/ui/input";
import { ScrollArea } from "@/slices/shared/components/ui/scroll-area";
import { TypingDots } from "@/slices/shared/components/MicroInteractions";
import { cn } from "@/lib/utils";
import { runAgent, SLASH_COMMANDS } from "../lib/slashCommands";
import type { AgentAction } from "../lib/agentActions";
import { ApproveActionCard } from "./ApproveActionCard";
import { subscribe } from "@/slices/shared/lib/aiActionBus";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AgentAction[];
  ts: number;
}

interface AIAgentConsoleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function AIAgentConsole({ open, onOpenChange, onNavigate, currentView }: AIAgentConsoleProps) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      text:
        `Halo, saya **Asisten AI** CareerPack. Saya bisa **melakukan tindakan** di app ini — auto-isi CV, ` +
        `buat roadmap, mulai simulasi wawancara, dll. Coba slash command di bawah, atau ketik bebas.`,
      ts: Date.now(),
    },
  ]);
  const [showSlash, setShowSlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to nav.go actions to switch view + close console
  useEffect(() => {
    return subscribe("nav.go", (a) => {
      if (a.type !== "nav.go") return;
      onNavigate(a.payload.view);
      onOpenChange(false);
    });
  }, [onNavigate, onOpenChange]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [messages, thinking]);

  // Show slash hint when user types "/"
  useEffect(() => {
    setShowSlash(input.startsWith("/") && !input.includes(" "));
  }, [input]);

  const filteredSlash = useMemo(() => {
    if (!showSlash) return [];
    return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input));
  }, [showSlash, input]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      const reply = runAgent(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply.text,
          actions: reply.actions,
          ts: Date.now(),
        },
      ]);
      setThinking(false);
    }, 600);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: `Riwayat dihapus. Bagaimana saya bisa membantu sekarang?`,
        ts: Date.now(),
      },
    ]);
  };

  const contextHint = useMemo(() => {
    if (currentView === "cv") return "Saat ini di CV — coba /review atau /cv";
    if (currentView === "roadmap") return "Saat ini di Roadmap — coba /roadmap";
    if (currentView === "interview") return "Saat ini di Interview — coba /interview";
    return "Coba /cv, /roadmap, /review, /interview, /match";
  }, [currentView]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card max-h-[92vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-career-500 to-indigo-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              Asisten AI
            </DrawerTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Hapus chat">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Tutup">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-left mt-1">{contextHint}</p>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
          <div className="space-y-3 max-w-2xl mx-auto pb-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} />
            ))}
            {thinking && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 w-fit">
                <TypingDots />
                <span className="text-xs text-muted-foreground">AI sedang berpikir…</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card relative">
          {showSlash && filteredSlash.length > 0 && (
            <div className="absolute left-0 right-0 bottom-full p-2 bg-popover text-popover-foreground border-t border-border max-h-56 overflow-y-auto">
              {filteredSlash.map((c) => (
                <button
                  key={c.cmd}
                  type="button"
                  onClick={() => {
                    setInput(c.cmd + " ");
                  }}
                  className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-accent text-left"
                >
                  <code className="text-career-700 dark:text-career-300 font-mono text-sm">{c.cmd}</code>
                  <div className="flex-1">
                    <p className="text-sm">{c.description}</p>
                    <p className="text-xs text-muted-foreground">{c.example}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="p-3 max-w-2xl mx-auto w-full">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik / untuk perintah, atau tanya bebas…"
                disabled={thinking}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" disabled={thinking || !input.trim()} className="bg-career-600 hover:bg-career-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {SLASH_COMMANDS.map((c) => (
                <button
                  key={c.cmd}
                  type="button"
                  onClick={() => send(c.example)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-career-100 dark:hover:bg-career-900/40 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {c.cmd}
                </button>
              ))}
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "bg-career-600 text-white rounded-br-md"
            : "bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-md"
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
  );
}

// Tiny markdown: **bold** and `code`
function renderMarkdown(text: string) {
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
        <code key={`c-${i++}`} className="px-1 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[12px] font-mono">
          {tok.slice(1, -1)}
        </code>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
