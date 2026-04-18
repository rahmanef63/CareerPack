"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { StaggerList, useHapticPress } from "./MicroInteractions";
import { MORE_APPS, type MoreAppTile } from "./navConfig";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[min(80vh,680px)] rounded-t-3xl p-0 flex flex-col"
      >
        <SheetHeader className="text-center border-b border-border pt-5">
          <SheetTitle>Semua Fitur</SheetTitle>
          <SheetDescription>Pilih menu untuk membuka</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-6 max-w-md mx-auto w-full">
            <StaggerList step={28} className="grid grid-cols-4 gap-x-3 gap-y-5">
              {MORE_APPS.map((tile) => (
                <TileButton
                  key={tile.id}
                  tile={tile}
                  onClick={() => {
                    router.push(tile.href);
                    onOpenChange(false);
                  }}
                />
              ))}
            </StaggerList>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
          "relative w-14 h-14 text-white flex items-center justify-center",
          "bg-gradient-to-br shadow-md tap-press",
          tile.hue
        )}
        style={{ borderRadius: "32%" }}
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
      <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 group-active:text-career-700">
        {tile.label}
      </span>
    </button>
  );
}
