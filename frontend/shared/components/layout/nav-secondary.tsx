"use client";

import * as React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";

export interface NavSecondaryItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSecondaryProps
  extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  items: NavSecondaryItem[];
  activeId?: string | null;
  label?: string;
}

export function NavSecondary({
  items,
  activeId,
  label,
  ...props
}: NavSecondaryProps) {
  return (
    <SidebarGroup {...props}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                >
                  <Link
                    href={item.url}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon />
                    {/* SidebarMenuButton auto-truncates only `span:last-child`
                        — the badge, whenever there is one. So a long title
                        (Google Translate: "Notifikasi" → "Benachrichtigungen")
                        shoves the unread count past the button's
                        overflow-hidden edge unless these two classes are here. */}
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                        {item.badge}
                      </span>
                    )}
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
