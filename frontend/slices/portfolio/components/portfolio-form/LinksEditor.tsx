"use client";

import { useState } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import type { PortfolioLink, PortfolioLinkKind } from "../../types";
import { LINK_KIND_LABELS } from "../../constants";

interface Props {
  links: PortfolioLink[];
  onChange: (next: PortfolioLink[]) => void;
}

export function LinksEditor({ links, onChange }: Props) {
  const [draft, setDraft] = useState<PortfolioLink>({ url: "", label: "", kind: "live" });

  const add = () => {
    const url = draft.url.trim();
    const label = draft.label.trim();
    if (!url || !label) {
      notify.validation("URL dan label wajib diisi");
      return;
    }
    onChange([...links, { url, label, kind: draft.kind }]);
    setDraft({ url: "", label: "", kind: draft.kind });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Tambahkan link yang relevan: live demo, repo, case study, slides, video, dll.
      </p>

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((l, idx) => (
            <li
              key={`${l.url}-${idx}`}
              className="flex items-center gap-2 rounded-md border border-border p-2"
            >
              <Badge variant="secondary" className="text-[10px] uppercase">
                {LINK_KIND_LABELS[l.kind as PortfolioLinkKind] ?? l.kind}
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.label}</p>
                <p className="truncate text-xs text-muted-foreground">{l.url}</p>
              </div>
              <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label="Buka">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => onChange(links.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-md border border-dashed border-border p-3">
        <div className="grid grid-cols-3 gap-2">
          <ResponsiveSelect
            value={draft.kind}
            onValueChange={(v) => setDraft((d) => ({ ...d, kind: v as PortfolioLinkKind }))}
          >
            <ResponsiveSelectTrigger placeholder="Tipe" />
            <ResponsiveSelectContent>
              {(Object.keys(LINK_KIND_LABELS) as PortfolioLinkKind[]).map((k) => (
                <ResponsiveSelectItem key={k} value={k}>
                  {LINK_KIND_LABELS[k]}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <Input
            placeholder="Label"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="col-span-2"
          />
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="https://…"
            type="url"
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
