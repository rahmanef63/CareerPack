"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button, type ButtonProps } from "@/shared/components/ui/button";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";

/**
 * One clipboard button for the whole app.
 *
 * Six hand-rolled copies of this existed (PromptStep, ResultPanel,
 * CoverLetterDialog, ExportCard, ShareCard, ErrorLogsPanel) and each learned
 * the same lessons separately — or didn't: `navigator.clipboard` is undefined
 * on an insecure origin and its write rejects when permission is denied or the
 * document is not focused, so the optimistic ones showed a success toast for a
 * copy that never happened. The failure path names the manual escape hatch
 * because at that point selecting the text is the only thing left to do.
 *
 * Success is reported inline (icon flip) plus a live region, not a toast: a
 * toast per copy is noise when the button is right there under the cursor, but
 * a screen-reader user gets nothing from an icon that changed.
 */
export interface CopyButtonProps
  extends Omit<ButtonProps, "value" | "onClick" | "children"> {
  value: string;
  /** Accessible name — say WHAT is copied ("Salin base URL"), not just "Salin". */
  label?: string;
}

const COPIED_MS = 2000;

export function CopyButton({
  value,
  label = "Salin",
  variant = "ghost",
  size = "icon",
  className,
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      // Not `navigator.clipboard?.writeText` — optional chaining resolves to
      // undefined on an insecure origin, which awaits fine and would light up
      // the check mark for a copy that never happened.
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      notify.warning("Gagal menyalin — pilih teksnya lalu tekan Ctrl+C");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-label={label}
        onClick={() => void copy()}
        className={cn("text-muted-foreground", className)}
        {...rest}
      >
        {copied ? <Check className="text-success" /> : <Copy />}
      </Button>
      {/* Rendered empty rather than mounted on copy: a live region has to exist
          before its content changes or the announcement is skipped. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${label} — disalin` : ""}
      </span>
    </>
  );
}

export interface CodeBlockProps {
  value: string;
  /** Accessible name for the copy button. */
  label?: string;
  className?: string;
}

/**
 * Monospace value with its copy button attached — the only shape code should
 * take in the UI, because code that is shown is code someone has to retype
 * otherwise. Flex rather than an absolutely positioned button so a long value
 * scrolls under the button instead of behind it.
 */
export function CodeBlock({ value, label = "Salin kode", className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-muted/40 pl-3",
        className,
      )}
    >
      <pre className="min-w-0 flex-1 overflow-x-auto py-2 text-xs">
        <code className="font-mono">{value}</code>
      </pre>
      <CopyButton value={value} label={label} className="shrink-0" />
    </div>
  );
}
