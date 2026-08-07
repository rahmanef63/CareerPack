"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

import { CVImportDialog } from "./CVImportDialog";

export interface CVImportButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  className?: string;
  /** Fired after a successful write (and after an undo) so the parent can
   *  advance a wizard, close its own dialog, or refetch. */
  onApplied?: () => void;
}

/**
 * Entry point for the CV importer.
 *
 * Owns `open` and nothing else. Every other piece of import state belongs to
 * `CVImportDialog`, which sits *above* the `ResponsiveDialog` root — that root
 * swaps a radix Dialog for a vaul Drawer at 1024 px and unmounts its whole
 * subtree when it does.
 */
export function CVImportButton({
  variant = "outline",
  size = "default",
  className,
  onApplied,
}: CVImportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <FileUp className="h-4 w-4" />
        <span>Impor dari CV</span>
      </Button>

      <CVImportDialog open={open} onOpenChange={setOpen} onApplied={onApplied} />
    </>
  );
}
