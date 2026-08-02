import { Wallet } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Financial-calculator slice manifest — owns `budgetVariables` table
 * CRUD via the AI agent. The agent can list current budget allocations,
 * append a new line item ("tambah cicilan motor 800rb"), update or
 * delete one. The full `financialPlans` doc (relocation calculator)
 * stays in the slice UI because its arg surface is too wide for chat.
 */
export const financialCalculatorManifest: SliceManifest = {
  id: "financial-calculator",
  label: "Kalkulator Keuangan",
  description: "Kelola variabel anggaran + simulasi finansial",
  icon: Wallet,

  skills: [
    {
      id: "financial.list-budget",
      label: "Lihat variabel anggaran",
      description:
        "Ambil daftar variabel anggaran user (id, label, value, kind, color, iconName, order). Pakai DULU sebelum update/delete butuh id. kind hanya 'expense' atau 'savings'.",
      kind: "query",
    },
    {
      id: "financial.add-budget",
      label: "Tambah variabel anggaran",
      description:
        "Tambah 1 baris variabel anggaran baru. kind WAJIB 'expense' (pengeluaran) atau 'savings' (tabungan). value dalam rupiah (angka). iconName = nama lucide-react icon (mis. 'Home', 'Car', 'PiggyBank'). color = nama warna pendek (mis. 'red', 'blue').",
      kind: "compose",
      cta: "Tambah variabel",
      args: {
        label: { type: "string", label: "Label (mis. 'Cicilan motor')", required: true },
        value: { type: "number", label: "Nilai (Rp)", required: true, example: "800000" },
        kind: {
          type: "string",
          label: "Tipe (expense | savings)",
          required: true,
          example: "expense",
        },
        iconName: {
          type: "string",
          label: "Nama icon lucide (default: Wallet)",
          required: false,
          example: "Car",
        },
        color: {
          type: "string",
          label: "Warna (default: slate)",
          required: false,
          example: "red",
        },
      },
    },
    {
      id: "financial.update-budget",
      label: "Edit variabel anggaran",
      description:
        "Patch field variabel anggaran berdasarkan id. Hanya kirim field yang ingin diubah. Pakai untuk 'naikkan cicilan jadi 1jt', 'ganti label X jadi Y'.",
      kind: "mutation",
      cta: "Simpan perubahan",
      args: {
        id: { type: "string", label: "ID variabel", required: true },
        label: { type: "string", label: "Label baru", required: false },
        value: { type: "number", label: "Nilai baru (Rp)", required: false },
        kind: {
          type: "string",
          label: "Tipe baru (expense | savings)",
          required: false,
        },
        iconName: { type: "string", label: "Icon baru", required: false },
        color: { type: "string", label: "Warna baru", required: false },
      },
    },
    {
      id: "financial.delete-budget",
      label: "Hapus variabel anggaran",
      description:
        "Hapus 1 variabel anggaran berdasarkan id. Aksi destructive — perlu approval.",
      kind: "mutation",
      cta: "Hapus variabel",
      args: {
        id: { type: "string", label: "ID variabel", required: true },
      },
    },
  ],
};
