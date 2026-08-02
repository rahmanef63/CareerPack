"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
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

interface Props {
  input: string;
  setInput: (s: string) => void;
  thinking: boolean;
  showSlashPopover: boolean;
  onSubmit: (e: React.FormEvent) => void;
  send: (text?: string) => void;
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
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on every input change. Reset to auto first so it
  // shrinks back when characters are deleted.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`;
  }, [input]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Vercel AI SDK convention: Enter sends, Shift+Enter inserts
    // newline. `isComposing` guards against IME composers (e.g.
    // Indonesian / Asian input methods) where Enter just commits the
    // composition and shouldn't fire send.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!thinking && input.trim()) {
        send();
      }
    }
  };

  return (
    <Popover open={showSlashPopover}>
      <PopoverAnchor asChild>
        <form
          onSubmit={onSubmit}
          className="px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] max-w-3xl mx-auto w-full"
        >
          <div className="flex items-end gap-2">
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
              disabled={thinking || !input.trim()}
              className="h-11 w-11 rounded-2xl bg-gradient-to-br from-brand-from to-brand-to hover:opacity-90 text-brand-foreground shrink-0"
              aria-label="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 hidden sm:block">
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
