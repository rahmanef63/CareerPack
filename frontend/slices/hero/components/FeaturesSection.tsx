import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";
import { MORE_APPS, PRIMARY_NAV } from "@/shared/lib/dashboardRegistry";
import type { LucideIcon } from "lucide-react";

// Utility/admin nav entries aren't sellable marketing features — everything
// else in the registry is shown so this list can't drift from the real app.
const HIDDEN_IDS = new Set(["home", "settings", "help", "admin-panel", "notifications", "database"]);

const PRIMARY_HUE: Record<string, string> = {
  cv: "from-brand-from to-brand-to",
  calendar: "from-blue-400 to-blue-600",
};

interface FeatureTile {
  id: string;
  label: string;
  icon: LucideIcon;
  hue: string;
  badge?: string;
}

const FEATURES: FeatureTile[] = [
  ...PRIMARY_NAV.filter((n) => !HIDDEN_IDS.has(n.id)).map((n) => ({
    id: n.id,
    label: n.label,
    icon: n.icon,
    hue: PRIMARY_HUE[n.id] ?? "from-brand-from to-brand-to",
  })),
  ...MORE_APPS.filter((t) => !HIDDEN_IDS.has(t.id) && !t.superAdminOnly).map((t) => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    hue: t.hue,
    ...(t.badge ? { badge: t.badge } : {}),
  })),
];

export function FeaturesSection() {
  return (
    <section className="relative border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <span className="inline-flex items-center gap-2 text-brand">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-brand text-[10px]">02</span>
                Isi Dossier
              </span>
              <span className="h-px w-8 bg-border" />
              <span>{FEATURES.length} Fitur</span>
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Satu Paket, Semua Anda Butuhkan
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Dari lamaran pertama sampai tawaran diterima — setiap alat sudah tersedia begitu Anda masuk.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group flex flex-col gap-4 bg-card p-6 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {feature.badge && (
                    <Badge variant="secondary" className="h-auto px-1.5 py-0.5 text-[9px] font-bold">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-primary-foreground shadow-sm",
                    feature.hue
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-foreground">{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
