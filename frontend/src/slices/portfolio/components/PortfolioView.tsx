"use client";

import { useMemo, useState } from "react";
import { Folder, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { usePortfolio } from "../hooks/usePortfolio";
import type { PortfolioCategory, PortfolioFilter } from "../types";
import { CATEGORY_LABELS } from "../constants";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioForm } from "./PortfolioForm";

export function PortfolioView() {
  const { items, isLoading, create, remove, toggleFeatured } = usePortfolio();
  const [filter, setFilter] = useState<PortfolioFilter>("all");

  const stats = useMemo(() => {
    return {
      total: items.length,
      project: items.filter((i) => i.category === "project").length,
      certification: items.filter((i) => i.category === "certification")
        .length,
      publication: items.filter((i) => i.category === "publication").length,
      featured: items.filter((i) => i.featured).length,
    };
  }, [items]);

  const featured = useMemo(
    () => items.filter((i) => i.featured),
    [items],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const addButton = (
    <PortfolioForm
      onSubmit={async (v) => {
        await create(v);
      }}
      trigger={
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah</span>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <ResponsivePageHeader
        title="Portofolio"
        description="Showcase proyek, sertifikasi, dan publikasi terbaik Anda."
        actions={addButton}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, tint: "text-foreground" },
          { label: "Unggulan", value: stats.featured, tint: "text-warning" },
          { label: "Proyek", value: stats.project, tint: "text-brand" },
          {
            label: "Sertifikasi",
            value: stats.certification,
            tint: "text-success",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-card p-3"
          >
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tint}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Featured carousel */}
      {featured.length > 0 && (
        <ResponsiveCarousel
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Unggulan
            </span>
          }
          description="Yang Anda pilih untuk ditampilkan lebih dulu"
          cellWidth="w-64 sm:w-72"
        >
          {featured.map((item) => (
            <PortfolioCard
              key={item._id}
              item={item}
              variant="carousel"
              onToggleFeatured={async () => {
                await toggleFeatured(item._id);
              }}
              onDelete={async () => {
                await remove(item._id);
                toast.success("Portofolio dihapus");
              }}
            />
          ))}
        </ResponsiveCarousel>
      )}

      {/* Filter tabs + grid */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as PortfolioFilter)}
      >
        <TabsList variant="pills">
          <TabsTrigger value="all" className="gap-2">
            Semua
            <Badge variant="secondary" className="h-5 rounded-full px-1.5">
              {stats.total}
            </Badge>
          </TabsTrigger>
          {(Object.keys(CATEGORY_LABELS) as PortfolioCategory[]).map((cat) => {
            const count = stats[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="gap-2">
                {CATEGORY_LABELS[cat]}
                {count > 0 && (
                  <Badge variant="secondary" className="h-5 rounded-full px-1.5">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-xl border border-border bg-muted/30"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Folder className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Belum ada{" "}
                {filter === "all"
                  ? "portofolio"
                  : CATEGORY_LABELS[filter].toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik Tambah di atas untuk mulai.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <PortfolioCard
                  key={item._id}
                  item={item}
                  onToggleFeatured={async () => {
                    await toggleFeatured(item._id);
                  }}
                  onDelete={async () => {
                    await remove(item._id);
                    toast.success("Portofolio dihapus");
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
