"use client";

import {
  Map,
  ListChecks,
  Briefcase,
  LineChart,
  Wallet,
  Bell,
  Settings as SettingsIcon,
  MessageSquare,
  Users,
  Folder,
  Compass,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/shared/components/ui/drawer";
import { cn } from "@/shared/lib/utils";
import { StaggerList, useHapticPress } from "./MicroInteractions";

export type MoreView =
  | "roadmap"
  | "checklist"
  | "applications"
  | "dashboard"
  | "calculator"
  | "notifications"
  | "settings"
  | "interview"
  | "networking"
  | "portfolio"
  | "matcher"
  | "help";

interface Tile {
  id: MoreView;
  label: string;
  icon: LucideIcon;
  hue: string;
  badge?: string;
}

const TILES: Tile[] = [
  { id: "roadmap", label: "Roadmap Karir", icon: Map, hue: "from-sky-400 to-sky-600" },
  { id: "checklist", label: "Ceklis Dokumen", icon: ListChecks, hue: "from-emerald-400 to-emerald-600" },
  { id: "applications", label: "Lamaran", icon: Briefcase, hue: "from-violet-400 to-violet-600" },
  { id: "dashboard", label: "Dashboard", icon: LineChart, hue: "from-indigo-400 to-indigo-600" },
  { id: "calculator", label: "Kalkulator Gaji", icon: Wallet, hue: "from-amber-400 to-amber-600" },
  { id: "interview", label: "Persiapan Wawancara", icon: MessageSquare, hue: "from-pink-400 to-pink-600" },
  { id: "matcher", label: "Pencocok Lowongan", icon: Compass, hue: "from-cyan-400 to-cyan-600", badge: "AI" },
  { id: "networking", label: "Jaringan", icon: Users, hue: "from-rose-400 to-rose-600" },
  { id: "portfolio", label: "Portofolio", icon: Folder, hue: "from-orange-400 to-orange-600" },
  { id: "notifications", label: "Notifikasi", icon: Bell, hue: "from-yellow-400 to-yellow-600" },
  { id: "settings", label: "Profil & Tampilan", icon: SettingsIcon, hue: "from-slate-500 to-slate-700" },
  { id: "help", label: "Pusat Bantuan", icon: HelpCircle, hue: "from-teal-400 to-teal-600" },
];

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: MoreView) => void;
}

export function MoreDrawer({ open, onOpenChange, onSelect }: MoreDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card">
        <DrawerHeader className="text-center">
          <DrawerTitle>Semua Fitur</DrawerTitle>
          <p className="text-sm text-muted-foreground">Pilih menu untuk membuka</p>
        </DrawerHeader>

        <div className="px-4 pb-8 max-w-md mx-auto w-full">
          <StaggerList step={28} className="grid grid-cols-4 gap-x-3 gap-y-5">
            {TILES.map((tile) => (
              <TileButton
                key={tile.id}
                tile={tile}
                onClick={() => {
                  onSelect(tile.id);
                  onOpenChange(false);
                }}
              />
            ))}
          </StaggerList>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function TileButton({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  const Icon = tile.icon;
  const press = useHapticPress();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group focus:outline-none"
      {...press}
    >
      <span
        className={cn(
          "relative w-14 h-14 rounded-2xl text-white flex items-center justify-center",
          "bg-gradient-to-br shadow-md tap-press",
          tile.hue
        )}
        style={{ borderRadius: "32%" /* squircle-ish */ }}
      >
        <Icon className="w-7 h-7" />
        {tile.badge && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-white text-slate-900 rounded-full shadow">
            {tile.badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium text-center leading-tight text-foreground/80 group-active:text-career-700">
        {tile.label}
      </span>
    </button>
  );
}
