import { useState } from 'react';
import { 
  TrendingUp, Briefcase, Calendar, 
  CheckCircle2, Target, Award, ArrowUpRight,
  MoreHorizontal, Plus, Filter,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import type { Application } from '../types';

// Mock data for charts
const applicationData = [
  { name: 'Minggu 1', applied: 5, interviews: 1, offers: 0 },
  { name: 'Minggu 2', applied: 8, interviews: 2, offers: 0 },
  { name: 'Minggu 3', applied: 12, interviews: 3, offers: 1 },
  { name: 'Minggu 4', applied: 15, interviews: 4, offers: 1 },
];

const statusData = [
  { name: 'Dilamar', value: 15, color: '#0ea5e9' },
  { name: 'Screening', value: 5, color: '#f59e0b' },
  { name: 'Wawancara', value: 4, color: '#8b5cf6' },
  { name: 'Tawaran', value: 1, color: '#10b981' },
  { name: 'Ditolak', value: 3, color: '#ef4444' },
];

const initialApplications: Application[] = [
  { id: '1', company: 'Tokopedia', position: 'Frontend Developer', status: 'interview', appliedDate: '2024-01-15', lastUpdate: '2024-01-20' },
  { id: '2', company: 'Gojek', position: 'Full Stack Engineer', status: 'screening', appliedDate: '2024-01-14', lastUpdate: '2024-01-18' },
  { id: '3', company: 'Shopee', position: 'React Developer', status: 'applied', appliedDate: '2024-01-13', lastUpdate: '2024-01-13' },
  { id: '4', company: 'Traveloka', position: 'Software Engineer', status: 'offer', appliedDate: '2024-01-10', lastUpdate: '2024-01-22' },
  { id: '5', company: 'Bukalapak', position: 'UI Engineer', status: 'rejected', appliedDate: '2024-01-08', lastUpdate: '2024-01-16' },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  applied: { label: 'Dilamar', color: 'text-career-600', bgColor: 'bg-career-100' },
  screening: { label: 'Screening', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  interview: { label: 'Wawancara', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  offer: { label: 'Tawaran', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: 'Ditolak', color: 'text-red-600', bgColor: 'bg-red-100' },
  withdrawn: { label: 'Ditarik', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export function CareerDashboard() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newApplication, setNewApplication] = useState<Partial<Application>>({
    status: 'applied',
  });

  const stats = {
    totalApplications: applications.length,
    interviewsScheduled: applications.filter(a => a.status === 'interview').length,
    offersReceived: applications.filter(a => a.status === 'offer').length,
    responseRate: Math.round((applications.filter(a => a.status !== 'applied').length / applications.length) * 100) || 0,
    weeklyGoal: 10,
    weeklyProgress: 7,
  };

  const addApplication = () => {
    if (newApplication.company && newApplication.position) {
      const application: Application = {
        id: Date.now().toString(),
        company: newApplication.company,
        position: newApplication.position,
        status: newApplication.status as Application['status'] || 'applied',
        appliedDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString().split('T')[0],
      };
      setApplications([application, ...applications]);
      setNewApplication({ status: 'applied' });
      setAddDialogOpen(false);
    }
  };

  const updateStatus = (id: string, status: Application['status']) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status, lastUpdate: new Date().toISOString().split('T')[0] } : app
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Karir</h1>
          <p className="text-slate-600 mt-2">Pantau progress pencarian kerja Anda</p>
        </div>
        <Button 
          onClick={() => setAddDialogOpen(true)}
          className="bg-career-600 hover:bg-career-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Lamaran
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Lamaran</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-career-100 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-career-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">+3</span>
              <span className="text-slate-500">minggu ini</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Wawancara</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.interviewsScheduled}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">+1</span>
              <span className="text-slate-500">minggu ini</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tawaran Diterima</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.offersReceived}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">Selamat!</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tingkat Respons</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.responseRate}%</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500" />
              <span className="text-green-600 font-medium">+5%</span>
              <span className="text-slate-500">vs minggu lalu</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal */}
      <Card className="border-slate-200 mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-career-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-career-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Target Mingguan</p>
                <p className="text-sm text-slate-500">Lamar ke {stats.weeklyGoal} pekerjaan minggu ini</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-career-600">{stats.weeklyProgress}/{stats.weeklyGoal}</p>
              <p className="text-sm text-slate-500">lamaran</p>
            </div>
          </div>
          <Progress value={(stats.weeklyProgress / stats.weeklyGoal) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Charts & Applications */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Ringkasan</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Aktivitas Lamaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={applicationData}>
                        <defs>
                          <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="applied" 
                          stroke="#0ea5e9" 
                          fillOpacity={1} 
                          fill="url(#colorApplied)" 
                          name="Dilamar"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="interviews" 
                          stroke="#8b5cf6" 
                          fillOpacity={1} 
                          fill="url(#colorInterviews)" 
                          name="Wawancara"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg">Status Lamaran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {statusData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Recent Applications */}
        <div>
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Lamaran Terbaru</CardTitle>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((app) => {
                  const status = statusConfig[app.status];
                  return (
                    <div 
                      key={app.id} 
                      className="p-4 rounded-xl border border-slate-200 hover:border-career-300 hover:bg-career-50/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">{app.position}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-600">{app.company}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={cn('text-xs', status.bgColor, status.color)}>
                              {status.label}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {app.appliedDate}
                            </span>
                          </div>
                        </div>
                        <Select 
                          value={app.status} 
                          onValueChange={(value) => updateStatus(app.id, value as Application['status'])}
                        >
                          <SelectTrigger className="w-8 h-8 p-0 border-0">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="applied">Dilamar</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interview">Wawancara</SelectItem>
                            <SelectItem value="offer">Tawaran</SelectItem>
                            <SelectItem value="rejected">Ditolak</SelectItem>
                            <SelectItem value="withdrawn">Ditarik</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Application Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Lamaran Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Perusahaan</Label>
              <Input 
                placeholder="contoh: Tokopedia"
                value={newApplication.company || ''}
                onChange={(e) => setNewApplication({ ...newApplication, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Posisi</Label>
              <Input 
                placeholder="contoh: Software Engineer"
                value={newApplication.position || ''}
                onChange={(e) => setNewApplication({ ...newApplication, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={newApplication.status} 
                onValueChange={(value) => setNewApplication({ ...newApplication, status: value as Application['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Dilamar</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Wawancara</SelectItem>
                  <SelectItem value="offer">Tawaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addApplication} className="w-full bg-career-600 hover:bg-career-700">
              Tambah Lamaran
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
