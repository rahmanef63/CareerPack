"use client";

import { ShieldCheck } from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import { SectionShell } from "./SectionShell";
import type { Bind, SectionOverrides } from "../form/types";

export interface IndexingCardProps extends SectionOverrides {
  bind: Bind;
  noCard?: boolean;
}

export function IndexingCard({
  bind,
  title = "Privasi & SEO",
  description = "Kontrol indexing mesin pencari. Default mati untuk keamanan.",
  className,
  noCard = false,
}: IndexingCardProps) {
  const allowIndex = bind("allowIndex");
  const fields = (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
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
  );

  if (noCard) return fields;

  return (
    <SectionShell
      title={title}
      description={description}
      className={className}
      icon={<ShieldCheck className="h-4 w-4 text-brand" />}
    >
      {fields}
    </SectionShell>
  );
}
