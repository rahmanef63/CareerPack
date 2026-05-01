"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ArrowLeft, CheckCircle2, Inbox, Mail } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { AuthShell } from "@/shared/containers/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

export default function ForgotPasswordPage() {
  const requestReset = useMutation(api.passwordReset.requestReset);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await requestReset({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Lupa Password"
      description="Masukkan email akun Anda untuk menerima tautan reset."
    >
      <div className="space-y-4">
        {submitted ? (
          <div className="space-y-3">
            <Alert className="bg-success/10 border-success/30">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription className="text-success">
                Jika email Anda terdaftar, kami sudah mengirim tautan reset
                sandi. Tautan berlaku 30 menit.
              </AlertDescription>
            </Alert>
            <Alert>
              <Inbox className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                <strong className="block">Email belum masuk?</strong>
                <span className="block text-sm text-muted-foreground">
                  Cek folder <strong>Spam</strong> atau <strong>Promotions</strong>.
                  Domain kami baru — sebagian provider belum mengenali. Tandai email
                  dari <code>support@careerpack.org</code> sebagai &quot;Bukan Spam&quot;
                  supaya pesan berikutnya masuk inbox.
                </span>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand"
              disabled={isLoading || !email}
            >
              {isLoading ? "Mengirim..." : "Kirim tautan reset"}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground pt-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Kembali ke halaman masuk
        </Link>
      </div>
    </AuthShell>
  );
}
