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
                aria-label="Buka Asisten AI"
                className={cn(
                  "min-w-8 bg-primary text-primary-foreground duration-200 ease-linear",
                  "hover:bg-primary/90 hover:text-primary-foreground",
                  "active:bg-primary/90 active:text-primary-foreground",
                )}
              >
                <Sparkles />
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
