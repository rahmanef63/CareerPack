"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Star,
  Trash2,
  Users,
  Calendar,
  Briefcase,
  Tag,
  Target,
} from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/shared/components/ui/responsive-dialog";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { cn } from "@/shared/lib/utils";
import { formatMonthYear } from "@/shared/lib/formatDate";

import type { PortfolioItem, PortfolioLinkKind } from "../types";
import { CATEGORY_LABELS, LINK_KIND_LABELS } from "../constants";

interface Props {
  item: PortfolioItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  onToggleFeatured: (item: PortfolioItem) => void;
}

/**
 * Read-only detail view for a portfolio item — opens when the user
 * clicks a card. Renders the full media gallery, multi-link list,
 * outcomes, collaborators, skills, and meta. Edit/Delete/Featured
 * actions live in the footer so they stay one tap away.
 */
export function PortfolioDetailDialog({
  item,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onToggleFeatured,
}: Props) {
  const [carouselIdx, setCarouselIdx] = useState(0);

  if (!item) return null;

  const media = item.media ?? [];
  const hasGallery = media.length > 0;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            {item.title}
            {item.featured && (
              <Badge variant="secondary" className="bg-warning/20 text-warning">
                <Star className="mr-1 h-3 w-3 fill-current" />
                Unggulan
              </Badge>
            )}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ??
              item.category}{" "}
            · {formatMonthYear(item.date)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            {/* Gallery / cover */}
            {hasGallery ? (
              <div className="relative">
                <div className="relative h-56 overflow-hidden rounded-lg bg-muted sm:h-72">
                  {media[carouselIdx]?.url && media[carouselIdx]?.kind === "image" ? (
                    <Image
                      src={media[carouselIdx].url}
                      alt={media[carouselIdx].caption ?? item.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 720px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      {media[carouselIdx]?.kind ?? "media"}
                    </div>
                  )}
                </div>
                {media.length > 1 && (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2"
                      onClick={() =>
                        setCarouselIdx((i) => (i - 1 + media.length) % media.length)
                      }
                      aria-label="Sebelumnya"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
                      onClick={() => setCarouselIdx((i) => (i + 1) % media.length)}
                      aria-label="Berikutnya"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                      {media.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCarouselIdx(i)}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full transition-all",
                            i === carouselIdx ? "bg-white w-6" : "bg-white/50",
                          )}
                          aria-label={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                {media[carouselIdx]?.caption && (
                  <p className="mt-2 text-xs text-muted-foreground italic">
                    {media[carouselIdx].caption}
                  </p>
                )}
              </div>
            ) : item.coverUrl ? (
              <div className="relative h-56 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.coverUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 720px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={cn(
                  "flex h-40 items-center justify-center rounded-lg bg-gradient-to-br",
                  item.coverGradient ?? "from-slate-500 to-slate-700",
                )}
              >
                <span className="text-5xl">{item.coverEmoji ?? "📄"}</span>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold">Deskripsi</h3>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {item.role && (
                <MetaRow icon={Briefcase} label="Peran" value={item.role} />
              )}
              {item.client && (
                <MetaRow icon={Users} label="Klien" value={item.client} />
              )}
              {item.duration && (
                <MetaRow icon={Calendar} label="Durasi" value={item.duration} />
              )}
            </div>

            {/* Links */}
            {(item.links?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Tautan</h3>
                <ul className="space-y-1.5">
                  {item.links!.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-border p-2 hover:border-brand"
                      >
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {LINK_KIND_LABELS[l.kind as PortfolioLinkKind] ?? l.kind}
                        </Badge>
                        <span className="flex-1 truncate text-sm font-medium">{l.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.link && !(item.links?.length) && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {item.link}
              </a>
            )}

            {/* Outcomes */}
            {(item.outcomes?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="flex items-center gap-1 text-sm font-semibold">
                  <Target className="h-3.5 w-3.5" />
                  Outcome
                </h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {item.outcomes!.map((o, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-success">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags row: tech + skills + collaborators */}
            <div className="space-y-2">
              {(item.techStack?.length ?? 0) > 0 && (
                <ChipRow label="Tech / Tool" items={item.techStack!} icon={Tag} />
              )}
              {(item.skills?.length ?? 0) > 0 && (
                <ChipRow label="Skill" items={item.skills!} icon={Tag} />
              )}
              {(item.collaborators?.length ?? 0) > 0 && (
                <ChipRow
                  label="Kolaborator"
                  items={item.collaborators!}
                  icon={Users}
                />
              )}
            </div>
          </div>
        </ScrollArea>

        <ResponsiveDialogFooter className="flex-row justify-between gap-2 sm:flex-row">
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onToggleFeatured(item)}
            >
              <Star
                className={cn(
                  "mr-1 h-3.5 w-3.5",
                  item.featured && "fill-warning text-warning",
                )}
              />
              {item.featured ? "Hapus unggulan" : "Jadikan unggulan"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Hapus
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <Edit3 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border p-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
        <p className="truncate text-sm">{value}</p>
      </div>
    </div>
  );
}

function ChipRow({
  label,
  items,
  icon: Icon,
}: {
  label: string;
  items: ReadonlyArray<string>;
  icon: React.ElementType;
}) {
  return (
    <div>
      <h4 className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </h4>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((t) => (
          <Badge key={t} variant="secondary" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}
