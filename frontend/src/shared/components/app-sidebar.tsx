"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMain, type NavMainItem } from "@/shared/components/nav-main";
import { NavSecondary, type NavSecondaryItem } from "@/shared/components/nav-secondary";
import { NavUser } from "@/shared/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { BrandMark } from "./Logo";
import { PRIMARY_NAV, MORE_APPS, activeNavForPath } from "./navConfig";

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

  const mainItems: NavMainItem[] = PRIMARY_NAV.map((n) => ({
    id: n.id,
    title: n.label,
    url: n.href,
    icon: n.icon,
  }));

  const moreItems: NavSecondaryItem[] = MORE_APPS.map((m) => ({
    id: m.id,
    title: m.label,
    url: m.href,
    icon: m.icon,
    badge: m.badge,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white"
                  style={{ boxShadow: "var(--shadow-cta)" }}
                >
                  <BrandMark size={18} stroke="#fff" strokeWidth={2.4} />
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
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
