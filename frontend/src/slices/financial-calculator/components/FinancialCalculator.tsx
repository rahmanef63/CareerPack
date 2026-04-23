"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import {
  Calculator, Wallet, TrendingUp, MapPin, AlertCircle, Pencil
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { ResponsivePageHeader } from '@/shared/components/ui/responsive-page-header';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  ResponsiveSelect as Select,
  ResponsiveSelectContent as SelectContent,
  ResponsiveSelectItem as SelectItem,
  ResponsiveSelectTrigger as SelectTrigger,
} from '@/shared/components/ui/responsive-select';
import { cn } from '@/shared/lib/utils';
import { indonesianCityCostOfLiving, indonesianJobMarketData } from '@/shared/data/indonesianData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ResponsiveTooltip as HelpTooltip,
  ResponsiveTooltipContent,
  ResponsiveTooltipTrigger,
} from '@/shared/components/ui/responsive-tooltip';
import { Info } from 'lucide-react';
import { api } from '../../../../../convex/_generated/api';
import type { Doc, Id } from '../../../../../convex/_generated/dataModel';
import { iconFor } from '../constants/budgetIcons';
import { BudgetVariableForm } from './BudgetVariableForm';

type BudgetVar = Doc<"budgetVariables">;

export function FinancialCalculator() {
  const [activeTab, setActiveTab] = useState('budget');
  const [monthlyIncome, setMonthlyIncome] = useState(15000000);
  const [selectedCity, setSelectedCity] = useState('Jakarta');
  const [compareCity, setCompareCity] = useState('Singapore');
  const [targetPosition, setTargetPosition] = useState('Software Engineer');

  // Backend-persisted budget envelopes (per-user, seeded on first visit).
  const variables = useQuery(api.budgetVariables.listMine);
  const seedDefaults = useMutation(api.budgetVariables.seedDefaults);
  const updateVariable = useMutation(api.budgetVariables.updateVariable);

  // Auto-seed defaults on first render after auth resolves empty list.
  const seedAttempted = useRef(false);
  useEffect(() => {
    if (variables && variables.length === 0 && !seedAttempted.current) {
      seedAttempted.current = true;
      seedDefaults().catch(() => {
        // Non-fatal; user will see empty state with "Tambah Variabel" CTA.
      });
    }
  }, [variables, seedDefaults]);

  // Local slider mirror — keeps UI snappy while drag in progress. Persists
  // the final value to Convex 400 ms after last change (debounced).
  const [localValues, setLocalValues] = useState<Record<string, number>>({});
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!variables) return;
    setLocalValues((prev) => {
      const next: Record<string, number> = { ...prev };
      for (const v of variables) {
        // Only hydrate from server if user isn't actively editing that row.
        if (!(v._id in next)) next[v._id] = v.value;
      }
      return next;
    });
  }, [variables]);

  const handleSliderChange = (id: string, value: number) => {
    setLocalValues((prev) => ({ ...prev, [id]: value }));
    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      updateVariable({ id: id as Id<"budgetVariables">, value }).catch(() => {
        // If save fails, next query refetch will resync.
      });
      debounceTimers.current.delete(id);
    }, 400);
    debounceTimers.current.set(id, t);
  };

  const sortedVars: BudgetVar[] = useMemo(
    () => (variables ? [...variables].sort((a, b) => a.order - b.order) : []),
    [variables],
  );

  const effectiveValue = (v: BudgetVar) =>
    v._id in localValues ? localValues[v._id] : v.value;

  const expenseVars = sortedVars.filter((v) => v.kind === 'expense');
  const savingsVars = sortedVars.filter((v) => v.kind === 'savings');

  const totalExpenses = expenseVars.reduce((sum, v) => sum + effectiveValue(v), 0);
  const totalSavings = savingsVars.reduce((sum, v) => sum + effectiveValue(v), 0);
  const totalAllocated = totalExpenses + totalSavings;
  const unallocated = monthlyIncome - totalAllocated;
  const savingsRate = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;

  const expenseData = sortedVars.map((v) => ({
    name: v.label,
    value: effectiveValue(v),
    color: v.color,
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Locale-aware thousand separator for raw numeric inputs (no Rp prefix).
  const formatNumberID = (value: number): string =>
    value === 0 ? "" : value.toLocaleString("id-ID");

  // Parse back — strip non-digits. Empty → 0.
  const parseNumberID = (raw: string): number => {
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  // Axis-friendly short IDR: "Rp 10jt", "Rp 300rb".
  const formatShortIDR = (value: number): string => {
    if (value >= 1_000_000) return `Rp ${Math.round(value / 1_000_000)}jt`;
    if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
    return `Rp ${value}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ResponsivePageHeader
        title="Kalkulator Keuangan"
        description="Rencanakan keuangan Anda dan bandingkan biaya hidup antar kota"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList variant="equal" cols={3}>
          <TabsTrigger value="budget">
            <span className="sm:hidden">Budget</span>
            <span className="hidden sm:inline">Perencanaan Budget</span>
          </TabsTrigger>
          <TabsTrigger value="salary">
            <span className="sm:hidden">Gaji</span>
            <span className="hidden sm:inline">Info Gaji</span>
          </TabsTrigger>
          <TabsTrigger value="compare">
            <span className="sm:hidden">Kota</span>
            <span className="hidden sm:inline">Bandingkan Kota</span>
          </TabsTrigger>
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
                    <div className="relative mt-2">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        inputMode="numeric"
                        value={formatNumberID(monthlyIncome)}
                        onChange={(e) =>
                          setMonthlyIncome(parseNumberID(e.target.value))
                        }
                        className="pl-9 tabular-nums"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Rentang slider: Rp 0 – Rp 50.000.000 / bulan
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-brand" />
                      Variabel Anggaran Bulanan
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Pengeluaran &amp; tabungan — drag slider, edit label, atau tambah baru.
                    </p>
                  </div>
                  <BudgetVariableForm />
                </CardHeader>
                <CardContent>
                  {variables === undefined && (
                    <p className="text-sm text-muted-foreground">Memuat variabel…</p>
                  )}
                  {variables && variables.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Belum ada variabel. Menyiapkan default…
                    </p>
                  )}
                  <div className="space-y-6">
                    {[...expenseVars, ...savingsVars].map((v) => {
                      const Icon = iconFor(v.iconName);
                      const current = effectiveValue(v);
                      return (
                        <div key={v._id}>
                          <div className="flex justify-between items-center mb-2 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="w-4 h-4 shrink-0" style={{ color: v.color }} />
                              <Label className="text-sm truncate">{v.label}</Label>
                              {v.kind === 'savings' && (
                                <Badge variant="secondary" className="bg-success/15 text-success text-[10px]">
                                  Tabungan
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="font-medium text-foreground text-sm">
                                {formatCurrency(current)}
                              </span>
                              <BudgetVariableForm
                                existing={v}
                                trigger={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    aria-label={`Edit ${v.label}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                          <Slider
                            value={[current]}
                            onValueChange={([value]) => handleSliderChange(v._id, value)}
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

                    <div className="p-4 bg-success/10 rounded-lg">
                      <p className="text-sm text-success">Tabungan Direncanakan</p>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(totalSavings)}
                      </p>
                    </div>

                    <div className={cn(
                      'p-4 rounded-lg',
                      unallocated >= 0 ? 'bg-info/10' : 'bg-warning/10'
                    )}>
                      <p className={cn(
                        'text-sm',
                        unallocated >= 0 ? 'text-info' : 'text-warning'
                      )}>
                        {unallocated >= 0 ? 'Belum Dialokasikan' : 'Kelebihan Alokasi'}
                      </p>
                      <p className={cn(
                        'text-2xl font-bold',
                        unallocated >= 0 ? 'text-info' : 'text-warning'
                      )}>
                        {formatCurrency(unallocated)}
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
                <SelectTrigger className="w-full max-w-md" />
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
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { label: 'Minimum', value: salaryData.salaryRange.min, fill: '#94a3b8' },
                            { label: 'Median', value: salaryData.salaryRange.median, fill: '#0ea5e9' },
                            { label: 'Maksimum', value: salaryData.salaryRange.max, fill: '#0284c7' },
                          ]}
                          margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis
                            dataKey="label"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={formatShortIDR}
                            tickLine={false}
                            axisLine={false}
                            width={56}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Gaji']}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {[
                              { fill: '#94a3b8' },
                              { fill: '#0ea5e9' },
                              { fill: '#0284c7' },
                            ].map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
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
                    <SelectTrigger />
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
                    <SelectTrigger />
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
                <CardTitle className="text-lg flex items-center gap-2">
                  Perbandingan Biaya
                  <HelpTooltip>
                    <ResponsiveTooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                        aria-label="Apa itu indeks biaya?"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </ResponsiveTooltipTrigger>
                    <ResponsiveTooltipContent>
                      <p className="font-medium">Skor indeks biaya</p>
                      <p className="text-muted-foreground">
                        Jakarta = 100 (baseline). Skor 280 artinya 2,8× lebih
                        mahal dari Jakarta. Angka relatif — bukan rupiah.
                      </p>
                    </ResponsiveTooltipContent>
                  </HelpTooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cityComparisonData}
                      margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                        iconType="circle"
                      />
                      <Bar dataKey={selectedCity} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={compareCity} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
                            index === 0 ? 'bg-brand' : 'bg-brand-to'
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
