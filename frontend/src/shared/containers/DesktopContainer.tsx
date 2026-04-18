"use client";

import type { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
} from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/app-sidebar";
import { SiteHeader } from "@/shared/components/SiteHeader";

interface DesktopContainerProps {
  onAITap: () => void;
  aiActive: boolean;
  children: ReactNode;
}

/**
 * Container untuk layar ≥ lg. Mengikuti pola shadcn `dashboard-01`:
 * SidebarProvider + Sidebar kiri + SidebarInset (konten utama) +
 * SiteHeader di atas.
 */
export function DesktopContainer({
  onAITap,
  aiActive,
  children,
}: DesktopContainerProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar onAITap={onAITap} aiActive={aiActive} />
      <SidebarInset>
        <SiteHeader onAITap={onAITap} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
