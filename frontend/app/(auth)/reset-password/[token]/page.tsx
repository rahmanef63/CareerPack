"use client";

import Link from "next/link";
import { use, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { AuthShell } from "@/shared/containers/AuthShell";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Kata sandi minimal 8 karakter";
  if (password.length > 128) return "Kata sandi terlalu panjang (maks 128)";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Kata sandi harus mengandung huruf dan angka";
  }
  return null;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();
  const resetPassword = useMutation(api.passwordReset.resetPassword);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi sandi tidak cocok");
      return;
    }
    const invalid = validatePassword(password);
    if (invalid) {
      setError(invalid);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      notify.success("Sandi berhasil direset. Silakan masuk dengan sandi baru.");
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mereset sandi");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      description="Masukkan kata sandi baru untuk akun Anda."
    >
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Kata sandi baru</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min 8 karakter, huruf + angka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi sandi</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Ulangi sandi"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
            disabled={isLoading || !password || !confirm}
          >
            {isLoading ? "Menyimpan..." : "Reset sandi"}
          </Button>
        </form>

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
