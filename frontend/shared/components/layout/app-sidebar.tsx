"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMain, type NavMainItem } from "@/shared/components/layout/nav-main";
import { NavSecondary, type NavSecondaryItem } from "@/shared/components/layout/nav-secondary";
import { NavUser } from "@/shared/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { BrandMark } from "../brand/Logo";
import { PRIMARY_NAV, activeNavForPath } from "./navConfig";
import { useVisibleMoreApps } from "@/shared/hooks/useVisibleMoreApps";
import {
  useUnreadNotifications,
  formatUnreadBadge,
} from "@/shared/hooks/useUnreadNotifications";
import { InstallSidebarButton } from "@/shared/components/pwa/InstallSidebarButton";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onAITap: () => void;
  aiActive: boolean;
}

/**
 * Sidebar desktop — layout shadcn `dashboard-01` disesuaikan dengan
 * CareerPack nav (PRIMARY_NAV, MORE_APPS) + AI assistant CTA di atas.
 */
export function AppSidebar({ onAITap, aiActive, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const active = activeNavForPath(pathname);
  const visibleMore = useVisibleMoreApps();
  // Live unread-count badge for the notifications nav item, injected
  // over its (empty) static registry badge via the existing `badge` prop.
  const unreadBadge = formatUnreadBadge(useUnreadNotifications());

  const mainItems: NavMainItem[] = PRIMARY_NAV.map((n) => ({
    id: n.id,
    title: n.label,
    url: n.href,
    icon: n.icon,
  }));

  // Two-group split: "Alat Lainnya" (tools the user invokes daily)
  // vs "Akun & Sistem" (notifications/settings/help/admin meta-features).
  // Without the divider the sidebar reads as one long flat list and
  // users mis-classify Settings as a tool of equal weight to Matcher.
  const SYSTEM_IDS = new Set([
    "notifications",
    "settings",
    "help",
    "admin-panel",
  ]);
  const moreItems: NavSecondaryItem[] = visibleMore
    .filter((m) => !SYSTEM_IDS.has(m.id))
    .map((m) => ({
      id: m.id,
      title: m.label,
      url: m.href,
      icon: m.icon,
      badge: m.badge,
    }));
  const systemItems: NavSecondaryItem[] = visibleMore
    .filter((m) => SYSTEM_IDS.has(m.id))
    .map((m) => ({
      id: m.id,
      title: m.label,
      url: m.href,
      icon: m.icon,
      badge: m.id === "notifications" ? unreadBadge ?? m.badge : m.badge,
    }));

  return (
    <Sidebar collapsible="icon" aria-label="Navigasi utama" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground shadow-cta">
                  <BrandMark
                    size={18}
                    stroke="oklch(var(--brand-foreground))"
                    strokeWidth={2.4}
                  />
                </span>
                <span className="text-base font-semibold">CareerPack</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={mainItems}
          activeId={active?.id}
          onAITap={onAITap}
          aiActive={aiActive}
        />
        <NavSecondary
          items={moreItems}
          activeId={active?.id}
          label="Alat Lainnya"
        />
        {systemItems.length > 0 && (
          <NavSecondary
            items={systemItems}
            activeId={active?.id}
            label="Akun & Sistem"
          />
        )}
      </SidebarContent>
      <SidebarFooter>
        <InstallSidebarButton />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
