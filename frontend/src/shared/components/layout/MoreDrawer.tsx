"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Search, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { useHapticPress } from "../interactions/MicroInteractions";
import { type MoreAppTile } from "./navConfig";
import { useVisibleMoreApps } from "@/shared/hooks/useVisibleMoreApps";
import { usePWAInstall } from "@/shared/hooks/usePWAInstall";
import { useAuth } from "@/shared/hooks/useAuth";

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * App-launcher bottom sheet (mobile). Semua tile → router.push(href).
 * Tidak ada prop `onSelect` — nav ditangani langsung.
 */
export function MoreDrawer({ open, onOpenChange }: MoreDrawerProps) {
  const router = useRouter();
  const visibleMore = useVisibleMoreApps();
  const [query, setQuery] = useState("");
  const filteredMore = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleMore;
    return visibleMore.filter(
      (m) =>
        m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [visibleMore, query]);

  return (
    // vaul Drawer — the user can swipe the sheet down from the handle
    // (or any non-scroll region) to dismiss. Sheet (Radix Dialog) was
    // used here before but has no drag gestures — hence the complaint
    // that the drawer couldn't be swiped closed.
    //
    // shouldScaleBackground is disabled because the app body already
    // sits below a BottomNav + TopBar fixed chrome; scaling the whole
    // layout produces a weird gap at the edges on mobile.
    //
    // Height uses dvh so iOS Safari's collapsible address bar doesn't
    // clip the bottom; px cap prevents absurd height on foldables.
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent
        className="!mt-0 h-[min(92dvh,720px)] rounded-t-3xl border-0 p-0 flex flex-col"
      >
        <DrawerHeader className="relative border-b border-border pt-2 pb-3 text-center">
          <DrawerTitle>Semua Fitur</DrawerTitle>
          <DrawerDescription>Geser ke bawah untuk tutup · pilih menu untuk membuka</DrawerDescription>
          <DrawerClose
            aria-label="Tutup"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        {/*
          Scrollable middle = features grid. AccountFooter is pulled
          OUT of the scroll area and rendered below as a sticky bottom
          bar so Keluar is always reachable without scrolling — the
          main complaint on small phones.
        */}
        {/* Sticky search bar above the scroll area so it stays visible
            while the grid scrolls. Filters tiles by label/id. */}
        <div className="border-b border-border bg-background/95 px-4 py-3">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari fitur…"
              className="pl-9"
              aria-label="Cari fitur"
            />
          </div>
        </div>
        {/* `min-h-0` is required: a flex-col child defaults to
            `min-height: auto`, so without it the ScrollArea would grow
            to its content's intrinsic height and push the AccountFooter
            off-screen instead of activating its internal scrollbar. */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 py-5 max-w-md mx-auto w-full space-y-5">
            {!query && <InstallBanner onAfter={() => onOpenChange(false)} />}
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {query ? `Hasil (${filteredMore.length})` : "Fitur"}
              </p>
              {filteredMore.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  Tidak ada fitur cocok dengan &ldquo;{query}&rdquo;.
                </p>
              ) : (
                <div className="grid grid-cols-3 min-[380px]:grid-cols-4 gap-x-2 gap-y-4">
                  {filteredMore.map((tile) => (
                    <TileButton
                      key={tile.id}
                      tile={tile}
                      onClick={() => {
                        router.push(tile.href);
                        onOpenChange(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        {/* Sticky account bar — identity chip + Keluar. Settings is
            intentionally removed here because the mobile top-bar
            avatar menu already exposes it; duplicate buttons just
            cost vertical pixels. */}
        <AccountFooter onClose={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function AccountFooter({ onClose }: { onClose: () => void }) {
  const { state, logout } = useAuth();
  if (!state.isAuthenticated) return null;
  const user = state.user;
  const name = user?.name || "Pengguna";
  const email = user?.email || "";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <footer
      className="border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center gap-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Avatar className="h-10 w-10 shrink-0 rounded-lg">
        <AvatarImage src={user?.avatar} alt={name} />
        <AvatarFallback className="rounded-lg bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {email && (
          <p className="truncate text-[11px] text-muted-foreground">{email}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          logout();
          onClose();
        }}
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </Button>
    </footer>
  );
}

/**
 * Dedicated install banner — full-width card, distinct from the
 * feature tile grid below. Only renders when canInstall is true AND
 * the app isn't already running in standalone mode. Built inline
 * (not reusing InstallDrawerTile) because the visual is completely
 * different — this is a promo card, not an app-launcher tile.
 */
function InstallBanner({ onAfter }: { onAfter: () => void }) {
  const { canInstall, install } = usePWAInstall();
  if (!canInstall) return null;

  const handleInstall = async () => {
    await install();
    onAfter();
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        "bg-gradient-to-br from-brand-muted/60 via-background to-brand-muted/30",
        "px-4 py-4",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-brand/20 blur-2xl"
      />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-brand-foreground shadow-cta">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Pasang Aplikasi CareerPack
          </p>
          <p className="text-[11px] text-muted-foreground">
            Akses lebih cepat, mode offline, notifikasi push.
          </p>
        </div>
        <Button size="sm" onClick={handleInstall} className="flex-shrink-0 bg-brand hover:bg-brand">
          Pasang
        </Button>
      </div>
    </section>
  );
}

interface TileButtonProps {
  tile: MoreAppTile;
  onClick: () => void;
}

function TileButton({ tile, onClick }: TileButtonProps) {
  const Icon = tile.icon;
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tile.label}
      className="flex flex-col items-center gap-1.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      {...press}
    >
      <span
        className={cn(
          "relative w-14 h-14 text-primary-foreground flex items-center justify-center rounded-[32%]",
          "bg-gradient-to-br shadow-md tap-press",
          tile.hue
        )}
      >
        <Icon className="w-7 h-7" />
        {tile.badge && (
          <Badge
            variant="secondary"
            className="absolute -top-1 -right-1 h-auto px-1.5 py-0.5 text-[9px] font-bold bg-background text-foreground shadow"
          >
            {tile.badge}
          </Badge>
        )}
      </span>
      {/* min-h reserves exactly 2 lines of text so all tiles align
          regardless of whether the label is 1 word (e.g. 'Jaringan')
          or 2 words (e.g. 'Simulasi Wawancara'). line-clamp-2 prevents
          unusually long labels from pushing the row taller. */}
      <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 group-active:text-brand min-h-[2rem] line-clamp-2 flex items-start justify-center">
        {tile.label}
      </span>
    </button>
  );
}
