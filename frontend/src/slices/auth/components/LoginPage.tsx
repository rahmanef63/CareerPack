import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, Shield } from 'lucide-react';
import { BrandMark } from '@/slices/shared/components/Logo';
import { Button } from '@/slices/shared/components/ui/button';
import { Input } from '@/slices/shared/components/ui/input';
import { Label } from '@/slices/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/slices/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/slices/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/slices/shared/components/ui/alert';
import { useAuth } from '@/slices/shared/hooks/useAuth';

export function LoginPage() {
    const router = useRouter();
    const { login, register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Login form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await login({ email: loginEmail, password: loginPassword });
            if (success) {
                router.push('/');
            } else {
                setError('Email atau password salah');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login gagal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await register({
                email: registerEmail,
                password: registerPassword,
                name: registerName
            });
            if (success) {
                router.push('/');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registrasi gagal');
        } finally {
            setIsLoading(false);
        }
    };

    const fillDemoCredentials = (role: 'user' | 'admin') => {
        if (role === 'admin') {
            setLoginEmail('admin@careerpack.id');
        } else {
            setLoginEmail('demo@careerpack.id');
        }
        setLoginPassword('demouser123');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-career-50 via-white to-career-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white"
                        style={{ boxShadow: '0 10px 24px -8px rgba(14,165,233,0.4)' }}
                    >
                        <BrandMark size={24} stroke="#fff" strokeWidth={2.4} />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-career-600 to-career-800 bg-clip-text text-transparent">
                        CareerPack
                    </span>
                </div>

                <Card className="border-slate-200 shadow-xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Selamat Datang</CardTitle>
                        <CardDescription>
                            Masuk atau daftar untuk memulai perjalanan karir Anda
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="login">Masuk</TabsTrigger>
                                <TabsTrigger value="register">Daftar</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="email"
                                                type="email"
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
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-career-600 hover:bg-career-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Memuat...' : 'Masuk'}
                                    </Button>
                                </form>

                                {/* Demo Credentials */}
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <p className="text-sm text-slate-500 text-center mb-3">Akun Demo:</p>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => fillDemoCredentials('user')}
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            User
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => fillDemoCredentials('admin')}
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Admin
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-400 text-center mt-2">Password: demouser123</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="register">
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                type="text"
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
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="register-email"
                                                type="email"
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
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="register-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                className="pl-10 pr-10"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-career-600 hover:bg-career-700"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Memuat...' : 'Daftar'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    © 2024 CareerPack. Semua hak dilindungi.
                </p>
            </div>
        </div>
    );
}
