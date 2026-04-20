"use client";

import { useState, useMemo } from 'react';
import { 
  Calculator, Wallet, Home, Utensils, Car, 
  Zap, Film, MoreHorizontal, TrendingUp, 
  MapPin, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { indonesianCityCostOfLiving, indonesianJobMarketData } from '@/shared/data/indonesianData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const expenseCategories = [
  { id: 'housing', label: 'Tempat Tinggal/Sewa', icon: Home, color: '#0ea5e9' },
  { id: 'food', label: 'Makanan & Belanja', icon: Utensils, color: '#10b981' },
  { id: 'transportation', label: 'Transportasi', icon: Car, color: '#f59e0b' },
  { id: 'utilities', label: 'Utilitas', icon: Zap, color: '#8b5cf6' },
  { id: 'entertainment', label: 'Hiburan', icon: Film, color: '#ec4899' },
  { id: 'others', label: 'Lainnya', icon: MoreHorizontal, color: '#64748b' },
];

export function FinancialCalculator() {
  const [activeTab, setActiveTab] = useState('budget');
  const [monthlyIncome, setMonthlyIncome] = useState(15000000);
  const [expenses, setExpenses] = useState({
    housing: 5000000,
    food: 2500000,
    transportation: 1500000,
    utilities: 1000000,
    entertainment: 1000000,
    others: 1000000,
  });
  const [selectedCity, setSelectedCity] = useState('Jakarta');
  const [compareCity, setCompareCity] = useState('Singapore');
  const [targetPosition, setTargetPosition] = useState('Software Engineer');

  const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
  const savings = monthlyIncome - totalExpenses;
  const savingsRate = (savings / monthlyIncome) * 100;

  const expenseData = expenseCategories.map(cat => ({
    name: cat.label,
    value: expenses[cat.id as keyof typeof expenses],
    color: cat.color,
  }));

  const getCityData = (cityName: string) => {
    return indonesianCityCostOfLiving.find(c => c.name === cityName) || indonesianCityCostOfLiving[0];
  };

  const cityComparisonData = useMemo(() => {
    const city1 = getCityData(selectedCity);
    const city2 = getCityData(compareCity);
    return [
      { name: 'Indeks Biaya', [selectedCity]: city1.costIndex, [compareCity]: city2.costIndex },
      { name: 'Indeks Sewa', [selectedCity]: city1.rentIndex, [compareCity]: city2.rentIndex },
      { name: 'Belanja', [selectedCity]: city1.groceriesIndex, [compareCity]: city2.groceriesIndex },
      { name: 'Restoran', [selectedCity]: city1.restaurantIndex, [compareCity]: city2.restaurantIndex },
    ];
  }, [selectedCity, compareCity]);

  const salaryData = indonesianJobMarketData.find(j => j.position === targetPosition);

  const updateExpense = (category: string, value: number) => {
    setExpenses(prev => ({ ...prev, [category]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Kalkulator Keuangan</h1>
        <p className="text-muted-foreground mt-2">Rencanakan keuangan Anda dan bandingkan biaya hidup antar kota</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList variant="equal" cols={3} className="max-w-lg">
          <TabsTrigger value="budget">Perencanaan Budget</TabsTrigger>
          <TabsTrigger value="salary">Info Gaji</TabsTrigger>
          <TabsTrigger value="compare">Bandingkan Kota</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-brand" />
                    Pendapatan Bulanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Gaji Bulanan (IDR)</Label>
                        <span className="font-semibold text-brand">
                          {formatCurrency(monthlyIncome)}
                        </span>
                      </div>
                      <Slider
                        value={[monthlyIncome]}
                        onValueChange={([value]) => setMonthlyIncome(value)}
                        max={50000000}
                        step={500000}
                        className="w-full"
                      />
                    </div>
                    <Input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-brand" />
                    Pengeluaran Bulanan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {expenseCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <div key={category.id}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" style={{ color: category.color }} />
                              <Label className="text-sm">{category.label}</Label>
                            </div>
                            <span className="font-medium text-foreground">
                              {formatCurrency(expenses[category.id as keyof typeof expenses])}
                            </span>
                          </div>
                          <Slider
                            value={[expenses[category.id as keyof typeof expenses]]}
                            onValueChange={([value]) => updateExpense(category.id, value)}
                            max={10000000}
                            step={100000}
                            className="w-full"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Section */}
            <div className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-brand-muted rounded-lg">
                      <p className="text-sm text-brand">Pendapatan Bulanan</p>
                      <p className="text-2xl font-bold text-brand">
                        {formatCurrency(monthlyIncome)}
                      </p>
                    </div>

                    <div className="p-4 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">Total Pengeluaran</p>
                      <p className="text-2xl font-bold text-destructive">
                        {formatCurrency(totalExpenses)}
                      </p>
                    </div>

                    <div className={cn(
                      'p-4 rounded-lg',
                      savings >= 0 ? 'bg-success/10' : 'bg-warning/10'
                    )}>
                      <p className={cn(
                        'text-sm',
                        savings >= 0 ? 'text-success' : 'text-warning'
                      )}>
                        Tabungan Bulanan
                      </p>
                      <p className={cn(
                        'text-2xl font-bold',
                        savings >= 0 ? 'text-success' : 'text-warning'
                      )}>
                        {formatCurrency(savings)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tingkat Tabungan</span>
                        <span className={cn(
                          'font-bold',
                          savingsRate >= 20 ? 'text-success' : 'text-warning'
                        )}>
                          {savingsRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            savingsRate >= 20 ? 'bg-success' : 'bg-warning'
                          )}
                          style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Rincian Pengeluaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {savingsRate < 20 && (
                <Card className="border-warning/30 bg-warning/10">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-warning">Tingkat Tabungan Rendah</p>
                        <p className="text-sm text-warning mt-1">
                          Cobalah menyisihkan minimal 20% pendapatan untuk tabungan. Pertimbangkan untuk mengurangi pengeluaran hiburan.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Pilih Posisi</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={targetPosition} onValueChange={setTargetPosition}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {indonesianJobMarketData.map((job) => (
                    <SelectItem key={job.position} value={job.position}>
                      {job.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {salaryData && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="border-border">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Minimum</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {formatCurrency(salaryData.salaryRange.min)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Median</p>
                      <p className="text-xl font-bold text-brand mt-1">
                        {formatCurrency(salaryData.salaryRange.median)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Maksimum</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {formatCurrency(salaryData.salaryRange.max)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Rentang Gaji</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[salaryData.salaryRange]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="min" fill="#94a3b8" name="Minimum" />
                          <Bar dataKey="median" fill="#0ea5e9" name="Median" />
                          <Bar dataKey="max" fill="#0284c7" name="Maksimum" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Skill Utama</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {salaryData.topSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-brand-muted text-brand">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg">Tren Pasar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center',
                        salaryData.demandTrend === 'increasing' ? 'bg-success/20' : 'bg-warning/20'
                      )}>
                        <TrendingUp className={cn(
                          'w-6 h-6',
                          salaryData.demandTrend === 'increasing' ? 'text-success' : 'text-warning'
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground capitalize">
                          {salaryData.demandTrend === 'increasing' ? 'Meningkat' : 'Stabil'}
                        </p>
                        <p className="text-sm text-muted-foreground">Tren Permintaan</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Pilih Kota untuk Dibandingkan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Kota Anda</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {indonesianCityCostOfLiving.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Bandingkan Dengan</Label>
                  <Select value={compareCity} onValueChange={setCompareCity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {indonesianCityCostOfLiving.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Perbandingan Biaya</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey={selectedCity} fill="#0ea5e9" />
                      <Bar dataKey={compareCity} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Detail Kota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[selectedCity, compareCity].map((cityName, index) => {
                    const city = getCityData(cityName);
                    return (
                      <div 
                        key={cityName} 
                        className={cn(
                          'p-4 rounded-xl',
                          index === 0 ? 'bg-brand-muted' : 'bg-accent/50'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            index === 0 ? 'bg-brand' : 'bg-accent-foreground'
                          )}>
                            <MapPin className="w-5 h-5 text-brand-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{city.name}</p>
                            <p className="text-sm text-muted-foreground">{city.country}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Indeks Biaya</p>
                            <p className={cn(
                              'font-semibold',
                              index === 0 ? 'text-brand' : 'text-brand'
                            )}>
                              {city.costIndex}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Indeks Sewa</p>
                            <p className={cn(
                              'font-semibold',
                              index === 0 ? 'text-brand' : 'text-brand'
                            )}>
                              {city.rentIndex}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
