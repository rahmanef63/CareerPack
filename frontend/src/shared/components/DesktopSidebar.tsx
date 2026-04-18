"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/shared/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { BrandMark } from "./Logo";
import { PRIMARY_NAV, MORE_APPS, activeNavForPath } from "./navConfig";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/shared/lib/utils";

interface DesktopSidebarProps {
  onAITap: () => void;
  aiActive: boolean;
}

/**
 * Sidebar persisten di desktop (≥lg). Collapsible icon-mode via Cmd/Ctrl+B.
 * Tidak membuat SidebarProvider sendiri — owner (DesktopContainer) yang bungkus.
 */
export function DesktopSidebar({ onAITap, aiActive }: DesktopSidebarProps) {
  const pathname = usePathname();
  const active = activeNavForPath(pathname);
  const { state, logout } = useAuth();
  const user = state.user;
  const initials = (user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "var(--shadow-cta)" }}
          >
            <BrandMark size={22} stroke="#fff" strokeWidth={2.4} />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            CareerPack
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = active?.id === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive}
                    >
                      <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Asisten AI"
                  isActive={aiActive}
                  onClick={onAITap}
                  aria-label="Buka Asisten AI"
                  className={cn(
                    "data-[active=true]:bg-gradient-to-r",
                    "data-[active=true]:from-sky-500/10 data-[active=true]:to-indigo-500/10"
                  )}
                >
                  <span className="relative inline-flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                    <Sparkles className="w-3 h-3" />
                  </span>
                  <span>Asisten AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Alat Lainnya</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MORE_APPS.map((item) => {
                const Icon = item.icon;
                const isActive = active?.id === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive}
                    >
                      <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user?.avatar} alt={user?.name ?? "Pengguna"} />
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.name ?? "Pengguna"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="Keluar"
            className="group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
