"use client";

import { useQuery } from "convex/react";
import { FileText, Sparkles } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/utils";
import { api } from "../../../../../convex/_generated/api";
import { ApproveActionCard } from "../ApproveActionCard";
import { AIProgressDisplay } from "./AIProgressDisplay";
import type { ActionStatus, Message, MessageAttachment } from "../../types/console";

interface MessageBubbleProps {
  msg: Message;
  /** Persists the user's decision so the card stays resolved across reloads. */
  onActionResolved?: (messageId: string, index: number, status: ActionStatus) => void;
}

export function MessageBubble({ msg, onActionResolved }: MessageBubbleProps) {
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
      <div
        className={cn(
          "flex flex-col gap-2 min-w-0",
          isUser ? "items-end" : "items-start max-w-[85%] flex-1",
        )}
      >
        {!isUser && msg.progress && (
          <AIProgressDisplay
            progress={msg.progress}
            defaultOpen={false}
            variant="completed"
          />
        )}
        {msg.attachments && msg.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", isUser ? "justify-end" : "justify-start")}>
            {msg.attachments.map((a, i) => (
              <AttachmentChip key={`${msg.id}-att-${i}`} attachment={a} />
            ))}
          </div>
        )}
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
              <ApproveActionCard
                key={`${msg.id}-${i}`}
                action={a}
                status={a.status}
                onResolved={(applied) =>
                  onActionResolved?.(msg.id, i, applied ? "approved" : "rejected")
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One attachment reference on a message. `previewUrl` (a same-tab blob: URL)
 * only survives the tab that created it, so on reload — or in another tab via
 * cross-device sync — this resolves a real signed URL from `storageId`
 * instead. Images without either render nothing but the filename chip; the
 * pixel data itself is never persisted (see ai/schema.ts).
 */
function AttachmentChip({ attachment }: { attachment: MessageAttachment }) {
  const needsUrl = attachment.kind === "image" && !attachment.previewUrl && !!attachment.storageId;
  const resolved = useQuery(
    api.files.queries.getFileUrl,
    needsUrl ? { storageId: attachment.storageId! } : "skip",
  );
  const imageUrl = attachment.previewUrl ?? resolved ?? undefined;

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-1.5 py-1 text-xs max-w-[10rem]"
      title={attachment.fileName}
    >
      {attachment.kind === "image" && imageUrl ? (
        <Image
          src={imageUrl}
          alt={attachment.fileName}
          width={24}
          height={24}
          unoptimized
          className="w-6 h-6 rounded object-cover shrink-0"
        />
      ) : (
        <FileText className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{attachment.fileName}</span>
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
          className="px-1 py-0.5 rounded bg-foreground/10 text-xs font-mono"
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
