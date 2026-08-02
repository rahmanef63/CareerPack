import { Library } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Library slice — content + uploaded file vault on top of `convex/
 * files/`. Read-only AI surface (`library.list-files`) — file uploads
 * stay in the slice UI because they need a browser file picker.
 */
export const libraryManifest: SliceManifest = {
  id: "library",
  // Surfaced to the user in the AI console's approval cards, so it has to
  // match the nav label and page heading — all three said "Content Library",
  // the one straight-English string in an Indonesian shell.
  label: "Pustaka Konten",
  description: "Vault file + media yang user upload",
  icon: Library,

  skills: [
    {
      id: "library.list-files",
      label: "Lihat file di library",
      description:
        "Ambil daftar file user (id, fileName, mimeType, size, _creationTime). Pakai untuk 'apa file yang aku upload', 'cek library saya'.",
      kind: "query",
    },
  ],
};
