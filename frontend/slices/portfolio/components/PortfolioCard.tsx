"use client";

import Image from "next/image";
import { ExternalLink, Star, Image as ImageIcon } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/lib/utils";
import { formatMonthYear } from "@/shared/lib/formatDate";
import type { PortfolioItem } from "../types";
import { CATEGORY_LABELS } from "../constants";

interface PortfolioCardProps {
  item: PortfolioItem;
  onClick: () => void;
  onToggleFeatured: () => void;
  variant?: "grid" | "carousel";
  /** When defined, the card shows a checkbox in select mode. */
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function PortfolioCard({
  item,
  onClick,
  onToggleFeatured,
  variant = "grid",
  selected,
  onToggleSelect,
}: PortfolioCardProps) {
  const compact = variant === "carousel";
  const selectMode = onToggleSelect !== undefined;
  const galleryCount = item.media?.length ?? 0;
  const linkCount = item.links?.length ?? (item.link ? 1 : 0);
  const primaryLink = item.links?.[0]?.url ?? item.link;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
        selected ? "border-brand ring-2 ring-brand" : "border-border",
        compact && "w-full",
      )}
    >
      {/* Cover — clickable area opens detail */}
      <button
        type="button"
        onClick={(e) => {
          if (selectMode) {
            e.preventDefault();
            onToggleSelect?.();
            return;
          }
          onClick();
        }}
        className={cn(
          "relative overflow-hidden text-left",
          !item.coverUrl && "flex items-center justify-center bg-gradient-to-br",
          !item.coverUrl && (item.coverGradient ?? "from-slate-500 to-slate-700"),
          compact ? "h-28" : "h-32",
        )}
      >
        {item.coverUrl ? (
          <Image
            src={item.coverUrl}
            alt={item.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 320px"
            className="object-cover"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">
            {item.coverEmoji ?? "📄"}
          </span>
        )}
        {item.featured && (
          <Badge className="absolute left-2 top-2 gap-1 bg-brand-foreground/90 text-foreground">
            <Star className="h-3 w-3 fill-current" />
            Unggulan
          </Badge>
        )}
        <Badge
          variant="secondary"
          className="absolute right-2 top-2 bg-black/40 text-white backdrop-blur-sm"
        >
          {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category}
        </Badge>
        {galleryCount > 1 && (
          <Badge className="absolute bottom-2 right-2 gap-1 bg-black/40 text-white backdrop-blur-sm">
            <ImageIcon className="h-3 w-3" /> {galleryCount}
          </Badge>
        )}
      </button>

      {/* Multi-select checkbox — top-left overlay */}
      {selectMode && (
        <div className="absolute left-2 top-2 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.()}
            aria-label="Pilih"
            className="h-5 w-5 bg-card/80 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Body */}
      <button
        type="button"
        onClick={() => (selectMode ? onToggleSelect?.() : onClick())}
        className="flex min-h-0 flex-1 flex-col gap-2 p-3 text-left"
      >
        <div>
          <h3 className="line-clamp-1 font-semibold text-foreground">{item.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatMonthYear(item.date)}
            {item.role && ` · ${item.role}`}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        {item.techStack && item.techStack.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1">
            {item.techStack.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-[10px]">
                {tech}
              </Badge>
            ))}
            {item.techStack.length > 3 && (
              <Badge variant="secondary" className="text-[10px]">
                +{item.techStack.length - 3}
              </Badge>
            )}
          </div>
        )}
      </button>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        {primaryLink ? (
          <a
            href={primaryLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {linkCount > 1 ? `${linkCount} tautan` : "Buka"}
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">&nbsp;</span>
        )}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured();
            }}
            aria-label={item.featured ? "Hapus unggulan" : "Jadikan unggulan"}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                item.featured && "fill-warning text-warning",
              )}
            />
          </Button>
        </div>
      </div>
    </article>
  );
}
