"use client";

import { useEffect, useRef } from "react";
import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
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
import { cn } from "@/shared/lib/utils";
import { SLASH_COMMANDS } from "../../lib/slashCommands";
import {
  MAX_CHAT_ATTACHMENTS,
  type useChatAttachments,
} from "../../hooks/useChatAttachments";

interface Props {
  input: string;
  setInput: (s: string) => void;
  thinking: boolean;
  showSlashPopover: boolean;
  onSubmit: (e: React.FormEvent) => void;
  send: (text?: string) => void;
  attachments: ReturnType<typeof useChatAttachments>;
}

/** Cap textarea growth at ~5 visible rows. Above this, internal scroll
 *  kicks in so the composer never crowds the message list. */
const MAX_TEXTAREA_PX = 160;

export function Composer({
  input,
  setInput,
  thinking,
  showSlashPopover,
  onSubmit,
  send,
  attachments,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pending, ready, busy, visionUncertain, addFiles, removeAttachment } =
    attachments;

  // Auto-resize on every input change. Reset to auto first so it
  // shrinks back when characters are deleted.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [input]);

  const canSend = !thinking && !busy && (!!input.trim() || ready.length > 0);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Vercel AI SDK convention: Enter sends, Shift+Enter inserts
    // newline. `isComposing` guards against IME composers (e.g.
    // Indonesian / Asian input methods) where Enter just commits the
    // composition and shouldn't fire send.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) {
        send();
      }
    }
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = ""; // allow re-picking the same file
  };

  return (
    <Popover open={showSlashPopover}>
      <PopoverAnchor asChild>
        <form
          onSubmit={onSubmit}
          className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-3xl mx-auto w-full"
        >
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {pending.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-xl border pl-1.5 pr-2 py-1.5 text-xs",
                    p.status === "error"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-background",
                  )}
                  title={p.error ?? p.fileName}
                >
                  {p.previewUrl ? (
                    <Image
                      src={p.previewUrl}
                      alt={p.fileName}
                      width={28}
                      height={28}
                      unoptimized
                      className="w-7 h-7 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="max-w-[7rem] truncate">{p.fileName}</span>
                  {p.status === "processing" && (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(p.id)}
                    className="shrink-0 rounded-full p-0.5 hover:bg-accent"
                    aria-label={`Hapus lampiran ${p.fileName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {visionUncertain && ready.some((p) => p.kind === "image") && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1.5">
              Model AI saat ini mungkin tidak bisa membaca gambar — ganti model
              di Setelan → AI bila balasan tidak menyebut isinya.
            </p>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={thinking || pending.length >= MAX_CHAT_ATTACHMENTS}
              onClick={() => fileInputRef.current?.click()}
              className="h-11 w-11 rounded-2xl shrink-0"
              aria-label="Lampirkan gambar atau PDF"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ketik / untuk perintah, atau tanya bebas…"
                disabled={thinking}
                rows={1}
                className={cn(
                  "block w-full resize-none rounded-2xl border border-input bg-background",
                  "px-4 py-2.5 leading-relaxed",
                  "text-base sm:text-sm", // 16px on mobile prevents iOS focus-zoom
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "min-h-[44px]", // iOS minimum tappable target
                )}
                style={{ maxHeight: `${MAX_TEXTAREA_PX}px` }}
                aria-label="Pesan ke Asisten AI"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                spellCheck
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-from to-brand-to hover:opacity-90 text-brand-foreground shrink-0"
              aria-label="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 hidden sm:block">
            Enter kirim · Shift+Enter baris baru · / untuk perintah
          </p>
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
  );
}
