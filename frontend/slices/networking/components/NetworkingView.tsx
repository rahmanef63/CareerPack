"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Sparkles, Users } from "lucide-react";

import { ResponsivePageHeader } from "@/shared/components/ui/responsive-page-header";
import { ResponsiveCarousel } from "@/shared/components/ui/responsive-carousel";
import { Button } from "@/shared/components/ui/button";
import { QuickFillButton } from "@/shared/components/onboarding";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { NoContacts } from "@/shared/components/illustrations/empty";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useNetworking } from "../hooks/useNetworking";
import type { Contact, ContactFilter, ContactFormValues, ContactRole } from "../types";
import { ROLE_LABELS } from "../constants";
import { ContactCard } from "./ContactCard";
import { ContactForm } from "./ContactForm";
import { PageContainer } from '@/shared/components/layout/PageContainer';

/** Contact doc → editable form values. */
function contactToForm(c: Contact): ContactFormValues {
  return {
    name: c.name,
    role: c.role as ContactRole,
    company: c.company ?? "",
    position: c.position ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    linkedinUrl: c.linkedinUrl ?? "",
    notes: c.notes ?? "",
    avatarEmoji: c.avatarEmoji ?? "",
    avatarHue: c.avatarHue ?? "",
    favorite: Boolean(c.favorite),
  };
}

export function NetworkingView() {
  const {
    contacts,
    isLoading,
    create,
    update,
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
    <PageContainer size="lg" className="space-y-6">
      <ResponsivePageHeader
        title="Jaringan"
        description="Kelola kontak profesional, mentor, dan rekruter."
        actions={
          <>
            <QuickFillButton variant="outline" size="sm" />
            {addButton}
          </>
        }
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
          { label: "Mentor", value: stats.mentor, tint: "text-success-text" },
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
              onToggleFavorite={() => toggleFavorite(c._id)}
              onDelete={() => remove(c._id)}
              onInteract={() => bumpInteraction(c._id)}
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
              <EmptyState
                // ponytail: art only on the true-zero branch; search/role misses stay icon-only.
                illustration={
                  !query && filter === "all" ? NoContacts : undefined
                }
                icon={Users}
                title={
                  query
                    ? "Tidak ada hasil pencarian"
                    : filter === "all"
                      ? "Belum ada kontak"
                      : `Belum ada ${ROLE_LABELS[filter].toLowerCase()}`
                }
                description="Klik Tambah di atas untuk mulai."
                className="rounded-xl border border-dashed border-border bg-card"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <ContactCard
                    key={c._id}
                    contact={c}
                    editTrigger={
                      <ContactForm
                        initial={contactToForm(c)}
                        onSubmit={async (v) => { await update(c._id, v); }}
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label={`Ubah kontak ${c.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                    }
                    onToggleFavorite={() => toggleFavorite(c._id)}
                    onDelete={() => remove(c._id)}
                    onInteract={() => bumpInteraction(c._id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
