"use client";

import type { ReactNode } from "react";
import {
  SidebarProvider,
  SidebarInset,
} from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import { SiteHeader } from "@/shared/components/layout/SiteHeader";
import { DashboardFooter } from "@/shared/components/layout/DashboardFooter";

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <AppSidebar onAITap={onAITap} aiActive={aiActive} />
      <SidebarInset id="main-content">
        <SiteHeader onAITap={onAITap} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:p-6">
          {children}
        </div>
        <DashboardFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}
