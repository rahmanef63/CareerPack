"use client";

import {
  Briefcase,
  Linkedin,
  Mail,
  Phone,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { Contact, ContactRole } from "../types";
import { ROLE_EMOJIS, ROLE_LABELS } from "../constants";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

interface ContactCardProps {
  contact: Contact;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onInteract: (channel: "email" | "phone" | "linkedin") => void;
  variant?: "list" | "carousel";
}

export function ContactCard({
  contact: c,
  onToggleFavorite,
  onDelete,
  onInteract,
  variant = "list",
}: ContactCardProps) {
  const emoji =
    c.avatarEmoji || ROLE_EMOJIS[c.role as ContactRole] || "👤";
  const hue = c.avatarHue ?? "from-slate-400 to-slate-600";
  const isCarousel = variant === "carousel";

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md",
        isCarousel && "w-full",
      )}
    >
      <header className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-2xl text-brand-foreground",
            hue,
          )}
          aria-hidden="true"
          title={initials(c.name)}
        >
          {c.avatarEmoji ? emoji : initials(c.name) || emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 font-semibold text-foreground">
              {c.name}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={onToggleFavorite}
              aria-label={c.favorite ? "Lepas favorit" : "Jadikan favorit"}
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  c.favorite && "fill-warning text-warning",
                )}
              />
            </Button>
          </div>
          <Badge variant="secondary" className="mt-0.5">
            {ROLE_LABELS[c.role as ContactRole] ?? c.role}
          </Badge>
        </div>
      </header>

      {(c.position || c.company) && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Briefcase className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {[c.position, c.company].filter(Boolean).join(" · ")}
          </span>
        </p>
      )}

      {c.notes && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1">
          {c.email && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onInteract("email")}
              aria-label="Kirim email"
            >
              <a href={`mailto:${c.email}`}>
                <Mail className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {c.phone && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onInteract("phone")}
              aria-label="Telepon"
            >
              <a href={`tel:${c.phone}`}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          {c.linkedinUrl && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onInteract("linkedin")}
              aria-label="LinkedIn"
            >
              <a
                href={c.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={onDelete}
          aria-label="Hapus"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </footer>
    </article>
  );
}
