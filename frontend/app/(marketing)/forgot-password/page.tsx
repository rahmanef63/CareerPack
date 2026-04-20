"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { BrandMark } from "@/shared/components/brand/Logo";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-muted via-white to-brand-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center text-brand-foreground"
            style={{ boxShadow: "0 10px 24px -8px rgba(14,165,233,0.4)" }}
          >
            <BrandMark size={24} stroke="#fff" strokeWidth={2.4} />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-brand-from to-brand-to bg-clip-text text-transparent">
            CareerPack
          </span>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Lupa Password</CardTitle>
            <CardDescription>
              Masukkan email akun Anda untuk menerima tautan reset.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submitted ? (
              <Alert className="bg-success/10 border-success/30">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Jika email Anda terdaftar, kami sudah menyiapkan tautan reset
                  sandi. Cek inbox atau hubungi admin untuk mendapatkan tautan.
                </AlertDescription>
              </Alert>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
