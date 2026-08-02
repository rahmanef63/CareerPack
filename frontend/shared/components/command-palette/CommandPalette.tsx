"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/components/ui/command";
import { LogOut, Search as SearchIcon, Settings, Moon, Sun } from "lucide-react";
import { PRIMARY_NAV } from "@/shared/components/layout/navConfig";
import { useVisibleMoreApps } from "@/shared/hooks/useVisibleMoreApps";
import { useAuth } from "@/shared/hooks/useAuth";
import { useTheme } from "next-themes";
import { ROUTES } from "@/shared/lib/routes";

/**
 * Global command palette — ⌘K (macOS) / Ctrl+K (Windows/Linux) opens
 * a fuzzy-searchable launcher for every nav destination + common
 * actions. Inspired by Linear / Raycast / Notion — tools developers
 * evangelize. Mounted once in Providers, listens for the shortcut
 * globally, renders a Radix Dialog wrapper around cmdk.
 *
 * Keyboard:
 *   ⌘K / Ctrl+K → toggle palette
 *   Esc         → close
 *   ↑ / ↓       → navigate items
 *   Enter       → run highlighted item
 *
 * No new Convex calls — pulls from navConfig (already SSoT for the
 * sidebar + drawer) and existing auth / theme hooks, so the palette
 * is always in sync with the rest of the app's nav.
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { state, logout } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const visibleMore = useVisibleMoreApps();
  const [open, setOpen] = useState(false);

  // Shortcut listener — ⌘K / Ctrl+K. Skip when user is typing in an
  // input/textarea so the palette doesn't hijack form editing.
  // Also listens for a "careerpack:open-palette" CustomEvent so any
  // visible UI (header search button, mobile drawer) can trigger
  // without needing access to React state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" || !(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
        // Let ⌘K work inside inputs too — power users expect it.
        // Fall through (don't return).
      }
      e.preventDefault();
      setOpen((v) => !v);
    };
    const onCustom = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("careerpack:open-palette", onCustom);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("careerpack:open-palette", onCustom);
    };
  }, []);

  const run = useCallback(
    (fn: () => void) => {
      return () => {
        setOpen(false);
        // Defer one frame so the Dialog closes before routing fires —
        // avoids a flash of the old page under the fading overlay.
        requestAnimationFrame(() => fn());
      };
    },
    [],
  );

  // Render nothing when unauth — palette is a power-user feature for
  // signed-in users. Marketing + login pages don't need it.
  if (!state.isAuthenticated) return null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Ketik untuk cari fitur atau aksi"
    >
      <Command loop>
        <CommandInput placeholder="Cari fitur atau aksi…  ( ⌘K / Ctrl K )" />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          <CommandGroup heading="Navigasi">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.href}`}
                  onSelect={run(() => router.push(item.href))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {pathname === item.href && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Sekarang
                    </span>
                  )}
                </CommandItem>
              );
            })}
            {visibleMore.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.href}`}
                  onSelect={run(() => router.push(item.href))}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {pathname === item.href && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Sekarang
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Tindakan">
            <CommandItem
              value="pengaturan profil akun"
              onSelect={run(() => router.push(ROUTES.dashboard.settings))}
            >
              <Settings className="mr-2 h-4 w-4" />
              Buka Pengaturan
            </CommandItem>
            <CommandItem
              value="theme mode light dark toggle terang gelap"
              onSelect={run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              Ganti ke mode {resolvedTheme === "dark" ? "terang" : "gelap"}
            </CommandItem>
            <CommandItem
              value="cari pencocok lowongan"
              onSelect={run(() => router.push(ROUTES.dashboard.matcher))}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Cari lowongan yang cocok
            </CommandItem>
            <CommandItem
              value="logout keluar sign out"
              onSelect={run(() => logout())}
              className="text-destructive data-[selected=true]:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
