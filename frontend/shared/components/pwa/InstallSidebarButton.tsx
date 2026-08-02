"use client";

import { Download } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";

/**
 * Desktop sidebar entry — appears in SidebarFooter only when the
 * browser has fired `beforeinstallprompt` and the PWA isn't already
 * installed. Replaces the old floating InstallChip for the desktop
 * viewport. Collapses gracefully with the icon-only sidebar state.
 */
export function InstallSidebarButton() {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => install()}
          tooltip="Pasang Aplikasi"
          className="border border-dashed border-brand/40 bg-brand-muted/30 text-brand hover:bg-brand-muted/50"
        >
          <Download className="h-4 w-4" />
          <span className="font-medium">Pasang Aplikasi</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
