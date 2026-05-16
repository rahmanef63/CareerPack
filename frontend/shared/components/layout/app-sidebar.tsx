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

  const mainItems: NavMainItem[] = PRIMARY_NAV.map((n) => ({
    id: n.id,
    title: n.label,
    url: n.href,
    icon: n.icon,
  }));

  const moreItems: NavSecondaryItem[] = visibleMore.map((m) => ({
    id: m.id,
    title: m.label,
    url: m.href,
    icon: m.icon,
    badge: m.badge,
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
      </SidebarContent>
      <SidebarFooter>
        <InstallSidebarButton />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
