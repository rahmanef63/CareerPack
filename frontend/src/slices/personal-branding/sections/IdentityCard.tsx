"use client";

import Link from "next/link";
import { AlertCircle, ExternalLink, Globe } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import {
  FIELD_LIMITS,
  SLUG_HINT_DEFAULT,
} from "../form/defaults";
import type {
  Bind,
  SectionOverrides,
  SlugValidation,
} from "../form/types";

export interface IdentityCardProps extends SectionOverrides {
  bind: Bind;
  validation: SlugValidation;
  /** Read-only normalised slug for the "open URL" link. */
  slugTrimmed: string;
  /** Whether enabling is allowed (slug valid + min length). */
  canEnable: boolean;
  /** Override the hint copy below the slug input. */
  slugHint?: string;
  /** Override max-length on slug input (mirror server allowance). */
  slugMax?: number;
  /** Override max-length on headline. */
  headlineMax?: number;
  /** When true, render fields only — no outer Card / CardHeader. Used
   *  inside PBSection accordion where the accordion bar already shows
   *  the title. */
  noCard?: boolean;
}

/**
 * Identity layer — slug + enabled toggle + headline.
 * Owns nothing else; other sections own their own fields.
 */
export function IdentityCard({
  bind,
  validation,
  slugTrimmed,
  canEnable,
  title = "Identitas halaman",
  description = "Slug URL, headline, dan saklar publish — landasan halaman publik Anda.",
  className,
  slugHint = SLUG_HINT_DEFAULT,
  slugMax = FIELD_LIMITS.slugMax,
  headlineMax = FIELD_LIMITS.headlineMax,
  noCard = false,
}: IdentityCardProps) {
  const enabled = bind("enabled");
  const slug = bind("slug");
  const headline = bind("headline");
  const fields = (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">Aktifkan halaman publik</p>
          <p className="text-xs text-muted-foreground">
            Saat mati, URL Anda akan merespons 404 seolah tidak pernah ada.
          </p>
        </div>
        <Switch
          checked={enabled.value}
          onCheckedChange={enabled.onChange}
          disabled={!canEnable && !enabled.value}
          aria-label="Aktifkan profil publik"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="pb-slug">Slug URL</Label>
        <div className="flex flex-wrap items-center gap-1.5 sm:flex-nowrap sm:gap-2">
          <span className="text-xs text-muted-foreground sm:text-sm">careerpack.org/</span>
          <Input
            id="pb-slug"
            value={slug.value}
            onChange={(e) => slug.onChange(e.target.value.toLowerCase())}
            placeholder="budi-santoso"
            maxLength={slugMax}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            inputMode="url"
            aria-invalid={!validation.ok}
            className={cn("min-w-0 flex-1", !validation.ok && "border-destructive/60")}
          />
        </div>
        {!validation.ok ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {validation.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{slugHint}</p>
        )}
        {enabled.value && slugTrimmed && validation.ok && (
          <Button
            asChild
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs"
          >
            <Link
              href={`/${slugTrimmed}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Buka /{slugTrimmed}
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="pb-headline">Headline / tagline</Label>
        <Textarea
          id="pb-headline"
          value={headline.value}
          onChange={(e) => headline.onChange(e.target.value)}
          placeholder="Contoh: Frontend Engineer fokus di React + a11y"
          rows={2}
          maxLength={headlineMax}
        />
        <p className="text-xs text-muted-foreground">
          {headline.value.length}/{headlineMax} karakter
        </p>
      </div>
    </div>
  );

  if (noCard) return fields;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4 text-brand" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
