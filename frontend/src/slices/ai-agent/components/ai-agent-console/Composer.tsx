"use client";

import { Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/shared/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/shared/components/ui/popover";
import { SLASH_COMMANDS } from "../../lib/slashCommands";

interface Props {
  input: string;
  setInput: (s: string) => void;
  thinking: boolean;
  showSlashPopover: boolean;
  onSubmit: (e: React.FormEvent) => void;
  send: (text?: string) => void;
}

export function Composer({
  input, setInput, thinking, showSlashPopover, onSubmit, send,
}: Props) {
  return (
    <Popover open={showSlashPopover}>
      <PopoverAnchor asChild>
        <form
          onSubmit={onSubmit}
          className="p-3 max-w-3xl mx-auto w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik / untuk perintah, atau tanya bebas…"
              disabled={thinking}
              className="flex-1 text-base sm:text-sm"
              aria-label="Pesan ke Asisten AI"
              enterKeyHint="send"
              autoComplete="off"
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
  );
}
