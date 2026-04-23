"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useNetworking } from "../hooks/useNetworking";
import type { ContactFilter, ContactRole } from "../types";
import { ROLE_LABELS } from "../constants";
import { ContactCard } from "./ContactCard";
import { ContactForm } from "./ContactForm";

export function NetworkingView() {
  const {
    contacts,
    isLoading,
    create,
    remove,
    toggleFavorite,
    bumpInteraction,
  } = useNetworking();
  const [filter, setFilter] = useState<ContactFilter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    return {
      total: contacts.length,
      recruiter: contacts.filter((c) => c.role === "recruiter").length,
      mentor: contacts.filter((c) => c.role === "mentor").length,
      peer: contacts.filter((c) => c.role === "peer").length,
      other: contacts.filter((c) => c.role === "other").length,
      favorite: contacts.filter((c) => c.favorite).length,
    };
  }, [contacts]);

  const favorites = useMemo(
    () => contacts.filter((c) => c.favorite),
    [contacts],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byRole =
      filter === "all" ? contacts : contacts.filter((c) => c.role === filter);
    if (!q) return byRole;
    return byRole.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.position?.toLowerCase().includes(q),
    );
  }, [contacts, filter, query]);

  const addButton = (
    <ContactForm
      onSubmit={async (v) => {
        await create(v);
      }}
      trigger={
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Tambah</span>
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <ResponsivePageHeader
        title="Jaringan"
        description="Kelola kontak profesional, mentor, dan rekruter."
        actions={addButton}
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, tint: "text-foreground" },
          { label: "Favorit", value: stats.favorite, tint: "text-warning" },
          {
            label: "Rekruter",
            value: stats.recruiter,
            tint: "text-brand",
          },
          { label: "Mentor", value: stats.mentor, tint: "text-success" },
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

      {/* Favorites carousel */}
      {favorites.length > 0 && (
        <ResponsiveCarousel
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              Kontak Favorit
            </span>
          }
          description="Yang paling sering Anda hubungi"
          cellWidth="w-64 sm:w-72"
        >
          {favorites.map((c) => (
            <ContactCard
              key={c._id}
              contact={c}
              variant="carousel"
              onToggleFavorite={async () => {
                await toggleFavorite(c._id);
              }}
              onDelete={async () => {
                await remove(c._id);
                toast.success("Kontak dihapus");
              }}
              onInteract={async () => {
                await bumpInteraction(c._id);
              }}
            />
          ))}
        </ResponsiveCarousel>
      )}

      {/* Search + filter tabs */}
      <div className="space-y-3">
        <Input
          type="search"
          placeholder="Cari nama, perusahaan, posisi…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Tabs value={filter} onValueChange={(v) => setFilter(v as ContactFilter)}>
          <TabsList variant="pills">
            <TabsTrigger value="all" className="gap-2">
              Semua
              <Badge variant="secondary" className="h-5 rounded-full px-1.5">
                {stats.total}
              </Badge>
            </TabsTrigger>
            {(Object.keys(ROLE_LABELS) as ContactRole[]).map((role) => {
              const count = stats[role];
              return (
                <TabsTrigger key={role} value={role} className="gap-2">
                  {ROLE_LABELS[role]}
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full px-1.5"
                    >
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
                    className="h-40 animate-pulse rounded-xl border border-border bg-muted/30"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {query
                    ? "Tidak ada hasil pencarian"
                    : filter === "all"
                      ? "Belum ada kontak"
                      : `Belum ada ${ROLE_LABELS[filter].toLowerCase()}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Klik Tambah di atas untuk mulai.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ContactCard
                    key={c._id}
                    contact={c}
                    onToggleFavorite={async () => {
                      await toggleFavorite(c._id);
                    }}
                    onDelete={async () => {
                      await remove(c._id);
                      toast.success("Kontak dihapus");
                    }}
                    onInteract={async () => {
                      await bumpInteraction(c._id);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
