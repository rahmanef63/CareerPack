import { Library } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Library slice — content + uploaded file vault on top of `convex/
 * files/`. Read-only AI surface (`library.list-files`) — file uploads
 * stay in the slice UI because they need a browser file picker.
 */
export const libraryManifest: SliceManifest = {
  id: "library",
  label: "Content Library",
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
