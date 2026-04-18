"use client";

import { LogOut } from "lucide-react";
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
import { PRIMARY_NAV, MORE_APPS } from "./navConfig";
import type { NavId } from "./navConfig";
import { useAuth } from "@/shared/hooks/useAuth";

interface DesktopSidebarProps {
  current: string;
  onSelect: (id: NavId) => void;
  onAITap: () => void;
  aiActive: boolean;
}

export function DesktopSidebar({
  current,
  onSelect,
  onAITap,
  aiActive,
}: DesktopSidebarProps) {
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
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={current === item.id}
                      onClick={() => onSelect(item.id)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Asisten AI"
                  isActive={aiActive}
                  onClick={onAITap}
                  className="data-[active=true]:bg-gradient-to-r data-[active=true]:from-sky-500/10 data-[active=true]:to-indigo-500/10"
                >
                  <span className="relative inline-flex w-5 h-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor" aria-hidden>
                      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
                    </svg>
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
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={current === item.id}
                      onClick={() => onSelect(item.id)}
                    >
                      <Icon />
                      <span>{item.label}</span>
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
