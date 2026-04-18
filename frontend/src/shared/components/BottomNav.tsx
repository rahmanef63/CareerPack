"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { AIFab } from "./AIFab";
import { Ripple, useHapticPress } from "./MicroInteractions";
import {
  PRIMARY_NAV,
  MORE_NAV_ICON,
  type NavItem,
  activeNavForPath,
} from "./navConfig";

interface BottomNavProps {
  onAITap: () => void;
  aiActive?: boolean;
  onMoreTap: () => void;
}

/**
 * Bottom tab bar khusus mobile/tablet (< lg).
 * Layout: 2 tab kiri · AI FAB (tengah, menonjol) · Kalender · More.
 * Aktif state dihitung dari `usePathname()` — SSOT lewat navConfig.
 */
export function BottomNav({ onAITap, aiActive, onMoreTap }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeNavForPath(pathname);

  const leftTabs = PRIMARY_NAV.slice(0, 2);
  const rightTab = PRIMARY_NAV[2];

  const isActive = (id: string) => active?.id === id;
  const isMoreActive = !PRIMARY_NAV.some((n) => n.id === active?.id);

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
            <NavButton
              key={item.id}
              item={item}
              active={isActive(item.id)}
              onClick={() => router.push(item.href)}
            />
          ))}

          <div className="flex justify-center">
            <AIFab onClick={onAITap} active={aiActive} />
          </div>

          <NavButton
            item={rightTab}
            active={isActive(rightTab.id)}
            onClick={() => router.push(rightTab.href)}
          />
          <NavButton
            item={{ id: "more", label: "Lainnya", icon: MORE_NAV_ICON, href: "#more" }}
            active={isMoreActive}
            onClick={onMoreTap}
          />
        </nav>
      </div>
    </div>
  );
}

interface NavButtonProps {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}

function NavButton({ item, active, onClick }: NavButtonProps) {
  const Icon = item.icon;
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={onClick}
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
