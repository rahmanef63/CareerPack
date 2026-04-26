"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Sparkles,
  User as UserIcon,
  Shield,
  Search,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { ThemePresetSwitcher } from "@/shared/components/theme/ThemePresetSwitcher";
import { useAuth } from "@/shared/hooks/useAuth";
import { labelForPath } from "./navConfig";

interface SiteHeaderProps {
  onAITap: () => void;
}

/**
 * Top bar untuk area dashboard — pola shadcn `dashboard-01`:
 * SidebarTrigger + Breadcrumb + spacer + actions (theme, AI, user menu).
 */
export function SiteHeader({ onAITap }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useAuth();
  const user = state.user;
  const label = labelForPath(pathname) ?? "Dashboard";
  const initials = (user?.name || "U").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur px-3 lg:px-4">
      <SidebarTrigger className="-ml-1" aria-label="Lipat / buka sidebar" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden sm:block">
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {pathname !== "/dashboard" && (
            <>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {pathname === "/dashboard" && (
            <BreadcrumbItem className="sm:hidden">
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search trigger — opens CommandPalette via custom event so
            we don't have to lift its open-state into React context.
            Cmd/Ctrl+K still works globally. The visible button helps
            users who don't know the shortcut (most users). */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("careerpack:open-palette"))
          }
          aria-label="Cari fitur atau halaman"
          className="hidden gap-2 text-muted-foreground sm:inline-flex sm:min-w-[14rem] sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Cari fitur, halaman, aksi…</span>
          </span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono lg:inline">
            ⌘K
          </kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("careerpack:open-palette"))
          }
          className="sm:hidden"
          aria-label="Cari"
        >
          <Search className="h-4 w-4" />
        </Button>
        {/* Unified theme controller — mode tabs + preset palette in
            one Popover (replaces the previous two-button setup). */}
        <ThemePresetSwitcher />
        <Button
          type="button"
          onClick={onAITap}
          size="sm"
          variant="outline"
          className="gap-1.5 hidden sm:inline-flex"
          aria-label="Buka Asisten AI"
        >
          <Sparkles className="w-4 h-4 text-brand" />
          <span>Asisten AI</span>
        </Button>
        <Button
          type="button"
          onClick={onAITap}
          size="icon"
          variant="outline"
          className="sm:hidden"
          aria-label="Buka Asisten AI"
        >
          <Sparkles className="w-4 h-4 text-brand" />
        </Button>
        <UserMenu
          initials={initials}
          name={user?.name}
          email={user?.email}
          avatar={user?.avatar}
          role={user?.role}
          onLogout={() => {
            logout();
            router.push("/");
          }}
          onSettings={() => router.push("/dashboard/settings")}
          onAdmin={() => router.push("/admin")}
        />
      </div>
    </header>
  );
}

interface UserMenuProps {
  initials: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  onLogout: () => void;
  onSettings: () => void;
  onAdmin: () => void;
}

function UserMenu({
  initials,
  name,
  email,
  avatar,
  role,
  onLogout,
  onSettings,
  onAdmin,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Menu akun" className="rounded-full">
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatar} alt={name ?? "Pengguna"} />
            <AvatarFallback className="bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{name ?? "Pengguna"}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSettings}>
          <UserIcon className="w-4 h-4 mr-2" /> Profil &amp; Tampilan
        </DropdownMenuItem>
        {role === "admin" && (
          <DropdownMenuItem onSelect={onAdmin}>
            <Shield className="w-4 h-4 mr-2" /> Admin Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onLogout} className="text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4 mr-2" /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
