"use client";

import Link from "next/link";
import { Sparkles, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { cn } from "@/shared/lib/utils";

export interface NavMainItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
}

interface NavMainProps {
  items: NavMainItem[];
  activeId?: string | null;
  onAITap?: () => void;
  aiActive?: boolean;
}

export function NavMain({ items, activeId, onAITap, aiActive }: NavMainProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {onAITap && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Asisten AI"
                isActive={aiActive}
                onClick={onAITap}
                aria-label={aiActive ? "Tutup Asisten AI" : "Buka Asisten AI"}
                aria-pressed={aiActive}
                className={cn(
                  "min-w-8 duration-200 ease-linear",
                  // Inactive: gradient AI accent ringan, bukan full primary bg
                  "bg-gradient-to-r from-sky-500/10 to-indigo-500/10 text-foreground",
                  "hover:from-sky-500/20 hover:to-indigo-500/20",
                  // Active: full AI gradient
                  aiActive &&
                    "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                )}
              >
                <Sparkles
                  className={cn(aiActive ? "" : "text-sky-500")}
                />
                <span>Asisten AI</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                  <Link href={item.url} aria-current={isActive ? "page" : undefined}>
                    {Icon && <Icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
