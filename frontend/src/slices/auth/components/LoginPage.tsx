"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoLoading, setIsDemoLoading] = useState(false);

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
                notify.success(`Selamat datang, ${registerName.split(' ')[0] || 'rekan'}! 🎉`, {
                    description: 'Akun berhasil dibuat — mengarahkan ke dashboard…',
                    duration: 3500,
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
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
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
