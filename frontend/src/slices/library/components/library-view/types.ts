import type { Id } from "../../../../../../convex/_generated/dataModel";

export interface LibraryFile {
  _id: Id<"files">;
  storageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string | null;
  tags?: string[];
  note?: string;
  usedIn: string[];
  createdAt: number;
}

export type KindFilter = "all" | "image" | "pdf";

export const KIND_OPTIONS: ReadonlyArray<{ value: KindFilter; label: string }> = [
  { value: "all", label: "Semua tipe" },
  { value: "image", label: "Gambar" },
  { value: "pdf", label: "PDF" },
];

export function bytesToHuman(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
