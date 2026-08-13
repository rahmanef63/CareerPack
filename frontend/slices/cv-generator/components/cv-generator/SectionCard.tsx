"use client";

import { useId } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function SectionCard({ title, icon: Icon, children, isOpen, onToggle, onAdd, addLabel }: SectionCardProps) {
  const contentId = useId();

  // No more click/keydown shim on the header. It carried `role="button"` +
  // tabIndex on a CardHeader that CONTAINS the "Tambah" button — a control
  // inside a control (axe `nested-interactive`, 10 nodes across /dashboard/cv
  // and /dashboard/checklist). Keyboard users tabbed to the inner button while
  // the outer role claimed the focus was on the section toggle, and the
  // handlers below existed only to guess which one the user meant by walking
  // `closest('button')`. Two real <button>s replace all of it: the title area
  // and the chevron. The add action is now their SIBLING, not their child.

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between gap-2">
          {/* The big target: clicking the title still expands, as before. */}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={contentId}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-brand" />
            </div>
            <CardTitle className="text-lg truncate">{title}</CardTitle>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdd}
                className="text-brand-muted-foreground hover:text-brand-muted-foreground hover:bg-brand-muted"
              >
                <Plus className="w-4 h-4 mr-1" />
                {addLabel}
              </Button>
            )}
            {/* Second toggle rather than a decorative chevron: it is what most
                people aim at, and as a sibling of the add button it nests
                nothing. h-8/w-8 — `--font-scale` 0.92 shrinks the rem base, so
                a nominal-24px h-6 would render at 22px. */}
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-controls={contentId}
              aria-label={`${isOpen ? "Tutup" : "Buka"} bagian ${title}`}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </CardHeader>
      {isOpen && <CardContent id={contentId} className="pt-6">{children}</CardContent>}
    </Card>
  );
}
