"use client";

import { useState } from 'react';
import { 
  FileCheck, CheckCircle2, Circle, AlertCircle, 
  Calendar, FileText, Plane, Building2, Heart, 
  Wallet, GraduationCap, Briefcase, Globe, 
  ChevronRight, Download, Bell, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ResponsivePageHeader } from '@/shared/components/ui/responsive-page-header';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from '@/shared/components/ui/responsive-dialog';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { DatePicker } from '@/shared/components/ui/date-picker';
import { cn } from '@/shared/lib/utils';
import { indonesianDocumentChecklist, indonesianCategoryLabels } from '@/shared/data/indonesianData';
import type { ChecklistItem } from '../types';

const categoryIcons: Record<string, React.ElementType> = {
  identity: FileText,
  education: GraduationCap,
  professional: Briefcase,
  financial: Wallet,
  health: Heart,
  travel: Plane,
};

export function DocumentChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(indonesianDocumentChecklist);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('local');

  const toggleItem = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateItem = (itemId: string, updates: Partial<ChecklistItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const getFilteredItems = (category: 'local' | 'international') => {
    return items.filter(item => {
      if (item.category !== category) return false;
      if (filterCategory && item.subcategory !== filterCategory) return false;
      return true;
    });
  };

  const getProgress = (category: 'local' | 'international') => {
    const categoryItems = items.filter(item => item.category === category);
    const requiredItems = categoryItems.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);
    
    return {
      total: categoryItems.length,
      completed: categoryItems.filter(item => item.completed).length,
      required: requiredItems.length,
      requiredCompleted: completedRequired.length,
      percentage: requiredItems.length > 0 
        ? Math.round((completedRequired.length / requiredItems.length) * 100) 
        : 0,
    };
  };

  const getSubcategories = (category: 'local' | 'international') => {
    const categoryItems = items.filter(item => item.category === category);
    const subcategories = [...new Set(categoryItems.map(item => item.subcategory))];
    return subcategories;
  };

  const localProgress = getProgress('local');
  const internationalProgress = getProgress('international');

  const ChecklistItemCard = ({ item }: { item: ChecklistItem }) => {
    const Icon = categoryIcons[item.subcategory] || FileText;
    
    return (
      <div 
        className={cn(
          'group flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
          item.completed 
            ? 'border-success/30 bg-success/10' 
            : item.required 
              ? 'border-border bg-card hover:border-brand'
              : 'border-border bg-muted/50/50 hover:border-border'
        )}
        onClick={() => setSelectedItem(item)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleItem(item.id);
          }}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
            item.completed 
              ? 'bg-success text-brand-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-brand-muted hover:text-brand'
          )}
        >
          {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                'font-medium',
                item.completed ? 'text-success line-through' : 'text-foreground'
              )}>
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.required && (
                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
                  Wajib
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5" />
              {indonesianCategoryLabels[item.subcategory]}
            </div>
            {item.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-warning">
                <Calendar className="w-3.5 h-3.5" />
                Batas: {item.dueDate}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ResponsivePageHeader
        title="Ceklis Dokumen"
        description="Kelola semua dokumen yang diperlukan untuk melamar pekerjaan"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList variant="equal" cols={2}>
          <TabsTrigger value="local" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Kerja Lokal
          </TabsTrigger>
          <TabsTrigger value="international" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Kerja Luar Negeri
          </TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand">{localProgress.percentage}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Progress Keseluruhan</p>
                  <Progress value={localProgress.percentage} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">{localProgress.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning">{localProgress.total - localProgress.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Belum Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">{localProgress.required - localProgress.requiredCompleted}</div>
                  <p className="text-sm text-muted-foreground mt-1">Wajib Tersisa</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & List */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Kategori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200',
                        filterCategory === null 
                          ? 'bg-brand-muted text-brand' 
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <FileCheck className="w-5 h-5" />
                      Semua Dokumen
                    </button>
                    {getSubcategories('local').map((subcat) => {
                      const Icon = categoryIcons[subcat] || FileText;
                      const count = items.filter(i => i.category === 'local' && i.subcategory === subcat).length;
                      return (
                        <button
                          key={subcat}
                          onClick={() => setFilterCategory(subcat)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200',
                            filterCategory === subcat 
                              ? 'bg-brand-muted text-brand' 
                              : 'hover:bg-muted/50 text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {indonesianCategoryLabels[subcat]}
                          </div>
                          <Badge variant="secondary" className="bg-muted">{count}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-brand-muted to-brand-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-brand-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand">Pengingat</h4>
                      <p className="text-sm text-brand mt-1">
                        SKCK perlu diperpanjang setiap 6 bulan. Atur pengingat!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document List */}
            <div className="lg:col-span-3">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {filterCategory ? indonesianCategoryLabels[filterCategory] : 'Semua Dokumen'}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-muted">
                      {getFilteredItems('local').length} item
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getFilteredItems('local').map((item) => (
                      <ChecklistItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="international" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand">{internationalProgress.percentage}%</div>
                  <p className="text-sm text-muted-foreground mt-1">Progress Keseluruhan</p>
                  <Progress value={internationalProgress.percentage} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">{internationalProgress.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning">{internationalProgress.total - internationalProgress.completed}</div>
                  <p className="text-sm text-muted-foreground mt-1">Belum Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive">{internationalProgress.required - internationalProgress.requiredCompleted}</div>
                  <p className="text-sm text-muted-foreground mt-1">Wajib Tersisa</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="border-warning/30 bg-warning/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-brand-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-warning">Penting untuk Kerja Luar Negeri</h4>
                  <p className="text-warning mt-1">
                    Persyaratan bervariasi sesuai negara. Selalu periksa persyaratan spesifik negara tujuan Anda. 
                    Beberapa dokumen mungkin memerlukan apostille atau legalisasi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter & List */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filter Kategori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFilterCategory(null)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200',
                        filterCategory === null 
                          ? 'bg-brand-muted text-brand' 
                          : 'hover:bg-muted/50 text-foreground'
                      )}
                    >
                      <FileCheck className="w-5 h-5" />
                      Semua Dokumen
                    </button>
                    {getSubcategories('international').map((subcat) => {
                      const Icon = categoryIcons[subcat] || FileText;
                      const count = items.filter(i => i.category === 'international' && i.subcategory === subcat).length;
                      return (
                        <button
                          key={subcat}
                          onClick={() => setFilterCategory(subcat)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200',
                            filterCategory === subcat 
                              ? 'bg-brand-muted text-brand' 
                              : 'hover:bg-muted/50 text-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {indonesianCategoryLabels[subcat]}
                          </div>
                          <Badge variant="secondary" className="bg-muted">{count}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-gradient-to-br from-info/20 to-info/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-info flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 text-brand-foreground" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-info">Destinasi Populer</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="bg-card text-info">Singapura</Badge>
                        <Badge variant="secondary" className="bg-card text-info">Australia</Badge>
                        <Badge variant="secondary" className="bg-card text-info">Jepang</Badge>
                        <Badge variant="secondary" className="bg-card text-info">UAE</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document List */}
            <div className="lg:col-span-3">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {filterCategory ? indonesianCategoryLabels[filterCategory] : 'Semua Dokumen'}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-muted">
                      {getFilteredItems('international').length} item
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getFilteredItems('international').map((item) => (
                      <ChecklistItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    selectedItem.completed ? 'bg-success' : 'bg-brand'
                  )}>
                    {selectedItem.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-brand-foreground" />
                    ) : (
                      <FileText className="w-6 h-6 text-brand-foreground" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-muted">
                    {indonesianCategoryLabels[selectedItem.subcategory]}
                  </Badge>
                  {selectedItem.required && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                      Wajib
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tenggat Waktu (Opsional)</Label>
                    <DatePicker
                      value={selectedItem.dueDate || undefined}
                      onChange={(v) => updateItem(selectedItem.id, { dueDate: v })}
                      placeholder="Pilih tenggat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Textarea 
                      placeholder="Tambahkan catatan tentang dokumen ini..."
                      value={selectedItem.notes || ''}
                      onChange={(e) => updateItem(selectedItem.id, { notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className={cn(
                      'flex-1',
                      selectedItem.completed
                        ? 'bg-muted text-foreground hover:bg-muted'
                        : 'bg-success hover:bg-success'
                    )}
                    onClick={() => {
                      toggleItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                  >
                    {selectedItem.completed ? (
                      'Tandai Belum Selesai'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Tandai Selesai
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Unduh Template
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
