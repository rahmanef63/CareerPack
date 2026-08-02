/**
 * Curated block bundles surfaced in Manual mode's "Preset Blok" tab.
 * Clicking a preset appends its `blocks` array to the form's blocks
 * field with fresh ids. Placeholder URLs / text are valid enough that
 * the server sanitiser preserves the block; the user then refines copy
 * via the Konten tab.
 *
 * Why placeholder URLs (https://example.com / Unsplash):
 *   sanitizeBlock drops links/images with empty or invalid urls — an
 *   empty preset would vanish on save. Real-looking placeholders keep
 *   the block alive long enough for the user to edit. Unsplash is
 *   used for image presets because placehold.co + similar redirect
 *   services occasionally trigger "content blocked" interstitials in
 *   user browsers / corporate proxies.
 */

import {
  Sparkles,
  User,
  Share2,
  ImageIcon,
  Film,
  Mail,
  Quote,
  Minus,
  Megaphone,
} from "lucide-react";
import type { BlockType } from "../blocks/types";

export interface PresetBlockDef {
  type: BlockType;
  payload: Record<string, unknown>;
  hidden?: boolean;
}

export interface BlockPresetDef {
  id: string;
  label: string;
  description: string;
  icon: typeof Sparkles;
  blocks: ReadonlyArray<PresetBlockDef>;
}

const PLACEHOLDER_URL = "https://example.com";

/** Unsplash CDN photos used as image-block placeholders. Three
 *  distinct shots so the gallery preset actually looks like a real
 *  gallery (not three copies of the same image). Unsplash CDN is
 *  embed-friendly (no hotlink protection, no referrer check). */
const PLACEHOLDER_IMG_1 =
  "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=900&q=80";
const PLACEHOLDER_IMG_2 =
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80";
const PLACEHOLDER_IMG_3 =
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=80";

export const BLOCK_PRESETS: ReadonlyArray<BlockPresetDef> = [
  {
    id: "hero",
    label: "Hero",
    description: "Judul + intro singkat + tombol aksi.",
    icon: Sparkles,
    blocks: [
      { type: "heading", payload: { text: "Halo, saya …", size: "lg" } },
      {
        type: "paragraph",
        payload: {
          text: "Frontend engineer membangun produk web yang cepat & rapi. Berbasis di Jakarta — bekerja remote untuk tim global.",
        },
      },
      {
        type: "link",
        payload: {
          label: "Hubungi saya",
          url: PLACEHOLDER_URL,
          variant: "primary",
        },
      },
    ],
  },
  {
    id: "about",
    label: "Tentang",
    description: "Heading + paragraf bio singkat.",
    icon: User,
    blocks: [
      { type: "heading", payload: { text: "Tentang saya", size: "lg" } },
      {
        type: "paragraph",
        payload: {
          text: "Tulis 2-3 kalimat: siapa Anda, untuk siapa Anda bekerja, dan apa yang membuat Anda berbeda.",
        },
      },
    ],
  },
  {
    id: "social-row",
    label: "Sosial",
    description: "Baris ikon LinkedIn / Twitter / GitHub.",
    icon: Share2,
    blocks: [
      {
        type: "social",
        payload: {
          items: [
            { platform: "linkedin", url: "https://linkedin.com/in/your-handle" },
            { platform: "twitter", url: "https://twitter.com/your-handle" },
            { platform: "github", url: "https://github.com/your-handle" },
          ],
        },
      },
    ],
  },
  {
    id: "gallery",
    label: "Galeri 3 gambar",
    description: "Heading + 3 gambar grid.",
    icon: ImageIcon,
    blocks: [
      { type: "heading", payload: { text: "Karya pilihan", size: "lg" } },
      { type: "image", payload: { url: PLACEHOLDER_IMG_1, alt: "Project 1" } },
      { type: "image", payload: { url: PLACEHOLDER_IMG_2, alt: "Project 2" } },
      { type: "image", payload: { url: PLACEHOLDER_IMG_3, alt: "Project 3" } },
    ],
  },
  {
    id: "video",
    label: "Video showreel",
    description: "Heading + YouTube embed.",
    icon: Film,
    blocks: [
      { type: "heading", payload: { text: "Showreel", size: "lg" } },
      {
        type: "embed",
        payload: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      },
    ],
  },
  {
    id: "contact",
    label: "Kontak",
    description: "Heading + paragraf + 2 tombol email & WhatsApp.",
    icon: Mail,
    blocks: [
      { type: "heading", payload: { text: "Mari ngobrol", size: "lg" } },
      {
        type: "paragraph",
        payload: {
          text: "Tertarik kerja sama? Email atau WhatsApp saya — biasanya respon dalam 1×24 jam.",
        },
      },
      {
        type: "link",
        payload: {
          label: "Email saya",
          url: PLACEHOLDER_URL,
          variant: "primary",
        },
      },
      {
        type: "link",
        payload: {
          label: "WhatsApp",
          url: PLACEHOLDER_URL,
          variant: "secondary",
        },
      },
    ],
  },
  {
    id: "cta-banner",
    label: "CTA Banner",
    description: "Tagline + 1 tombol besar.",
    icon: Megaphone,
    blocks: [
      {
        type: "heading",
        payload: { text: "Siap mulai project Anda?", size: "lg" },
      },
      {
        type: "link",
        payload: {
          label: "Booking 30 menit gratis",
          url: PLACEHOLDER_URL,
          variant: "primary",
        },
      },
    ],
  },
  {
    id: "quote",
    label: "Quote",
    description: "Paragraf gaya kutipan (markdown italic).",
    icon: Quote,
    blocks: [
      {
        type: "paragraph",
        payload: {
          text: '_"Sederhana itu sulit, tapi pendek lebih lama. Pilih efektif."_ — Mark Twain',
        },
      },
    ],
  },
  {
    id: "divider",
    label: "Pemisah",
    description: "Garis pemisah antar section.",
    icon: Minus,
    blocks: [{ type: "divider", payload: { style: "line" } }],
  },
];
