"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LogOut,
  Moon,
  Sparkles,
  Sun,
  Monitor,
  User as UserIcon,
  Shield,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
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
        <ThemeToggle />
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const current = theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Ganti tema">
          <Sun className="w-4 h-4 dark:hidden" />
          <Moon className="w-4 h-4 hidden dark:inline" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Mode Tampilan</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="w-4 h-4 mr-2" /> Terang
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="w-4 h-4 mr-2" /> Gelap
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="w-4 h-4 mr-2" /> Sistem
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
