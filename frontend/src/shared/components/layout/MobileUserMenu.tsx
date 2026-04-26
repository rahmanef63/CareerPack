"use client";

import Link from "next/link";
import {
  Bell,
  LogOut,
  Settings,
  UserCircle,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { useAuth } from "@/shared/hooks/useAuth";
import { ROUTES } from "@/shared/lib/routes";

/**
 * Avatar + dropdown for the mobile top bar. Mirrors the desktop
 * `nav-user` menu so authenticated mobile users have a one-tap path
 * to their identity, quick profile, settings, notifications, and —
 * critically — logout. Without this, mobile users had no visible
 * logout outside of the MoreDrawer's account footer (too buried).
 *
 * Unauth: renders nothing — the top bar is otherwise identical for
 * signed-out marketing pages, so we don't want a stale avatar chip.
 */
export function MobileUserMenu() {
  const { state, logout } = useAuth();
  if (!state.isAuthenticated) return null;

  const user = state.user;
  const name = user?.name || "Pengguna";
  const email = user?.email || "";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu akun"
          className="h-11 w-11 rounded-full p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar} alt={name} />
            <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground text-[11px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground text-[11px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              {email && (
                <p className="truncate text-[11px] text-muted-foreground">
                  {email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.dashboard.settings} className="gap-2">
              <UserCircle className="h-4 w-4" />
              Profil Saya
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.dashboard.settings} className="gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.dashboard.notifications} className="gap-2">
              <Bell className="h-4 w-4" />
              Notifikasi
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
