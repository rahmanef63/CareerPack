"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthActions } from "@convex-dev/auth/react";
import { notify } from "@/shared/lib/notify";
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { AuthShell } from '@/shared/containers/AuthShell';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useAuth } from '@/shared/hooks/useAuth';

export function LoginPage() {
    const router = useRouter();
    const { login, register, loginAsDemo } = useAuth();
    const { signIn } = useAuthActions();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    // Client-side pre-flight — same rules as server's
    // validatePasswordRequirements in convex/auth.ts. Catch format issues
    // before the round-trip so users see the reason instantly.
    const validatePasswordLocal = (pwd: string): string | null => {
        if (pwd.length < 8) return 'Kata sandi minimal 8 karakter';
        if (pwd.length > 128) return 'Kata sandi terlalu panjang (maks 128)';
        if (!/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
            return 'Kata sandi harus mengandung huruf dan angka';
        }
        return null;
    };

    const showError = (msg: string) => {
        setError(msg);
        notify.error('Autentikasi gagal', { description: msg });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Browser autofill sometimes drops email into password field on
        // multi-form pages without autocomplete hints. Catch the obvious
        // case so the user sees a clear message instead of server rejection.
        if (loginPassword.includes('@')) {
            showError('Kolom kata sandi berisi email. Periksa isian autofill.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await login({ email: loginEmail, password: loginPassword });
            if (result.ok) {
                notify.success('Selamat datang kembali! 👋', {
                    description: 'Mengarahkan ke dashboard…',
                    duration: 2500,
                });
                router.push('/dashboard');
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Login gagal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (registerPassword.includes('@')) {
            showError('Kolom kata sandi berisi email. Periksa isian autofill.');
            return;
        }

        const pwdError = validatePasswordLocal(registerPassword);
        if (pwdError) {
            showError(pwdError);
            return;
        }

        setIsLoading(true);
        try {
            const result = await register({
                email: registerEmail,
                password: registerPassword,
                name: registerName
            });
            if (result.ok) {
                notify.success(`Selamat datang, ${registerName.split(' ')[0] || 'rekan'}!`, {
                    description: 'Akun aktif. Email sambutan dikirim — kalau tidak masuk inbox, cek folder Spam.',
                    duration: 5500,
                });
                router.push('/dashboard');
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Registrasi gagal');
        } finally {
            setIsLoading(false);
        }
    };

    // Demo path — creates a fresh Anonymous Convex session per click.
    // NO shared email/password account (the old pattern leaked data
    // across concurrent demo visitors via realtime sync). Each demo
    // visitor gets their own isolated user row + seeded starter data.
    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            await signIn("google");
            // signIn redirects to Google — control returns only on failure.
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Google sign-in gagal');
            setIsGoogleLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setError('');
        setIsDemoLoading(true);
        try {
            const result = await loginAsDemo();
            if (result.ok) {
                notify.success('Sesi demo dimulai 🎉', {
                    description: 'Mengarahkan ke dashboard (data akan dihapus saat logout).',
                    duration: 3000,
                });
                router.push('/dashboard');
            } else {
                showError(result.error);
            }
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Demo gagal dimulai');
        } finally {
            setIsDemoLoading(false);
        }
    };

    return (
        <AuthShell
            title="Selamat Datang"
            description="Masuk atau daftar untuk memulai perjalanan karir Anda"
            footer={
                <p className="text-center text-sm text-muted-foreground mt-6">
                    © 2024 CareerPack. Semua hak dilindungi.
                </p>
            }
        >
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading || isDemoLoading}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.5l6.3 5.3C40.9 36 44 30.5 44 24c0-1.3-.1-2.6-.4-3.5z"/>
                </svg>
                {isGoogleLoading ? 'Mengarahkan ke Google…' : 'Lanjutkan dengan Google'}
            </Button>

            <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">atau</span>
                </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
                            <TabsList variant="equal" cols={2} className="mb-6">
                                <TabsTrigger value="login">Masuk</TabsTrigger>
                                <TabsTrigger value="register">Daftar</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="username"
                                                inputMode="email"
                                                placeholder="nama@email.com"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                name="current-password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                                aria-pressed={showPassword}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Link
                                            href="/forgot-password"
                                            className="text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            Lupa password?
                                        </Link>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-brand hover:bg-brand"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Memuat...' : 'Masuk'}
                                    </Button>
                                </form>

                                {/* Demo session — anonymous Convex provider.
                                    Each click = new isolated session (no shared
                                    account across visitors, no data leak). */}
                                <div className="mt-6 pt-6 border-t border-border">
                                    <p className="text-sm text-muted-foreground text-center mb-3">
                                        Mau coba dulu?
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={handleDemoLogin}
                                        disabled={isDemoLoading || isLoading}
                                    >
                                        <User className="w-4 h-4 mr-2" />
                                        {isDemoLoading ? 'Memulai sesi demo…' : 'Masuk sebagai Tamu'}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        Sesi pribadi · tanpa daftar · data akan dihapus saat logout
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="register">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                autoComplete="name"
                                                placeholder="Budi Santoso"
                                                value={registerName}
                                                onChange={(e) => setRegisterName(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="register-email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="register-email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                inputMode="email"
                                                placeholder="nama@email.com"
                                                value={registerEmail}
                                                onChange={(e) => setRegisterEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="register-password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                id="register-password"
                                                name="new-password"
                                                type={showPassword ? 'text' : 'password'}
                                                autoComplete="new-password"
                                                placeholder="Min. 8 karakter, huruf + angka"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                minLength={8}
                                                maxLength={128}
                                                required
                                                aria-describedby="register-password-hint"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                                aria-pressed={showPassword}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p id="register-password-hint" className="text-xs text-muted-foreground mt-1">
                                            Minimal 8 karakter, kombinasi huruf dan angka.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-brand hover:bg-brand"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Memuat...' : 'Daftar'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
        </AuthShell>
    );
}
