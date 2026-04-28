"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Globe,
  Layers,
  Mail,
  MousePointerClick,
  Palette,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const SECTIONS = [
  { id: "identity", label: "Identitas", icon: Globe },
  { id: "theme", label: "Tema", icon: Palette },
  { id: "hero", label: "Hero", icon: User },
  { id: "availability", label: "Status", icon: Briefcase },
  { id: "cta", label: "CTA", icon: MousePointerClick },
  { id: "layout", label: "Section", icon: Layers },
  { id: "contact", label: "Kontak", icon: Mail },
  { id: "indexing", label: "SEO", icon: ShieldCheck },
] as const;

export interface PBSectionNavProps {
  activeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Sticky pill navigator for the Otomatis accordion.
 * IntersectionObserver picks the section closest to the viewport top
 * and highlights its pill. Click jumps + opens the accordion.
 *
 * Hidden on `lg:` because the desktop layout shows a side-by-side
 * preview pane there — sticky pills would clash with the split.
 */
export function PBSectionNav({ activeId, onSelect }: PBSectionNavProps) {
  const [visible, setVisible] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = SECTIONS.map((s) =>
      document.getElementById(`pb-section-${s.id}`),
    ).filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries.filter((e) => e.isIntersecting);
        if (inView.length === 0) return;
        // Pick the topmost intersecting section so the pill follows
        // the user's scroll instead of jumping back to the last-entered
        // one when several sections are simultaneously open.
        inView.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        );
        const id = inView[0].target.id.replace("pb-section-", "");
        setVisible(id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, []);

  const current = visible ?? activeId;

  function handleSelect(id: string) {
    onSelect(id);
    // Slight delay so the parent can expand the accordion before the
    // smooth-scroll measures the destination's position.
    window.setTimeout(() => {
      document
        .getElementById(`pb-section-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border bg-background/95 backdrop-blur sm:mx-0 sm:rounded-t-md sm:border-x lg:hidden">
      <div className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = s.id === current;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-brand bg-brand text-brand-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-3 w-3" />
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
