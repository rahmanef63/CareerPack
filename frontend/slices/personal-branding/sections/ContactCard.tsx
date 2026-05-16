"use client";

import { Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { FIELD_LIMITS } from "../form/defaults";
import type { Bind, SectionOverrides } from "../form/types";

export interface ContactCardProps extends SectionOverrides {
  bind: Bind;
  emailMax?: number;
  noCard?: boolean;
}

export function ContactCard({
  bind,
  title = "Kontak publik",
  description = "Email + tautan eksternal yang muncul di mode Otomatis lewat blok Sosial.",
  className,
  emailMax = FIELD_LIMITS.contactEmailMax,
  noCard = false,
}: ContactCardProps) {
  const email = bind("contactEmail");
  const linkedin = bind("linkedinUrl");
  const portfolio = bind("portfolioUrl");
  const fields = (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="pb-contact">Email kontak (opsional)</Label>
        <Input
          id="pb-contact"
          type="email"
          value={email.value}
          onChange={(e) => email.onChange(e.target.value)}
          placeholder="kerjasama@email.com"
          maxLength={emailMax}
        />
        <p className="text-xs text-muted-foreground">
          Sengaja terpisah dari email login — jangan pakai email auth Anda.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pb-linkedin">LinkedIn URL</Label>
          <Input
            id="pb-linkedin"
            type="url"
            value={linkedin.value}
            onChange={(e) => linkedin.onChange(e.target.value)}
            placeholder="https://linkedin.com/in/…"
            inputMode="url"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pb-portfolio">Portfolio URL</Label>
          <Input
            id="pb-portfolio"
            type="url"
            value={portfolio.value}
            onChange={(e) => portfolio.onChange(e.target.value)}
            placeholder="https://…"
            inputMode="url"
          />
        </div>
      </div>
    </div>
  );

  if (noCard) return fields;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4 text-brand" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  );
}
