"use client";

import { cn } from "@/shared/lib/utils";
import { AIFab } from "./AIFab";
import { Ripple, useHapticPress } from "./MicroInteractions";
import { PRIMARY_NAV, MORE_NAV_ICON, type NavItem, type PrimaryNavId } from "./navConfig";

interface BottomNavProps {
  current: string;
  onSelect: (id: PrimaryNavId) => void;
  onAITap: () => void;
  aiActive?: boolean;
}

/**
 * Bottom tab bar khusus mobile/tablet (< lg).
 * Layout: 2 tab kiri · AI FAB (tengah, menonjol) · Kalender · More.
 */
export function BottomNav({ current, onSelect, onAITap, aiActive }: BottomNavProps) {
  const leftTabs = PRIMARY_NAV.slice(0, 2);
  const rightTab = PRIMARY_NAV[2];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="nav-shell relative bg-card border-t border-border">
        <svg
          aria-hidden
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className="nav-notch hidden absolute -top-[27px] left-1/2 -translate-x-1/2 w-32 h-7 text-card"
        >
          <path d="M0 28 Q 0 0 30 0 Q 50 0 50 14 Q 50 0 70 0 Q 100 0 100 28 Z" fill="currentColor" />
        </svg>

        <nav
          className="grid grid-cols-5 h-[var(--nav-height)] items-center max-w-3xl mx-auto px-2"
          aria-label="Navigasi utama"
        >
          {leftTabs.map((item) => (
            <NavButton key={item.id} item={item} active={current === item.id} onSelect={onSelect} />
          ))}

          <div className="flex justify-center">
            <AIFab onClick={onAITap} active={aiActive} />
          </div>

          <NavButton item={rightTab} active={current === rightTab.id} onSelect={onSelect} />
          <NavButton
            item={{ id: "more", label: "Lainnya", icon: MORE_NAV_ICON }}
            active={current === "more"}
            onSelect={onSelect}
          />
        </nav>
      </div>
    </div>
  );
}

interface NavButtonProps<TId extends PrimaryNavId> {
  item: NavItem<TId>;
  active: boolean;
  onSelect: (id: TId) => void;
}

function NavButton<TId extends PrimaryNavId>({ item, active, onSelect }: NavButtonProps<TId>) {
  const Icon = item.icon;
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 h-full rounded-xl mx-1 px-1",
        "text-[11px] font-medium transition-colors tap-press",
        active ? "text-career-700 dark:text-career-200" : "text-muted-foreground"
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
      </span>
      <span className="truncate max-w-[64px]">{item.label}</span>
    </button>
  );
}
