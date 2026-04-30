"use client";

import { useMemo, useState } from "react";
import {
  Folder, Plus, Sparkles, Search, X, Trash2, CheckSquare, Library,
} from "lucide-react";
import Link from "next/link";
import { notify } from "@/shared/lib/notify";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { QuickFillButton } from "@/shared/components/onboarding";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { usePortfolio } from "../hooks/usePortfolio";
import type { PortfolioCategory, PortfolioFilter, PortfolioItem, PortfolioItemId } from "../types";
import { CATEGORY_LABELS } from "../constants";
import { PortfolioCard } from "./PortfolioCard";
import { PortfolioForm } from "./PortfolioForm";
import { PortfolioDetailDialog } from "./PortfolioDetailDialog";
import { PageContainer } from "@/shared/components/layout/PageContainer";

type SortKey = "newest" | "oldest" | "title-asc" | "title-desc";

const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "title-asc", label: "Judul A-Z" },
  { value: "title-desc", label: "Judul Z-A" },
];

export function PortfolioView() {
  const {
    items, isLoading, create, update, remove, bulkRemove, toggleFeatured,
  } = usePortfolio();

  const [filter, setFilter] = useState<PortfolioFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const [detailItem, setDetailItem] = useState<PortfolioItem | null>(null);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PortfolioItem | null>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: items.length, featured: 0 };
    for (const k of Object.keys(CATEGORY_LABELS)) counts[k] = 0;
    for (const i of items) {
      if (i.featured) counts.featured++;
      counts[i.category] = (counts[i.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const featured = useMemo(() => items.filter((i) => i.featured), [items]);

  const filtered = useMemo(() => {
    let list = items.slice();
    if (filter !== "all") list = list.filter((i) => i.category === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.techStack ?? []).some((t) => t.toLowerCase().includes(q)) ||
          (i.skills ?? []).some((s) => s.toLowerCase().includes(q)) ||
          (i.role ?? "").toLowerCase().includes(q) ||
          (i.client ?? "").toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      switch (sort) {
        case "newest": return b.date.localeCompare(a.date);
        case "oldest": return a.date.localeCompare(b.date);
        case "title-asc": return a.title.localeCompare(b.title);
        case "title-desc": return b.title.localeCompare(a.title);
      }
    });
    return list;
  }, [items, filter, search, sort]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  const onBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await bulkRemove(Array.from(selected) as PortfolioItemId[]);
      notify.success(`${selected.size} portofolio dihapus`);
      exitSelectMode();
    } catch (err) {
      notify.fromError(err, "Gagal menghapus");
    }
  };

  return (
    <PageContainer size="lg" className="space-y-6">
      <ResponsivePageHeader
        title="Portofolio"
        description="Showcase proyek, sertifikasi, desain, tulisan, dan karya lainnya."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/library" className="gap-1.5">
                <Library className="h-4 w-4" />
                <span>Library</span>
              </Link>
            </Button>
            <QuickFillButton variant="outline" size="sm" />
            <PortfolioForm
              mode="create"
              onSubmit={async (v) => { await create(v); }}
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Tambah</span>
                </Button>
              }
            />
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, tint: "text-foreground" },
          { label: "Unggulan", value: stats.featured, tint: "text-warning" },
          { label: "Proyek", value: stats.project ?? 0, tint: "text-brand" },
          { label: "Sertifikasi", value: stats.certification ?? 0, tint: "text-success" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.tint}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Featured carousel */}
      {featured.length > 0 && !selectMode && (
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
              onClick={() => setDetailItem(item)}
              onToggleFeatured={async () => { await toggleFeatured(item._id); }}
            />
          ))}
        </ResponsiveCarousel>
      )}

      {/* Toolbar — search + sort + select-mode toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul, tech, skill, peran…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
          {search && (
            <button
              type="button"
              aria-label="Bersihkan"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <ResponsiveSelect value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <ResponsiveSelectTrigger className="h-9 w-[140px]" />
          <ResponsiveSelectContent>
            {SORT_OPTIONS.map((s) => (
              <ResponsiveSelectItem key={s.value} value={s.value}>
                {s.label}
              </ResponsiveSelectItem>
            ))}
          </ResponsiveSelectContent>
        </ResponsiveSelect>
        {selectMode ? (
          <>
            <Badge variant="secondary" className="ml-auto">
              {selected.size} dipilih
            </Badge>
            <Button
              variant="destructive"
              size="sm"
              disabled={selected.size === 0}
              onClick={() => setConfirmBulkDelete(true)}
              className="gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </Button>
            <Button variant="ghost" size="sm" onClick={exitSelectMode}>
              Batal
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectMode(true)}
            className="ml-auto gap-1"
          >
            <CheckSquare className="h-3.5 w-3.5" /> Pilih
          </Button>
        )}
      </div>

      {/* Filter tabs + grid */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as PortfolioFilter)}>
        <TabsList variant="pills">
          <TabsTrigger value="all" className="gap-2">
            Semua
            <Badge variant="secondary" className="h-5 rounded-full px-1.5">
              {stats.total}
            </Badge>
          </TabsTrigger>
          {(Object.keys(CATEGORY_LABELS) as PortfolioCategory[]).map((cat) => {
            const count = stats[cat] ?? 0;
            if (count === 0) return null; // hide empty categories from tab strip
            return (
              <TabsTrigger key={cat} value={cat} className="gap-2">
                {CATEGORY_LABELS[cat]}
                <Badge variant="secondary" className="h-5 rounded-full px-1.5">
                  {count}
                </Badge>
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
                  : (CATEGORY_LABELS[filter as PortfolioCategory] ?? filter).toLowerCase()}
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
                  onClick={() => setDetailItem(item)}
                  onToggleFeatured={async () => { await toggleFeatured(item._id); }}
                  selected={selectMode ? selected.has(String(item._id)) : undefined}
                  onToggleSelect={selectMode ? () => toggleSelect(String(item._id)) : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <PortfolioDetailDialog
        item={detailItem}
        open={!!detailItem}
        onOpenChange={(o) => { if (!o) setDetailItem(null); }}
        onEdit={(item) => {
          setDetailItem(null);
          setEditItem(item);
        }}
        onDelete={(item) => {
          setDetailItem(null);
          setConfirmDelete(item);
        }}
        onToggleFeatured={async (item) => {
          await toggleFeatured(item._id);
        }}
      />

      {/* Edit dialog (controlled) */}
      <PortfolioForm
        mode="edit"
        open={!!editItem}
        onOpenChange={(o) => { if (!o) setEditItem(null); }}
        initialItem={editItem ?? undefined}
        onSubmit={async (v) => {
          if (!editItem) return;
          if (!update) return;
          await update(editItem._id, v);
          setEditItem(null);
        }}
      />

      {/* Single delete confirm */}
      <ResponsiveAlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}
      >
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>Hapus portofolio?</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              {confirmDelete ? `"${confirmDelete.title}" akan dihapus permanen.` : ""}
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await remove(confirmDelete._id);
                  notify.success("Portofolio dihapus");
                } catch (err) {
                  notify.fromError(err, "Gagal menghapus");
                } finally {
                  setConfirmDelete(null);
                }
              }}
            >
              Hapus
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>

      {/* Bulk delete confirm */}
      <ResponsiveAlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>{`Hapus ${selected.size} portofolio?`}</ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Aksi ini tidak bisa dibatalkan.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              variant="destructive"
              onClick={async () => {
                await onBulkDelete();
                setConfirmBulkDelete(false);
              }}
            >
              Hapus semua
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </PageContainer>
  );
}
