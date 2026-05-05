"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { subscribe } from "@/shared/lib/aiActionBus";
import { notify } from "@/shared/lib/notify";

interface AddBudgetPayload {
  label: string;
  value: number;
  kind: string;
  iconName?: string;
  color?: string;
}

interface UpdateBudgetPayload {
  id: string;
  label?: string;
  value?: number;
  kind?: string;
  iconName?: string;
  color?: string;
}

interface DeleteBudgetPayload {
  id: string;
}

const VALID_KIND = new Set(["expense", "savings"]);

/**
 * Financial capability binder — wires manifest mutation/compose
 * skills to backend mutations. Query skill (`list-budget`) handled
 * server-side by skillHandlers.
 */
export function FinancialCapabilities() {
  const createVar = useMutation(api.financial.mutations.createBudgetVariable);
  const updateVar = useMutation(api.financial.mutations.updateBudgetVariable);
  const removeVar = useMutation(api.financial.mutations.removeBudgetVariable);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribe<AddBudgetPayload>("financial.add-budget", async (a) => {
        const p = a.payload;
        const label = String(p.label ?? "").trim();
        const value = typeof p.value === "number" ? p.value : Number(p.value);
        const rawKind = String(p.kind ?? "").trim().toLowerCase();
        if (!label) {
          notify.validation("Label wajib");
          return;
        }
        if (!Number.isFinite(value)) {
          notify.validation("Nilai harus angka valid");
          return;
        }
        if (!VALID_KIND.has(rawKind)) {
          notify.validation("Tipe harus expense | savings");
          return;
        }
        try {
          await createVar({
            label,
            value,
            kind: rawKind as "expense" | "savings",
            iconName: String(p.iconName ?? "Wallet").trim() || "Wallet",
            color: String(p.color ?? "slate").trim() || "slate",
          });
          notify.success(`Variabel "${label}" ditambahkan`);
        } catch (err) {
          notify.fromError(err, "Gagal tambah variabel");
        }
      }),
    );

    unsubs.push(
      subscribe<UpdateBudgetPayload>("financial.update-budget", async (a) => {
        const p = a.payload;
        const id = String(p.id ?? "").trim();
        if (!id) {
          notify.validation("ID variabel wajib");
          return;
        }
        const patch: Record<string, unknown> = {
          id: id as Id<"budgetVariables">,
        };
        if (p.label !== undefined) patch.label = String(p.label).trim();
        if (p.value !== undefined) {
          const v = typeof p.value === "number" ? p.value : Number(p.value);
          if (!Number.isFinite(v)) {
            notify.validation("Nilai tidak valid");
            return;
          }
          patch.value = v;
        }
        if (p.kind !== undefined) {
          const k = String(p.kind).trim().toLowerCase();
          if (!VALID_KIND.has(k)) {
            notify.validation("Tipe harus expense | savings");
            return;
          }
          patch.kind = k as "expense" | "savings";
        }
        if (p.iconName !== undefined) patch.iconName = String(p.iconName).trim();
        if (p.color !== undefined) patch.color = String(p.color).trim();

        try {
          await updateVar(patch as Parameters<typeof updateVar>[0]);
          notify.success("Variabel diperbarui");
        } catch (err) {
          notify.fromError(err, "Gagal update variabel");
        }
      }),
    );

    unsubs.push(
      subscribe<DeleteBudgetPayload>("financial.delete-budget", async (a) => {
        const id = String(a.payload.id ?? "").trim();
        if (!id) {
          notify.validation("ID variabel wajib");
          return;
        }
        try {
          await removeVar({ id: id as Id<"budgetVariables"> });
          notify.success("Variabel dihapus");
        } catch (err) {
          notify.fromError(err, "Gagal hapus variabel");
        }
      }),
    );

    return () => {
      for (const u of unsubs) u();
    };
  }, [createVar, updateVar, removeVar]);

  return null;
}
