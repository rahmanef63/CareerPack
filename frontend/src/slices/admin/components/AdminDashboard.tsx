"use client";

import { useState } from 'react';
import {
  Users, Settings, Database, BarChart3, Key,
  Play, Save, RefreshCw,
  CheckCircle2, AlertCircle, Bot, ChevronLeft,
  Layout, Server, Cloud, TrendingUp, FileText,
  Calculator, Users2, Kanban, Handshake, Headphones,
  Image, Video, Palette, Smartphone, BarChart4
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Slider } from '@/shared/components/ui/slider';
import { Switch } from '@/shared/components/ui/switch';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useAIConfig } from '@/shared/hooks/useAIConfig';
import { generateAllMockData, type GeneratedMockData } from '@/slices/admin/utils/mockDataGenerator';
import { indonesianRoadmapCategories } from '@/shared/data/indonesianData';
import { cn } from '@/shared/lib/utils';

const iconComponents: Record<string, React.ElementType> = {
  Layout, Server, Cloud, TrendingUp, FileText, Calculator, Users2, Kanban,
  Handshake, Headphones, Image, Video, Palette, Smartphone, BarChart4,
};

export function AdminDashboard() {
  const { config, updateConfig, isConfigured } = useAIConfig();
  const [activeTab, setActiveTab] = useState('overview');
  const [mockData, setMockData] = useState<GeneratedMockData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // AI Config state
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [temperature, setTemperature] = useState(config.temperature);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens);
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);

  // Roadmap categories state
  const [categories, setCategories] = useState(indonesianRoadmapCategories);

  const handleSaveAIConfig = () => {
    updateConfig({
      apiKey,
      temperature,
      maxTokens,
      isEnabled,
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleGenerateMockData = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const data = generateAllMockData(10);
    setMockData(data);
    setIsGenerating(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleToggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
    ));
  };

  const stats = mockData ? {
    users: mockData.users.length,
    cvs: Object.keys(mockData.cvs).length,
    applications: Object.values(mockData.applications).flat().length,
    aiRequests: Math.floor(Math.random() * 1000) + 500,
  } : {
    users: 0,
    cvs: 0,
    applications: 0,
    aiRequests: 0,
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-from to-brand-to flex items-center justify-center">
                <Settings className="w-5 h-5 text-brand-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Kelola sistem CareerPack</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Kembali ke App
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccess && (
          <Alert className="mb-6 bg-success/10 border-success/30">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <AlertDescription className="text-success">
              Operasi berhasil dilakukan!
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Ringkasan</TabsTrigger>
            <TabsTrigger value="ai">Konfigurasi AI</TabsTrigger>
            <TabsTrigger value="roadmap">Skill Roadmap</TabsTrigger>
            <TabsTrigger value="devtools">DevTools</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pengguna</p>
                      <p className="text-3xl font-bold text-foreground">{stats.users}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-info" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CV Dibuat</p>
                      <p className="text-3xl font-bold text-foreground">{stats.cvs}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Lamaran Dikirim</p>
                      <p className="text-3xl font-bold text-foreground">{stats.applications}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-brand" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Request AI</p>
                      <p className="text-3xl font-bold text-foreground">{stats.aiRequests}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Sistem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bot className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">AI Assistant</span>
                    </div>
                    <Badge className={isConfigured ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                      {isConfigured ? 'Aktif' : 'Belum Dikonfigurasi'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Mock Data</span>
                    </div>
                    <Badge className={mockData ? 'bg-success/20 text-success' : 'bg-muted text-foreground'}>
                      {mockData ? `${mockData.users.length} Users` : 'Belum Dibuat'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">Skill Roadmap</span>
                    </div>
                    <Badge className="bg-success/20 text-success">
                      {categories.filter(c => c.isActive).length} Aktif
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Config Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Konfigurasi GLM-4.7 AI
                </CardTitle>
                <CardDescription>
                  Atur API key dan parameter untuk AI Career Assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Aktifkan AI Assistant</p>
                    <p className="text-sm text-muted-foreground">Izinkan pengguna menggunakan fitur AI chat</p>
                  </div>
                  <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>API Key Z.ai</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan API key dari <a href="https://docs.z.ai" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">docs.z.ai</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    value={config.baseUrl}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={config.model}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Temperature</Label>
                      <span className="text-sm text-muted-foreground">{temperature}</span>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={([value]) => setTemperature(value)}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Semakin tinggi, semakin kreatif respons AI
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Max Tokens</Label>
                      <span className="text-sm text-muted-foreground">{maxTokens}</span>
                    </div>
                    <Slider
                      value={[maxTokens]}
                      onValueChange={([value]) => setMaxTokens(value)}
                      min={256}
                      max={4096}
                      step={256}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveAIConfig}
                  className="w-full bg-brand hover:bg-brand"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Konfigurasi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roadmap Tab */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Kategori Skill Roadmap</CardTitle>
                <CardDescription>
                  Aktifkan/nonaktifkan kategori yang tersedia untuk pengguna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => {
                    const Icon = iconComponents[category.icon] || Layout;
                    return (
                      <div
                        key={category.id}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all duration-200',
                          category.isActive
                            ? 'border-brand bg-brand-muted'
                            : 'border-border bg-card opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              category.color
                            )}>
                              <Icon className="w-5 h-5 text-brand-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{category.name}</p>
                              <p className="text-xs text-muted-foreground">{category.description}</p>
                            </div>
                          </div>
                          <Switch
                            checked={category.isActive}
                            onCheckedChange={() => handleToggleCategory(category.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DevTools Tab */}
          <TabsContent value="devtools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Mock Data Generator
                </CardTitle>
                <CardDescription>
                  Generate data dummy untuk testing dan development
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Peringatan</p>
                      <p className="text-sm text-warning">
                        Fitur ini akan menghasilkan data dummy yang disimpan di local storage.
                        Data ini hanya untuk development dan testing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Jumlah User</p>
                    <p className="text-2xl font-bold text-foreground">10</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Data yang Dibuat</p>
                    <p className="text-2xl font-bold text-foreground">
                      {mockData ? 'User, CV, Lamaran, Checklist' : '-'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateMockData}
                  disabled={isGenerating}
                  className="w-full bg-brand hover:bg-brand"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Membuat Data...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Mock Data
                    </>
                  )}
                </Button>

                {mockData && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Preview Data:</h4>
                    <div className="bg-foreground text-background rounded-lg p-4 overflow-auto max-h-64">
                      <pre className="text-xs font-mono">
                        {JSON.stringify({
                          users: mockData.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })),
                          totalCVs: Object.keys(mockData.cvs).length,
                          totalApplications: Object.values(mockData.applications).flat().length,
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
