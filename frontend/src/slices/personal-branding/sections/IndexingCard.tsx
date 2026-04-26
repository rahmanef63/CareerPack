"use client";

import { ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import type { Bind, SectionOverrides } from "../form/types";

export interface IndexingCardProps extends SectionOverrides {
  bind: Bind;
}

export function IndexingCard({
  bind,
  title = "Privasi & SEO",
  description = "Kontrol indexing mesin pencari. Default mati untuk keamanan.",
  className,
}: IndexingCardProps) {
  const allowIndex = bind("allowIndex");
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-brand" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Izinkan mesin pencari (Google, dll.)</p>
            <p className="text-xs text-muted-foreground">
              Default mati → halaman publik pakai{" "}
              <code className="font-mono text-[10px]">noindex</code>. Aktifkan
              setelah Anda yakin tidak ada data sensitif.
            </p>
          </div>
          <Switch
            checked={allowIndex.value}
            onCheckedChange={allowIndex.onChange}
            aria-label="Izinkan indexing mesin pencari"
          />
        </div>
      </CardContent>
    </Card>
  );
}
