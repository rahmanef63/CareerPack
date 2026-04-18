import { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Lock, BookOpen, Video, 
  FileText, ExternalLink, ChevronRight, Trophy,
  Code, Server, Cloud, BarChart3, Palette, Smartphone,
  Clock, Target, Star, Play, TrendingUp, Calculator,
  Users, Kanban, Handshake, Headphones, Image,
  Layout, Sparkles, Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { indonesianRoadmapCategories } from '@/shared/data/indonesianData';
import type { RoadmapResource as Resource } from '../types';

const iconMap: Record<string, React.ElementType> = {
  Layout, Code, Server, Cloud, BarChart3, Palette, Smartphone,
  TrendingUp, FileText, Calculator, Users, Kanban, Handshake,
  Headphones, Image, Video,
};

// Simplified Roadmap Node type for UI
interface SimpleRoadmapNode {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  prerequisites: string[];
  resources: Resource[];
  children?: SimpleRoadmapNode[];
}

// Helper to create node
const node = (id: string, title: string, description: string, difficulty: 'beginner' | 'intermediate' | 'advanced', hours: number, prereqs: string[], resources: Resource[]): SimpleRoadmapNode => ({
  id, title, description, difficulty, estimatedHours: hours, prerequisites: prereqs, resources
});

// Generate dynamic roadmap nodes based on category
function generateRoadmapNodes(categoryId: string): SimpleRoadmapNode[] {
  const roadmaps: Record<string, SimpleRoadmapNode[]> = {
    frontend: [
      node('fe-1', 'HTML & CSS Dasar', 'Struktur web dan styling fundamental', 'beginner', 20, [], [
        { id: 'r1', title: 'HTML Dasar - Petani Kode', type: 'video', url: 'https://www.youtube.com/c/PetaniKode', free: true },
        { id: 'r2', title: 'CSS Fundamentals', type: 'article', url: '#', free: true },
      ]),
      node('fe-2', 'JavaScript Fundamental', 'Logika pemrograman web', 'beginner', 40, ['fe-1'], [
        { id: 'r3', title: 'JavaScript Dasar - Web Programming UNPAS', type: 'video', url: 'https://www.youtube.com/c/WebProgrammingUNPAS', free: true },
        { id: 'r4', title: 'JavaScript.info', type: 'article', url: 'https://javascript.info', free: true },
      ]),
      node('fe-3', 'React.js', 'Library UI modern dari Meta', 'intermediate', 50, ['fe-2'], [
        { id: 'r5', title: 'React Dokumentasi Resmi', type: 'article', url: 'https://react.dev', free: true },
        { id: 'r6', title: 'React Course - Prawito Hudoro', type: 'video', url: 'https://www.youtube.com/c/prawitohudoro', free: true },
      ]),
      node('fe-4', 'State Management', 'Redux, Zustand, atau Context API', 'intermediate', 25, ['fe-3'], [
        { id: 'r7', title: 'Redux Toolkit Tutorial', type: 'video', url: '#', free: true },
      ]),
      node('fe-5', 'Next.js & SSR', 'Framework React dengan Server-Side Rendering', 'advanced', 35, ['fe-3'], [
        { id: 'r8', title: 'Next.js Dokumentasi', type: 'article', url: 'https://nextjs.org', free: true },
      ]),
    ],
    backend: [
      node('be-1', 'Node.js Dasar', 'Runtime JavaScript untuk server', 'beginner', 30, [], [
        { id: 'r9', title: 'Node.js Indonesia', type: 'video', url: '#', free: true },
      ]),
      node('be-2', 'Express.js', 'Framework web minimalis', 'beginner', 25, ['be-1'], [
        { id: 'r10', title: 'Express Tutorial', type: 'article', url: 'https://expressjs.com', free: true },
      ]),
      node('be-3', 'Database SQL', 'MySQL, PostgreSQL fundamentals', 'intermediate', 35, ['be-2'], [
        { id: 'r11', title: 'SQL Dasar - Sekolah Koding', type: 'video', url: '#', free: true },
      ]),
      node('be-4', 'Database NoSQL', 'MongoDB dan Redis', 'intermediate', 30, ['be-2'], [
        { id: 'r12', title: 'MongoDB University', type: 'course', url: 'https://university.mongodb.com', free: true },
      ]),
      node('be-5', 'API Design & REST', 'Best practices API development', 'intermediate', 20, ['be-3'], [
        { id: 'r13', title: 'REST API Design', type: 'article', url: '#', free: true },
      ]),
    ],
    devops: [
      node('do-1', 'Linux Fundamentals', 'Command line dan sistem operasi Linux', 'beginner', 25, [], [
        { id: 'r14', title: 'Linux Dasar - Indonesia Belajar', type: 'video', url: '#', free: true },
      ]),
      node('do-2', 'Git & Version Control', 'Source code management', 'beginner', 15, [], [
        { id: 'r15', title: 'Git Tutorial - Petani Kode', type: 'video', url: '#', free: true },
      ]),
      node('do-3', 'Docker', 'Containerization untuk aplikasi', 'intermediate', 30, ['do-1'], [
        { id: 'r16', title: 'Docker untuk Pemula', type: 'video', url: '#', free: true },
      ]),
      node('do-4', 'CI/CD Pipeline', 'Continuous Integration/Deployment', 'intermediate', 25, ['do-3'], [
        { id: 'r17', title: 'GitHub Actions', type: 'article', url: 'https://github.com/features/actions', free: true },
      ]),
      node('do-5', 'AWS/Cloud Basics', 'Cloud computing fundamentals', 'advanced', 40, ['do-3'], [
        { id: 'r18', title: 'AWS Free Tier', type: 'course', url: 'https://aws.amazon.com', free: true },
      ]),
    ],
    data: [
      node('ds-1', 'Python Dasar', 'Bahasa pemrograman untuk data science', 'beginner', 30, [], [
        { id: 'r19', title: 'Python - Indonesia Belajar', type: 'video', url: '#', free: true },
      ]),
      node('ds-2', 'Pandas & NumPy', 'Library untuk manipulasi data', 'beginner', 25, ['ds-1'], [
        { id: 'r20', title: 'Pandas Documentation', type: 'article', url: 'https://pandas.pydata.org', free: true },
      ]),
      node('ds-3', 'Data Visualization', 'Matplotlib, Seaborn, Tableau', 'intermediate', 30, ['ds-2'], [
        { id: 'r21', title: 'Tableau Public', type: 'course', url: 'https://public.tableau.com', free: true },
      ]),
      node('ds-4', 'Machine Learning Dasar', 'Konsep ML dan algoritma', 'intermediate', 50, ['ds-3'], [
        { id: 'r22', title: 'ML Course - Andrew Ng', type: 'course', url: 'https://coursera.org', free: false },
      ]),
    ],
    design: [
      node('ux-1', 'Design Principles', 'Prinsip dasar desain visual', 'beginner', 20, [], [
        { id: 'r23', title: 'Design Fundamentals', type: 'article', url: '#', free: true },
      ]),
      node('ux-2', 'Figma Mastery', 'Tool desain UI/UX utama', 'beginner', 30, [], [
        { id: 'r24', title: 'Figma Tutorial Indonesia', type: 'video', url: '#', free: true },
      ]),
      node('ux-3', 'User Research', 'Metode riset pengguna', 'intermediate', 25, ['ux-1'], [
        { id: 'r25', title: 'UX Research Methods', type: 'article', url: '#', free: true },
      ]),
      node('ux-4', 'Prototyping', 'Membuat prototype interaktif', 'intermediate', 20, ['ux-2'], [
        { id: 'r26', title: 'Prototyping in Figma', type: 'video', url: '#', free: true },
      ]),
    ],
    mobile: [
      node('mob-1', 'Dart & Flutter', 'Framework cross-platform', 'beginner', 40, [], [
        { id: 'r27', title: 'Flutter Indonesia', type: 'video', url: '#', free: true },
      ]),
      node('mob-2', 'React Native', 'Mobile apps dengan React', 'intermediate', 45, [], [
        { id: 'r28', title: 'React Native Docs', type: 'article', url: 'https://reactnative.dev', free: true },
      ]),
      node('mob-3', 'Mobile UI Patterns', 'Desain pattern untuk mobile', 'intermediate', 20, ['mob-1'], [
        { id: 'r29', title: 'Mobile Design Patterns', type: 'article', url: '#', free: true },
      ]),
    ],
    'digital-marketing': [
      node('dm-1', 'Digital Marketing Fundamentals', 'Konsep dasar pemasaran digital', 'beginner', 20, [], [
        { id: 'r30', title: 'Digital Marketing 101', type: 'course', url: '#', free: true },
      ]),
      node('dm-2', 'SEO (Search Engine Optimization)', 'Optimasi mesin pencari', 'intermediate', 35, ['dm-1'], [
        { id: 'r31', title: 'SEO Starter Guide - Google', type: 'article', url: '#', free: true },
      ]),
      node('dm-3', 'Google Ads', 'Pemasaran berbayar di Google', 'intermediate', 25, ['dm-1'], [
        { id: 'r32', title: 'Google Ads Certification', type: 'course', url: '#', free: true },
      ]),
      node('dm-4', 'Social Media Marketing', 'Strategi media sosial', 'beginner', 20, ['dm-1'], [
        { id: 'r33', title: 'Social Media Strategy', type: 'video', url: '#', free: true },
      ]),
      node('dm-5', 'Content Marketing', 'Strategi konten untuk bisnis', 'intermediate', 30, ['dm-4'], [
        { id: 'r34', title: 'Content Marketing Guide', type: 'article', url: '#', free: true },
      ]),
    ],
    'content-writing': [
      node('cw-1', 'Writing Fundamentals', 'Dasar-dasar penulisan', 'beginner', 15, [], [
        { id: 'r35', title: 'Writing Basics', type: 'article', url: '#', free: true },
      ]),
      node('cw-2', 'Copywriting', 'Menulis untuk penjualan', 'intermediate', 25, ['cw-1'], [
        { id: 'r36', title: 'Copywriting Mastery', type: 'course', url: '#', free: true },
      ]),
      node('cw-3', 'SEO Writing', 'Menulis untuk search engine', 'intermediate', 20, ['cw-1'], [
        { id: 'r37', title: 'SEO Writing Guide', type: 'article', url: '#', free: true },
      ]),
    ],
    accounting: [
      node('acc-1', 'Akuntansi Dasar', 'Prinsip akuntansi fundamental', 'beginner', 30, [], [
        { id: 'r38', title: 'Akuntansi untuk Pemula', type: 'video', url: '#', free: true },
      ]),
      node('acc-2', 'Excel untuk Akuntansi', 'Spreadsheet untuk keuangan', 'beginner', 25, [], [
        { id: 'r39', title: 'Excel Financial Functions', type: 'course', url: '#', free: true },
      ]),
      node('acc-3', 'Perpajakan Indonesia', 'Sistem pajak di Indonesia', 'intermediate', 40, ['acc-1'], [
        { id: 'r40', title: 'Pajak untuk Pemula', type: 'video', url: '#', free: true },
      ]),
      node('acc-4', 'Financial Analysis', 'Analisis laporan keuangan', 'advanced', 35, ['acc-1', 'acc-2'], [
        { id: 'r41', title: 'Financial Analysis Guide', type: 'article', url: '#', free: true },
      ]),
    ],
    hr: [
      node('hr-1', 'HR Fundamentals', 'Dasar-dasar human resources', 'beginner', 20, [], [
        { id: 'r42', title: 'HR 101', type: 'article', url: '#', free: true },
      ]),
      node('hr-2', 'Recruitment', 'Proses rekrutmen karyawan', 'intermediate', 25, ['hr-1'], [
        { id: 'r43', title: 'Effective Hiring', type: 'video', url: '#', free: true },
      ]),
      node('hr-3', 'Payroll & BPJS', 'Penggajian dan jaminan sosial', 'intermediate', 30, ['hr-1'], [
        { id: 'r44', title: 'Payroll Indonesia Guide', type: 'article', url: '#', free: true },
      ]),
      node('hr-4', 'Employee Relations', 'Hubungan industrial', 'advanced', 25, ['hr-2'], [
        { id: 'r45', title: 'Hukum Ketenagakerjaan', type: 'course', url: '#', free: true },
      ]),
    ],
    'project-management': [
      node('pm-1', 'PM Fundamentals', 'Dasar manajemen proyek', 'beginner', 20, [], [
        { id: 'r46', title: 'Project Management Basics', type: 'article', url: '#', free: true },
      ]),
      node('pm-2', 'Agile & Scrum', 'Metodologi agile', 'intermediate', 25, ['pm-1'], [
        { id: 'r47', title: 'Scrum Guide', type: 'article', url: '#', free: true },
      ]),
      node('pm-3', 'Tools: Jira & Trello', 'Project management tools', 'beginner', 15, ['pm-1'], [
        { id: 'r48', title: 'Jira Tutorial', type: 'video', url: '#', free: true },
      ]),
    ],
    sales: [
      node('sale-1', 'Sales Fundamentals', 'Dasar-dasar penjualan', 'beginner', 20, [], [
        { id: 'r49', title: 'Sales 101', type: 'article', url: '#', free: true },
      ]),
      node('sale-2', 'Negotiation Skills', 'Teknik negosiasi', 'intermediate', 25, ['sale-1'], [
        { id: 'r50', title: 'Art of Negotiation', type: 'video', url: '#', free: true },
      ]),
      node('sale-3', 'CRM Management', 'Customer relationship management', 'intermediate', 20, ['sale-1'], [
        { id: 'r51', title: 'Salesforce Basics', type: 'course', url: '#', free: true },
      ]),
    ],
    'customer-service': [
      node('cs-1', 'Customer Service Basics', 'Layanan pelanggan fundamental', 'beginner', 15, [], [
        { id: 'r52', title: 'CS Fundamentals', type: 'article', url: '#', free: true },
      ]),
      node('cs-2', 'Communication Skills', 'Komunikasi efektif', 'beginner', 20, ['cs-1'], [
        { id: 'r53', title: 'Effective Communication', type: 'video', url: '#', free: true },
      ]),
      node('cs-3', 'Conflict Resolution', 'Menangani keluhan', 'intermediate', 20, ['cs-2'], [
        { id: 'r54', title: 'Handling Complaints', type: 'course', url: '#', free: true },
      ]),
    ],
    'graphic-design': [
      node('gd-1', 'Design Theory', 'Teori desain grafis', 'beginner', 20, [], [
        { id: 'r55', title: 'Design Principles', type: 'article', url: '#', free: true },
      ]),
      node('gd-2', 'Adobe Photoshop', 'Editing gambar profesional', 'beginner', 35, [], [
        { id: 'r56', title: 'Photoshop Tutorial ID', type: 'video', url: '#', free: true },
      ]),
      node('gd-3', 'Adobe Illustrator', 'Desain vektor', 'intermediate', 40, ['gd-2'], [
        { id: 'r57', title: 'Illustrator Mastery', type: 'course', url: '#', free: true },
      ]),
      node('gd-4', 'Branding', 'Desain identitas merek', 'advanced', 30, ['gd-3'], [
        { id: 'r58', title: 'Brand Design Guide', type: 'article', url: '#', free: true },
      ]),
    ],
    'video-editing': [
      node('ve-1', 'Video Production Basics', 'Dasar produksi video', 'beginner', 25, [], [
        { id: 'r59', title: 'Video 101', type: 'article', url: '#', free: true },
      ]),
      node('ve-2', 'Adobe Premiere Pro', 'Editing video profesional', 'intermediate', 40, ['ve-1'], [
        { id: 'r60', title: 'Premiere Tutorial', type: 'video', url: '#', free: true },
      ]),
      node('ve-3', 'After Effects', 'Motion graphics', 'advanced', 50, ['ve-2'], [
        { id: 'r61', title: 'After Effects Basics', type: 'course', url: '#', free: true },
      ]),
    ],
  };

  return roadmaps[categoryId] || roadmaps['frontend'];
}

export function SkillRoadmap() {
  const [selectedCategory, setSelectedCategory] = useState('frontend');
  const [selectedNode, setSelectedNode] = useState<SimpleRoadmapNode | null>(null);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());

  const roadmapData = useMemo(() => generateRoadmapNodes(selectedCategory), [selectedCategory]);

  const toggleNodeCompletion = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const calculateProgress = (nodes: SimpleRoadmapNode[]): number => {
    let total = 0;
    let completed = 0;

    const countNodes = (nodeList: SimpleRoadmapNode[]) => {
      nodeList.forEach(node => {
        total++;
        if (completedNodes.has(node.id)) completed++;
        if (node.children) countNodes(node.children);
      });
    };

    countNodes(nodes);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'course': return BookOpen;
      case 'book': return BookOpen;
      case 'practice': return Target;
      default: return ExternalLink;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return difficulty;
    }
  };

  const RoadmapNodeComponent = ({ node, level = 0 }: { node: SimpleRoadmapNode; level?: number }) => {
    const isCompleted = completedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isLocked = node.prerequisites.length > 0 && !node.prerequisites.every(prereq => completedNodes.has(prereq));

    return (
      <div className={cn('relative', level > 0 && 'ml-8 mt-4')}>
        {level > 0 && (
          <div className="absolute -left-6 top-6 w-6 h-px bg-slate-300" />
        )}
        
        <div 
          className={cn(
            'relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
            isCompleted 
              ? 'border-green-500 bg-green-50/50' 
              : isLocked
                ? 'border-slate-200 bg-slate-50 opacity-60'
                : 'border-slate-200 bg-white hover:border-career-300 hover:shadow-md'
          )}
          onClick={() => !isLocked && setSelectedNode(node)}
        >
          <button
            onClick={(e) => !isLocked && toggleNodeCompletion(node.id, e)}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
              isCompleted 
                ? 'bg-green-500 text-white' 
                : isLocked
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-career-100 text-career-600 hover:bg-career-200'
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isLocked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className={cn(
                  'font-semibold text-lg',
                  isCompleted ? 'text-green-700' : 'text-slate-900'
                )}>
                  {node.title}
                </h4>
                <p className="text-slate-600 text-sm mt-1">{node.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs',
                  node.difficulty === 'beginner' && 'bg-green-100 text-green-700',
                  node.difficulty === 'intermediate' && 'bg-amber-100 text-amber-700',
                  node.difficulty === 'advanced' && 'bg-red-100 text-red-700',
                )}
              >
                {getDifficultyLabel(node.difficulty)}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {node.estimatedHours} jam
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <BookOpen className="w-3.5 h-3.5" />
                {node.resources.length} sumber
              </div>
              {hasChildren && (
                <Badge variant="outline" className="text-xs">
                  {node.children?.length} sub-topik
                </Badge>
              )}
            </div>
          </div>
        </div>

        {hasChildren && (
          <div className="relative mt-4">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
            {node.children?.map((child) => (
              <RoadmapNodeComponent key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const progress = calculateProgress(roadmapData);
  const activeCategories = indonesianRoadmapCategories.filter(c => c.isActive);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-career-500 to-career-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Roadmap Skill</h1>
        </div>
        <p className="text-slate-600">Jalur pembelajaran terstruktur untuk menguasai skill yang diminati</p>
      </div>

      {/* Category Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-3 mb-8">
        {activeCategories.map((category) => {
          const Icon = iconMap[category.icon] || Code;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                selectedCategory === category.id
                  ? 'border-career-500 bg-career-50'
                  : 'border-slate-200 bg-white hover:border-career-200 hover:bg-slate-50'
              )}
              title={category.description}
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                category.color,
                selectedCategory === category.id && 'ring-4 ring-career-200'
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className={cn(
                'text-xs font-medium text-center leading-tight',
                selectedCategory === category.id ? 'text-career-700' : 'text-slate-700'
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Roadmap */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {indonesianRoadmapCategories.find(c => c.id === selectedCategory)?.name}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Selesaikan setiap topik untuk membuka level berikutnya
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-career-600">{progress}%</div>
                  <div className="text-xs text-slate-500">Selesai</div>
                </div>
              </div>
              <Progress value={progress} className="mt-4 h-2" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {roadmapData.map((node) => (
                  <RoadmapNodeComponent key={node.id} node={node} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Stats */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Progres Anda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-career-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-career-600" />
                    <span className="text-sm font-medium text-slate-700">Topik Selesai</span>
                  </div>
                  <span className="font-bold text-career-700">
                    {completedNodes.size}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-slate-700">Jam Belajar</span>
                  </div>
                  <span className="font-bold text-green-700">
                    {completedNodes.size * 15}+
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-slate-700">Streak Saat Ini</span>
                  </div>
                  <span className="font-bold text-amber-700">5 hari</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Resources */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">Sumber Belajar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roadmapData[0]?.resources.slice(0, 3).map((resource) => {
                  const Icon = getResourceIcon(resource.type);
                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-career-300 hover:bg-career-50 transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-career-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-career-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{resource.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{resource.type}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-slate-200 bg-gradient-to-br from-career-50 to-career-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-career-500 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-career-900">Tips Belajar</h4>
                  <ul className="text-sm text-career-700 mt-2 space-y-1">
                    <li>• Belajar secara konsisten setiap hari</li>
                    <li>• Praktikkan dengan membuat proyek</li>
                    <li>• Bergabung dengan komunitas</li>
                    <li>• Dokumentasikan progres Anda</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Detail Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedNode && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    completedNodes.has(selectedNode.id) ? 'bg-green-500' : 'bg-career-500'
                  )}>
                    {completedNodes.has(selectedNode.id) ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedNode.title}</DialogTitle>
                    <p className="text-sm text-slate-500">{selectedNode.description}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      selectedNode.difficulty === 'beginner' && 'bg-green-100 text-green-700',
                      selectedNode.difficulty === 'intermediate' && 'bg-amber-100 text-amber-700',
                      selectedNode.difficulty === 'advanced' && 'bg-red-100 text-red-700',
                    )}
                  >
                    {getDifficultyLabel(selectedNode.difficulty)}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedNode.estimatedHours} jam
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Sumber Belajar</h4>
                  <div className="space-y-3">
                    {selectedNode.resources.map((resource) => {
                      const Icon = getResourceIcon(resource.type);
                      return (
                        <a
                          key={resource.id}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-career-300 hover:bg-career-50 transition-all duration-200"
                        >
                          <div className="w-12 h-12 rounded-xl bg-career-100 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-career-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{resource.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {resource.type}
                              </Badge>
                              {resource.free && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  Gratis
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="w-5 h-5 text-slate-400" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {selectedNode.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3">Prasyarat</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNode.prerequisites.map((prereq) => (
                        <Badge 
                          key={prereq} 
                          variant="secondary"
                          className={cn(
                            completedNodes.has(prereq) && 'bg-green-100 text-green-700'
                          )}
                        >
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    className={cn(
                      'w-full',
                      completedNodes.has(selectedNode.id)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-career-600 hover:bg-career-700'
                    )}
                    onClick={(e) => toggleNodeCompletion(selectedNode.id, e)}
                  >
                    {completedNodes.has(selectedNode.id) ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Tandai Belum Selesai
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Tandai Selesai
                      </>
                    )}
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
