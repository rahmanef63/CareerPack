"use client";

import { Home, FileUser, Calendar, LayoutGrid, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { AIFab } from "./AIFab";
import { Ripple, useHapticPress } from "./MicroInteractions";

export type NavView = "home" | "cv" | "calendar" | "more";

interface NavItem {
  id: NavView;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const ITEMS: NavItem[] = [
  { id: "home", label: "Beranda", icon: Home },
  { id: "cv", label: "CV", icon: FileUser },
  { id: "calendar", label: "Kalender", icon: Calendar, badge: 0 },
  { id: "more", label: "Lainnya", icon: LayoutGrid },
];

interface BottomNavProps {
  current: string;
  onSelect: (id: NavView) => void;
  onAITap: () => void;
  aiActive?: boolean;
}

export function BottomNav({ current, onSelect, onAITap, aiActive }: BottomNavProps) {
  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="nav-shell relative bg-card border-t border-border">
        {/* Notch SVG cutout for [data-nav-style="notched"] */}
        <svg
          aria-hidden
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="nav-notch hidden absolute -top-[27px] left-1/2 -translate-x-1/2 w-32 h-7 text-card"
        >
          <path d="M0 28 Q 0 0 30 0 Q 50 0 50 14 Q 50 0 70 0 Q 100 0 100 28 Z" fill="currentColor" />
        </svg>

        <nav className="grid grid-cols-5 h-[var(--nav-height)] items-center max-w-3xl mx-auto px-2">
          {left.map((item) => (
            <NavButton key={item.id} item={item} active={current === item.id} onSelect={onSelect} />
          ))}

          <div className="flex justify-center">
            <AIFab onClick={onAITap} active={aiActive} />
          </div>

          {right.map((item) => (
            <NavButton key={item.id} item={item} active={current === item.id} onSelect={onSelect} />
          ))}
        </nav>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (id: NavView) => void;
}) {
  const Icon = item.icon;
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 h-full rounded-xl mx-1 px-1",
        "text-[11px] font-medium transition-colors tap-press",
        active ? "text-career-700 dark:text-career-200" : "text-slate-500 dark:text-slate-400"
      )}
      {...press}
    >
      <Ripple />
      <span
        className={cn(
          "relative w-10 h-10 rounded-xl flex items-center justify-center",
          active && "bg-career-50 dark:bg-career-900/40"
        )}
      >
        <Icon className={cn("w-5 h-5", active && "animate-badge-bounce")} />
        {!!item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-badge-bounce">
            {item.badge}
          </span>
        )}
      </span>
      <span className="truncate max-w-[64px]">{item.label}</span>
    </button>
  );
}
