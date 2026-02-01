import { useState } from 'react';
import { 
  FileCheck, CheckCircle2, Circle, AlertCircle, 
  Calendar, FileText, Plane, Building2, Heart, 
  Wallet, GraduationCap, Briefcase, Globe, 
  ChevronRight, Download, Bell, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/lib/utils';
import { indonesianDocumentChecklist, indonesianCategoryLabels } from '@/data/indonesianData';
import type { ChecklistItem } from '@/types';

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
            ? 'border-green-500 bg-green-50/50' 
            : item.required 
              ? 'border-slate-200 bg-white hover:border-career-300'
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
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
              ? 'bg-green-500 text-white' 
              : 'bg-slate-100 text-slate-400 hover:bg-career-100 hover:text-career-600'
          )}
        >
          {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn(
                'font-medium',
                item.completed ? 'text-green-700 line-through' : 'text-slate-900'
              )}>
                {item.title}
              </h4>
              <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.required && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                  Wajib
                </Badge>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className="w-3.5 h-3.5" />
              {indonesianCategoryLabels[item.subcategory]}
            </div>
            {item.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Ceklis Dokumen</h1>
        <p className="text-slate-600 mt-2">Kelola semua dokumen yang diperlukan untuk melamar pekerjaan</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
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
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-career-600">{localProgress.percentage}%</div>
                  <p className="text-sm text-slate-500 mt-1">Progress Keseluruhan</p>
                  <Progress value={localProgress.percentage} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{localProgress.completed}</div>
                  <p className="text-sm text-slate-500 mt-1">Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{localProgress.total - localProgress.completed}</div>
                  <p className="text-sm text-slate-500 mt-1">Belum Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{localProgress.required - localProgress.requiredCompleted}</div>
                  <p className="text-sm text-slate-500 mt-1">Wajib Tersisa</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & List */}
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar Filters */}
            <div className="space-y-4">
              <Card className="border-slate-200">
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
                          ? 'bg-career-100 text-career-700' 
                          : 'hover:bg-slate-50 text-slate-700'
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
                              ? 'bg-career-100 text-career-700' 
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {indonesianCategoryLabels[subcat]}
                          </div>
                          <Badge variant="secondary" className="bg-slate-100">{count}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-career-50 to-career-100">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-career-500 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-career-900">Pengingat</h4>
                      <p className="text-sm text-career-700 mt-1">
                        SKCK perlu diperpanjang setiap 6 bulan. Atur pengingat!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document List */}
            <div className="lg:col-span-3">
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {filterCategory ? indonesianCategoryLabels[filterCategory] : 'Semua Dokumen'}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-slate-100">
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
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-career-600">{internationalProgress.percentage}%</div>
                  <p className="text-sm text-slate-500 mt-1">Progress Keseluruhan</p>
                  <Progress value={internationalProgress.percentage} className="mt-3 h-2" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{internationalProgress.completed}</div>
                  <p className="text-sm text-slate-500 mt-1">Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{internationalProgress.total - internationalProgress.completed}</div>
                  <p className="text-sm text-slate-500 mt-1">Belum Selesai</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{internationalProgress.required - internationalProgress.requiredCompleted}</div>
                  <p className="text-sm text-slate-500 mt-1">Wajib Tersisa</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900">Penting untuk Kerja Luar Negeri</h4>
                  <p className="text-amber-800 mt-1">
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
              <Card className="border-slate-200">
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
                          ? 'bg-career-100 text-career-700' 
                          : 'hover:bg-slate-50 text-slate-700'
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
                              ? 'bg-career-100 text-career-700' 
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            {indonesianCategoryLabels[subcat]}
                          </div>
                          <Badge variant="secondary" className="bg-slate-100">{count}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Plane className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900">Destinasi Populer</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="bg-white text-blue-700">Singapura</Badge>
                        <Badge variant="secondary" className="bg-white text-blue-700">Australia</Badge>
                        <Badge variant="secondary" className="bg-white text-blue-700">Jepang</Badge>
                        <Badge variant="secondary" className="bg-white text-blue-700">UAE</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document List */}
            <div className="lg:col-span-3">
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {filterCategory ? indonesianCategoryLabels[filterCategory] : 'Semua Dokumen'}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-slate-100">
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
                    selectedItem.completed ? 'bg-green-500' : 'bg-career-500'
                  )}>
                    {selectedItem.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <FileText className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                    <p className="text-sm text-slate-500">{selectedItem.description}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-100">
                    {indonesianCategoryLabels[selectedItem.subcategory]}
                  </Badge>
                  {selectedItem.required && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      Wajib
                    </Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tenggat Waktu (Opsional)</Label>
                    <Input 
                      type="date"
                      value={selectedItem.dueDate || ''}
                      onChange={(e) => updateItem(selectedItem.id, { dueDate: e.target.value })}
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
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-green-600 hover:bg-green-700'
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
