"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileCheck2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { AnimatedProgress } from "@/shared/components/interactions/MicroInteractions";
import { cn } from "@/shared/lib/utils";

const APP_DOCS = [
  { id: "cv", label: "CV PDF", required: true },
  { id: "cover", label: "Cover Letter", required: true },
  { id: "portfolio", label: "Portofolio / Link Project", required: false },
  { id: "transkrip", label: "Transkrip Nilai", required: true },
  { id: "sertifikat", label: "Sertifikat Pendukung", required: false },
  { id: "referensi", label: "Surat Referensi", required: false },
  { id: "ktp", label: "Scan KTP", required: true },
  { id: "foto", label: "Foto Formal", required: true },
];

type Format = "national" | "international";

interface DocChecklistInlineProps {
  format: Format;
}

export function DocChecklistInline({ format }: DocChecklistInlineProps) {
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const docs = format === "international"
    ? APP_DOCS.filter((d) => d.id !== "foto") // ATS no photo
    : APP_DOCS;

  const required = docs.filter((d) => d.required);
  const requiredDone = required.filter((d) => done[d.id]).length;
  const pct = Math.round((requiredDone / Math.max(required.length, 1)) * 100);

  const toggle = (id: string) => setDone((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader
        className="bg-muted/40 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-success/20 dark:bg-success/20 text-success dark:text-success/80 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">Kelengkapan Dokumen</CardTitle>
              <p className="text-xs text-muted-foreground">
                {requiredDone}/{required.length} wajib · {format === "international" ? "ATS / luar negeri" : "Lokal"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn(pct === 100 ? "bg-success/20 text-success" : "bg-muted text-foreground")}>
              {pct}%
            </Badge>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <AnimatedProgress value={pct} className="mt-3" />
      </CardHeader>
      {open && (
        <CardContent className="pt-4">
          <ul className="grid sm:grid-cols-2 gap-2">
            {docs.map((d) => (
              <li
                key={d.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border transition-colors tap-press cursor-pointer",
                  done[d.id]
                    ? "border-success/30 bg-success/10 dark:bg-success/20"
                    : "border-border hover:border-brand"
                )}
                onClick={() => toggle(d.id)}
              >
                <Checkbox checked={!!done[d.id]} onCheckedChange={() => toggle(d.id)} aria-label={d.label} />
                <span className={cn("text-sm flex-1", done[d.id] && "line-through text-muted-foreground")}>
                  {d.label}
                </span>
                {d.required && !done[d.id] && (
                  <Badge variant="secondary" className="text-[10px] bg-warning/20 text-warning">
                    wajib
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
