"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useMutation } from "convex/react";

import { notify } from "@/shared/lib/notify";
import { useAuth } from "@/shared/hooks/useAuth";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogTrigger,
} from "@/shared/components/ui/responsive-alert-dialog";

/**
 * Hapus akun mandiri — janji di Kebijakan Privasi yang sebelumnya cuma
 * bisa dilayani manual lewat email.
 *
 * Sengaja dipisah jadi kartu destruktif sendiri di dasar tab Profil, jauh
 * dari tombol "Simpan Profil": satu klik nyasar di sini tidak bisa
 * dibatalkan.
 *
 * Sesi demo tetap dapat tombol yang sama, bukan disembunyikan. Akun tamu
 * anonim itu baris `users` + auth beneran di Convex (lihat
 * useAuth.loginAsDemo) — kalau tombolnya disembunyikan, satu-satunya cara
 * user demo "menghapus jejak" adalah menutup tab, dan barisnya menumpuk di
 * daftar user admin selamanya. Yang berbeda cuma data yang terlihat: isi
 * sandbox demo hidup di localStorage `careerpack:demo:*`, bukan di Convex,
 * jadi harus ikut dibersihkan di sini.
 */
export function DangerZoneCard() {
  const { state, logout } = useAuth();
  const deleteMyAccount = useMutation(api.profile.mutations.deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const isDemo = state.isDemo;

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteMyAccount({});
      // Tanpa ini, pengunjung berikutnya di browser yang sama disambut CV
      // demo yang barusan "dihapus".
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("careerpack:demo:")) {
          window.localStorage.removeItem(key);
        }
      }
      notify.success(isDemo ? "Sesi demo dihapus" : "Akun Anda sudah dihapus");
      await logout();
    } catch (err) {
      notify.fromError(err, "Gagal menghapus akun");
      setBusy(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona Berbahaya
        </CardTitle>
        <CardDescription>
          {isDemo ? (
            <>
              Sesi demo memakai akun tamu tanpa email. Menghapusnya mengakhiri
              sesi, menghapus akun tamu di server, dan membersihkan data contoh
              yang tersimpan di browser ini.
            </>
          ) : (
            <>
              Menghapus akun menghapus permanen profil, CV, lamaran, roadmap,
              ceklis dokumen, agenda, kontak, riwayat AI, dan semua berkas yang
              Anda unggah. Tidak bisa dibatalkan. Mau minta salinan data dulu?
              Email support@careerpack.org sebelum menghapus.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveAlertDialog>
          <ResponsiveAlertDialogTrigger asChild>
            <Button variant="destructive" disabled={busy}>
              {busy
                ? "Menghapus..."
                : isDemo
                  ? "Hapus sesi demo"
                  : "Hapus akun saya"}
            </Button>
          </ResponsiveAlertDialogTrigger>
          <ResponsiveAlertDialogContent>
            <ResponsiveAlertDialogHeader>
              <ResponsiveAlertDialogTitle>
                {isDemo ? "Hapus sesi demo ini?" : "Hapus akun secara permanen?"}
              </ResponsiveAlertDialogTitle>
              <ResponsiveAlertDialogDescription>
                {isDemo
                  ? "Akun tamu dan seluruh data contoh di browser ini akan hilang. Anda akan dikembalikan ke halaman depan."
                  // Jangan tulis "tidak ada cadangan": scripts/backup-prod.sh
                  // meng-export seluruh tabel tiap malam dan menyimpan 14
                  // arsip. Yang benar adalah cadangan itu tidak dipakai untuk
                  // memulihkan akun yang sengaja dihapus.
                  : "Semua data Anda dihapus dari server saat itu juga. Tidak ada tombol undo dan kami tidak memulihkannya dari cadangan; email ini bisa dipakai mendaftar lagi dari nol."}
              </ResponsiveAlertDialogDescription>
            </ResponsiveAlertDialogHeader>
            <ResponsiveAlertDialogFooter>
              <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
              <ResponsiveAlertDialogAction
                variant="destructive"
                onClick={handleDelete}
              >
                Ya, hapus
              </ResponsiveAlertDialogAction>
            </ResponsiveAlertDialogFooter>
          </ResponsiveAlertDialogContent>
        </ResponsiveAlertDialog>
      </CardContent>
    </Card>
  );
}
