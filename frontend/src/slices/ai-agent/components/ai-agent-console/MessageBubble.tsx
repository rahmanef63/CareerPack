"use client";

import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import { ApproveActionCard } from "../ApproveActionCard";
import type { Message } from "../../types/console";

export function MessageBubble({ msg }: { msg: Message }) {
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
              : "bg-muted text-foreground rounded-bl-md",
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
        </code>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
