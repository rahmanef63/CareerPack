"use client";

import { Copy, Download, Eye, EyeOff, GraduationCap, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { ColumnDef, FilterDef } from "@/shared/components/data-table";
import { DOMAIN_OPTIONS, type LoadedTemplate } from "../../types/template";
import type { Id } from "../../../../../../convex/_generated/dataModel";

interface ColumnHandlers<T> {
  togglePublic: (args: { id: Id<"roadmapTemplates">; isPublic: boolean }) => void;
  onExportOne: (t: T) => void;
  onDuplicate: (t: T) => void;
  onEdit: (t: T) => void;
  onDelete: (id: Id<"roadmapTemplates">) => void;
}

export function buildTemplateColumns<T extends LoadedTemplate>(
  h: ColumnHandlers<T>,
): ReadonlyArray<ColumnDef<T>> {
  return [
    {
      id: "title",
      header: "Template",
      accessor: (t) => t.title.toLowerCase(),
      cell: (t) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm truncate">{t.title}</span>
              {t.isSystem && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1 leading-none">sistem</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {t.slug} · {t.nodes.length} node
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "domain",
      header: "Domain",
      accessor: (t) => t.domain,
      cell: (t) => <Badge variant="outline" className="text-[10px] uppercase">{t.domain}</Badge>,
      hideOnMobile: true,
      width: "w-[140px]",
    },
    {
      id: "nodes",
      header: "Node",
      accessor: (t) => t.nodes.length,
      cell: (t) => <span className="text-xs text-muted-foreground tabular-nums">{t.nodes.length}</span>,
      hideOnMobile: true,
      align: "right",
      width: "w-[80px]",
    },
    {
      id: "order",
      header: "Urutan",
      accessor: (t) => t.order,
      cell: (t) => <span className="text-xs text-muted-foreground tabular-nums">{t.order}</span>,
      hideOnMobile: true,
      align: "right",
      width: "w-[80px]",
    },
    {
      id: "isPublic",
      header: "Publik",
      accessor: (t) => (t.isPublic ? 1 : 0),
      cell: (t) =>
        t.isPublic ? (
          <Eye className="w-4 h-4 text-success" />
        ) : (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        ),
      hideOnMobile: true,
      width: "w-[80px]",
    },
    {
      id: "actions",
      header: "",
      accessor: () => "",
      sortable: false,
      hideMobileLabel: true,
      align: "right",
      width: "w-[140px]",
      cell: (t) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              h.togglePublic({ id: t._id, isPublic: !t.isPublic });
            }}
            className="p-1.5 rounded hover:bg-muted"
            title={t.isPublic ? "Sembunyikan" : "Tampilkan"}
          >
            {t.isPublic
              ? <Eye className="w-4 h-4 text-success" />
              : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); h.onExportOne(t); }}
            className="p-1.5 rounded hover:bg-muted"
            title="Ekspor JSON"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); h.onDuplicate(t); }}
            className="p-1.5 rounded hover:bg-muted"
            title="Duplikat"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); h.onEdit(t); }}
            className="p-1.5 rounded hover:bg-muted"
            title="Edit"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </button>
          {!t.isSystem && (
            <button
              onClick={(e) => { e.stopPropagation(); h.onDelete(t._id); }}
              className="p-1.5 rounded hover:bg-muted"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          )}
        </div>
      ),
    },
  ];
}

export function buildTemplateFilters<T extends LoadedTemplate>(): ReadonlyArray<FilterDef<T>> {
  return [
    {
      id: "domain",
      label: "Domain",
      accessor: (t) => t.domain,
      options: DOMAIN_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    },
    {
      id: "visibility",
      label: "Visibilitas",
      accessor: (t) => (t.isPublic ? "public" : "private"),
      options: [
        { value: "public", label: "Publik" },
        { value: "private", label: "Privat" },
      ],
    },
    {
      id: "origin",
      label: "Asal",
      accessor: (t) => (t.isSystem ? "system" : "user"),
      options: [
        { value: "system", label: "Sistem" },
        { value: "user", label: "Pengguna" },
      ],
    },
  ];
}
