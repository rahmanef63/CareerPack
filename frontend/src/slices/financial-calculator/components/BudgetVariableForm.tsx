"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { cn } from "@/shared/lib/utils";
import {
  BUDGET_COLOR_PALETTE,
  BUDGET_ICON_NAMES,
  iconFor,
} from "../constants/budgetIcons";

type Kind = "expense" | "savings";
type ExistingDoc = Doc<"budgetVariables">;

interface BudgetVariableFormProps {
  /** When provided, form is in edit mode; otherwise add mode. */
  existing?: ExistingDoc;
  /** Custom trigger (defaults to "+" pill for add, "Edit" ghost btn for edit). */
  trigger?: React.ReactNode;
}

export function BudgetVariableForm({ existing, trigger }: BudgetVariableFormProps) {
  const [open, setOpen] = useState(false);
  const create = useMutation(api.financial.mutations.createBudgetVariable);
  const update = useMutation(api.financial.mutations.updateBudgetVariable);
  const remove = useMutation(api.financial.mutations.removeBudgetVariable);

  const [label, setLabel] = useState(existing?.label ?? "");
  const [value, setValue] = useState<string>(existing ? String(existing.value) : "500000");
  const [iconName, setIconName] = useState(existing?.iconName ?? "Wallet");
  const [color, setColor] = useState(existing?.color ?? BUDGET_COLOR_PALETTE[0]);
  const [kind, setKind] = useState<Kind>(existing?.kind ?? "expense");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Reset form when opening (especially for create mode)
  useEffect(() => {
    if (!open) return;
    if (existing) {
      setLabel(existing.label);
      setValue(String(existing.value));
      setIconName(existing.iconName);
      setColor(existing.color);
      setKind(existing.kind);
    }
  }, [open, existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const numeric = Number(value.replace(/[^\d]/g, ""));
      if (existing) {
        await update({
          id: existing._id as Id<"budgetVariables">,
          label,
          value: numeric,
          iconName,
          color,
          kind,
        });
        notify.success("Variabel diperbarui");
      } else {
        await create({ label, value: numeric, iconName, color, kind });
        notify.success("Variabel ditambahkan");
        setLabel("");
        setValue("500000");
      }
      setOpen(false);
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    try {
      await remove({ id: existing._id as Id<"budgetVariables"> });
      notify.success("Variabel dihapus");
      setConfirmDeleteOpen(false);
      setOpen(false);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus");
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Variabel</span>
          </Button>
        )}
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {existing ? "Edit Variabel Anggaran" : "Tambah Variabel Anggaran"}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Kategori anggaran — tersimpan per pengguna.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="bv-label">Nama</Label>
            <Input
              id="bv-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Kesehatan"
              maxLength={40}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bv-value">Nilai (Rp)</Label>
            <Input
              id="bv-value"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bv-kind">Jenis</Label>
            <ResponsiveSelect value={kind} onValueChange={(v) => setKind(v as Kind)}>
              <ResponsiveSelectTrigger id="bv-kind" />
              <ResponsiveSelectContent drawerTitle="Jenis variabel">
                <ResponsiveSelectItem value="expense">Pengeluaran</ResponsiveSelectItem>
                <ResponsiveSelectItem value="savings">Tabungan</ResponsiveSelectItem>
              </ResponsiveSelectContent>
            </ResponsiveSelect>
          </div>

          <div className="space-y-2">
            <Label>Ikon</Label>
            <div className="grid grid-cols-8 gap-2">
              {BUDGET_ICON_NAMES.map((name) => {
                const Icon = iconFor(name);
                const active = name === iconName;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIconName(name)}
                    aria-label={`Ikon ${name}`}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                      active
                        ? "border-brand bg-brand-muted text-brand"
                        : "border-border bg-card hover:border-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Warna</Label>
            <div className="grid grid-cols-6 gap-2">
              {BUDGET_COLOR_PALETTE.map((hex) => {
                const active = hex === color;
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    aria-label={`Warna ${hex}`}
                    className={cn(
                      "h-8 w-full rounded-md border-2 transition-transform",
                      active ? "border-foreground scale-105" : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {existing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={saving || label.trim().length === 0}>
                {saving ? "Menyimpan…" : existing ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </form>
      </ResponsiveDialogContent>

      <ResponsiveAlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <ResponsiveAlertDialogContent>
          <ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogTitle>
              Hapus &quot;{existing?.label}&quot;?
            </ResponsiveAlertDialogTitle>
            <ResponsiveAlertDialogDescription>
              Variabel anggaran akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
            </ResponsiveAlertDialogDescription>
          </ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogFooter>
            <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
            <ResponsiveAlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </ResponsiveAlertDialogAction>
          </ResponsiveAlertDialogFooter>
        </ResponsiveAlertDialogContent>
      </ResponsiveAlertDialog>
    </ResponsiveDialog>
  );
}
