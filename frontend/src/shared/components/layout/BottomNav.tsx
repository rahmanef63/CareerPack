"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { AIFab } from "../ai/AIFab";
import { Ripple, useHapticPress } from "../interactions/MicroInteractions";
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
      // Outer wrapper has zero padding — the nav-shell extends fully
      // to the viewport bottom edge (margin: 0 from CSS nav-style flat).
      // Previously paddingBottom var(--safe-bottom) here left a
      // transparent strip below the colored shell, so on phones with
      // a home indicator you'd see content peeking through between
      // the nav and the edge.
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      {/* Padding now lives INSIDE the nav-shell so the bg-card color
          extends all the way to the bottom of the viewport while
          icons stay above the home-indicator inset. 0.5rem extra
          (= 8 px) above the safe area for comfortable tap rhythm. */}
      <div
        className="nav-shell relative bg-card border-t border-border"
        style={{
          paddingBottom: "calc(var(--safe-bottom) + 0.5rem)",
        }}
      >
        {/* The "notched" nav-style used to render an SVG cutout above
            the AI FAB to suggest the FAB punches through the bar.
            Removed — the curve was visually noisy and didn't reliably
            line up across themes. The FAB now sits over a clean bar
            for every nav-style; "notched" keeps just the rounded top
            corners + soft shadow as a tonal differentiator. */}

        <nav
          className="grid grid-cols-5 h-[var(--nav-height)] items-center max-w-3xl mx-auto px-3"
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
      onClick={(e) => {
        // Blur before invoking — otherwise opening the More drawer
        // leaves focus on this button while Radix/vaul applies
        // aria-hidden to the BottomNav, which the browser blocks
        // with a "descendant retained focus" warning.
        e.currentTarget.blur();
        onClick();
      }}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 h-full rounded-xl mx-1 px-1",
        "text-[11px] font-medium transition-colors tap-press",
        active ? "text-brand" : "text-muted-foreground"
      )}
      {...press}
    >
      <Ripple />
      <span
        className={cn(
          "relative w-10 h-10 rounded-xl flex items-center justify-center",
          active && "bg-brand-muted"
        )}
      >
        <Icon className={cn("w-5 h-5", active && "animate-badge-bounce")} />
      </span>
      <span className="truncate max-w-[64px]">{item.label}</span>
    </button>
  );
}
