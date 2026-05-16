import { Calendar } from "lucide-react";
import type { SliceManifest } from "@/shared/types/sliceManifest";

/**
 * Calendar slice manifest — owns event/reminder CRUD on
 * `calendarEvents`. AI skill lets the agent create events from
 * natural-language requests like "ingatkan saya belajar besok".
 *
 * Date/time formats are strict (YYYY-MM-DD / HH:MM) — the system
 * prompt injects today's date so the model can resolve relative
 * references ("besok", "lusa", "Senin depan").
 */
export const calendarManifest: SliceManifest = {
  id: "calendar",
  label: "Kalender",
  description: "Atur jadwal interview, pengingat belajar, dll",
  icon: Calendar,

  route: {
    slug: "calendar",
    component: () =>
      import("./components/CalendarView").then((m) => ({ default: m.CalendarView })),
  },

  nav: {
    placement: "primary",
    order: 30,
    href: "/dashboard/calendar",
  },

  skills: [
    {
      id: "calendar.list-events",
      label: "Lihat event di kalender",
      description:
        "Ambil daftar event/pengingat user dari kalender. Pakai DULU sebelum update/delete supaya dapat eventId. Juga pakai untuk menjawab 'apa agenda saya hari ini/besok'. Returns array of {eventId, title, date, time, location, type, notes}.",
      kind: "query",
    },
    {
      id: "calendar.create-event",
      label: "Buat event di kalender",
      description:
        "Tambah event/pengingat ke kalender user. Pakai untuk permintaan apapun yang menyebut tanggal/waktu di masa depan: pengingat belajar, jadwal interview, deadline lamaran. WAJIB pakai format date YYYY-MM-DD dan time HH:MM (24-jam). Untuk pengingat tanpa jam spesifik default time='09:00'. Untuk learning/study type='reminder', untuk wawancara type='interview', untuk deadline type='deadline'.",
      kind: "compose",
      cta: "Tambah ke Kalender",
      args: {
        title: {
          type: "string",
          label: "Judul event",
          required: true,
          example: "Belajar di Dicoding",
        },
        date: {
          type: "string",
          label: "Tanggal (YYYY-MM-DD)",
          required: true,
          example: "2026-05-03",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        time: {
          type: "string",
          label: "Jam (HH:MM, 24-jam)",
          required: true,
          example: "09:00",
          pattern: "^\\d{2}:\\d{2}$",
        },
        type: {
          type: "string",
          label: "Tipe (reminder | interview | deadline | other)",
          required: true,
          example: "reminder",
        },
        location: {
          type: "string",
          label: "Lokasi atau URL",
          required: false,
          example: "https://www.dicoding.com/academies",
        },
        notes: {
          type: "string",
          label: "Catatan tambahan",
          required: false,
        },
      },
    },
    {
      id: "calendar.update-event",
      label: "Edit event kalender",
      description:
        "Ubah field event yang sudah ada. WAJIB punya eventId — kalau belum punya, panggil calendar.list-events dulu untuk dapat ID-nya. Hanya kirim field yang mau diubah; field yang tidak dikirim tetap.",
      kind: "mutation",
      cta: "Simpan perubahan",
      args: {
        eventId: {
          type: "string",
          label: "ID event (didapat dari list-events)",
          required: true,
          example: "k57j1abcd...",
        },
        title: { type: "string", label: "Judul baru", required: false },
        date: {
          type: "string",
          label: "Tanggal baru (YYYY-MM-DD)",
          required: false,
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        time: {
          type: "string",
          label: "Jam baru (HH:MM)",
          required: false,
          pattern: "^\\d{2}:\\d{2}$",
        },
        type: {
          type: "string",
          label: "Tipe baru",
          required: false,
        },
        location: { type: "string", label: "Lokasi baru", required: false },
        notes: { type: "string", label: "Catatan baru", required: false },
      },
    },
    {
      id: "calendar.delete-event",
      label: "Hapus event kalender",
      description:
        "Hapus event dari kalender berdasarkan eventId. WAJIB panggil calendar.list-events dulu kalau belum punya ID. Aksi destructive — selalu butuh persetujuan user di UI.",
      kind: "mutation",
      cta: "Hapus event",
      args: {
        eventId: {
          type: "string",
          label: "ID event yang mau dihapus",
          required: true,
        },
      },
    },
  ],
};
