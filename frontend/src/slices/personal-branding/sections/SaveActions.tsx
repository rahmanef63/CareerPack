"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import type { SubmitOptions } from "../form/types";

export interface SaveActionsProps {
  saving: boolean;
  canEnable: boolean;
  submit: (opts?: SubmitOptions) => Promise<void>;
  /** Hide the "Opt-in per kolom" badge — useful for compact placements. */
  showBadge?: boolean;
  className?: string;
}

/**
 * The "Simpan Draft" + "Simpan & Publikasikan" button row. Used at
 * the bottom of every settings card so the user can save from the
 * tab they're on without scrolling back to the page header.
 */
export function SaveActions({
  saving,
  canEnable,
  submit,
  showBadge = true,
  className,
}: SaveActionsProps) {
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-3 pt-1" +
        (className ? ` ${className}` : "")
      }
    >
      {showBadge ? (
        <Badge
          variant="secondary"
          className="gap-1 bg-brand-muted text-brand-muted-foreground"
        >
          <ShieldCheck className="h-3 w-3" />
          Opt-in per kolom
        </Badge>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => submit()}
          disabled={saving}
        >
          {saving ? "Menyimpan…" : "Simpan Draft"}
        </Button>
        <Button
          type="button"
          onClick={() => submit({ activate: true })}
          disabled={saving || !canEnable}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Simpan & Publikasikan
        </Button>
      </div>
    </div>
  );
}
