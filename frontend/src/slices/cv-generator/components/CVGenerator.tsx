import { useState, useRef, useCallback, useEffect } from 'react';
import {
  User, Briefcase, GraduationCap, Award, Folder,
  Plus, Trash2, Download, Eye, Sparkles,
  ChevronDown, ChevronUp, FileText, Save, GripVertical, Camera
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import type { CVData, Education, Experience, Skill, Certification, Project } from '../types';
import { useCV } from '../hooks/useCV';
import { MagneticTabs, SwipeToDelete, useDragReorder } from '@/shared/components/MicroInteractions';
import { DocChecklistInline } from './DocChecklistInline';
import { CVScoreBadge } from './CVScoreBadge';
import { InlineAISuggestChip } from './InlineAISuggestChip';
import { subscribe } from '@/shared/lib/aiActionBus';
import { toast } from 'sonner';

const initialCVData: CVData = {
  profile: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    targetIndustry: '',
    experienceLevel: 'fresh-graduate',
  },
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  projects: [],
};

type CVFormat = 'national' | 'international';

export function CVGenerator() {
  const { cvData: remoteCVData, saveCV, isLoading: isCVLoading } = useCV();
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [format, setFormat] = useState<CVFormat>('national');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('personal');
  const cvPreviewRef = useRef<HTMLDivElement>(null);

  const setExperienceList = useCallback((next: Experience[]) => {
    setCvData(prev => ({ ...prev, experience: next }));
  }, []);
  const setSkillsList = useCallback((next: Skill[]) => {
    setCvData(prev => ({ ...prev, skills: next }));
  }, []);
  const expDrag = useDragReorder<Experience>(cvData.experience, setExperienceList);
  const skillDrag = useDragReorder<Skill>(cvData.skills, setSkillsList);

  // Load data from Convex
  useEffect(() => {
    if (remoteCVData && !isDataLoaded) {
      setCvData(remoteCVData);
      setIsDataLoaded(true);
    }
  }, [remoteCVData, isDataLoaded]);

  // Subscribe to AI agent actions
  useEffect(() => {
    const unsubFill = subscribe('cv.fillExperience', (action) => {
      if (action.type !== 'cv.fillExperience') return;
      const newExp: Experience = {
        id: Date.now().toString(),
        company: action.payload.company,
        position: action.payload.position,
        startDate: action.payload.startDate ?? '',
        endDate: action.payload.endDate ?? '',
        description: action.payload.description,
        achievements: [],
      };
      setCvData(prev => ({ ...prev, experience: [newExp, ...prev.experience] }));
      setActiveSection('experience');
    });
    const unsubSummary = subscribe('cv.improveSummary', (action) => {
      if (action.type !== 'cv.improveSummary') return;
      setCvData(prev => ({
        ...prev,
        profile: { ...prev.profile, summary: action.payload.summary },
      }));
    });
    const unsubSkills = subscribe('cv.addSkills', (action) => {
      if (action.type !== 'cv.addSkills') return;
      const additions: Skill[] = action.payload.skills.map((s, i) => ({
        id: `${Date.now()}-${i}`,
        name: s.name,
        category: s.category,
        proficiency: 3,
      }));
      setCvData(prev => ({ ...prev, skills: [...prev.skills, ...additions] }));
    });
    const unsubFormat = subscribe('cv.setFormat', (action) => {
      if (action.type !== 'cv.setFormat') return;
      setFormat(action.payload.format);
    });
    return () => {
      unsubFill();
      unsubSummary();
      unsubSkills();
      unsubFormat();
    };
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };

  const aiSuggestSummary = () => {
    setCvData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        summary:
          prev.profile.summary ||
          'Profesional muda dengan etos kerja kuat, fokus pada problem solving dan kolaborasi tim. Berorientasi pada dampak terukur dan pengembangan diri berkelanjutan.',
      },
    }));
    toast.success('Saran AI diterapkan ke ringkasan');
  };

  const aiSuggestExperienceDesc = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(e =>
        e.id === id
          ? {
              ...e,
              description:
                e.description ||
                'Memimpin inisiatif end-to-end yang menghasilkan peningkatan efisiensi 30%. Berkolaborasi lintas tim untuk mendelivery fitur tepat waktu dengan kualitas tinggi.',
            }
          : e,
      ),
    }));
    toast.success('Saran AI diterapkan');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCV(cvData);
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = useCallback((field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  }, []);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
    };
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  }, []);

  const removeEducation = (id: string) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      achievements: [],
    };
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const updateExperience = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  }, []);

  const removeExperience = (id: string) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      category: 'technical',
      proficiency: 3,
    };
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const updateSkill = useCallback((id: string, field: string, value: string | number) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }));
  }, []);

  const removeSkill = (id: string) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
    };
    setCvData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert]
    }));
  };

  const updateCertification = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert =>
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  }, []);

  const removeCertification = (id: string) => {
    setCvData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
    };
    setCvData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const updateProject = useCallback((id: string, field: string, value: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.map(proj =>
        proj.id === id ? { ...proj, [field]: value } : proj
      )
    }));
  }, []);

  const removeProject = (id: string) => {
    setCvData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }));
  };

  const downloadCV = () => {
    alert('Fitur download CV akan menghasilkan PDF di sini!');
  };

  const SectionCard = ({
    title,
    icon: Icon,
    children,
    sectionId,
    onAdd,
    addLabel
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    sectionId: string;
    onAdd?: () => void;
    addLabel?: string;
  }) => {
    const isOpen = activeSection === sectionId;

    const handleHeaderClick = useCallback((e: React.MouseEvent) => {
      // Prevent toggling if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
        return;
      }
      setActiveSection(isOpen ? null : sectionId);
    }, [isOpen, sectionId]);

    return (
      <Card className="border-slate-200 overflow-hidden">
        <CardHeader
          className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
          onClick={handleHeaderClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-career-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-career-600" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {onAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  className="text-career-600 hover:text-career-700 hover:bg-career-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {addLabel}
                </Button>
              )}
              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="pt-6">
            {children}
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pembuat CV</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format === 'national'
              ? 'Format Indonesia · dengan foto, data lengkap'
              : 'Format Internasional · ATS-friendly, no photo, 1 halaman'}
          </p>
        </div>
        <MagneticTabs<CVFormat>
          value={format}
          onChange={setFormat}
          tabs={[
            { id: 'national', label: 'Nasional' },
            { id: 'international', label: 'Internasional' },
          ]}
        />
      </div>

      <div className="mb-6">
        <DocChecklistInline format={format} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {isCVLoading && (
          <div className="lg:col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-career-600"></div>
          </div>
        )}

        {/* Form Section */}
        {!isCVLoading && (
          <>
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="border-slate-200 overflow-hidden">
                <CardHeader className="bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-career-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-career-600" />
                    </div>
                    <CardTitle className="text-lg">Informasi Pribadi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {format === 'national' && (
                    <div className="mb-4 flex items-center gap-4">
                      <div className="relative w-20 h-24 rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/40 flex items-center justify-center">
                        {photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoUrl} alt="Foto CV" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="cv-photo" className="text-sm">Foto Formal</Label>
                        <p className="text-xs text-muted-foreground mb-2">Wajib untuk format Nasional. Resolusi 4×6.</p>
                        <Input
                          id="cv-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-name">Nama Lengkap</Label>
                      <Input
                        id="profile-name"
                        placeholder="Budi Santoso"
                        value={cvData.profile.name}
                        onChange={(e) => updateProfile('name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-email">Email</Label>
                      <Input
                        id="profile-email"
                        type="email"
                        placeholder="budi@email.com"
                        value={cvData.profile.email}
                        onChange={(e) => updateProfile('email', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-phone">Nomor Telepon</Label>
                      <Input
                        id="profile-phone"
                        placeholder="+62 812 3456 7890"
                        value={cvData.profile.phone}
                        onChange={(e) => updateProfile('phone', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-location">Lokasi</Label>
                      <Input
                        id="profile-location"
                        placeholder="Jakarta, Indonesia"
                        value={cvData.profile.location}
                        onChange={(e) => updateProfile('location', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-linkedin">LinkedIn</Label>
                      <Input
                        id="profile-linkedin"
                        placeholder="linkedin.com/in/budisantoso"
                        value={cvData.profile.linkedin}
                        onChange={(e) => updateProfile('linkedin', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile-portfolio">Portfolio/Website</Label>
                      <Input
                        id="profile-portfolio"
                        placeholder="budisantoso.com"
                        value={cvData.profile.portfolio}
                        onChange={(e) => updateProfile('portfolio', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="profile-summary">Ringkasan Profesional</Label>
                        <InlineAISuggestChip label="Saran AI" onClick={aiSuggestSummary} />
                      </div>
                      <Textarea
                        id="profile-summary"
                        placeholder="Tulis ringkasan singkat tentang latar belakang profesional dan tujuan karir Anda..."
                        value={cvData.profile.summary}
                        onChange={(e) => updateProfile('summary', e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Experience */}
              <SectionCard
                title="Pengalaman Kerja"
                icon={Briefcase}
                sectionId="experience"
                onAdd={addExperience}
                addLabel="Tambah Pekerjaan"
              >
                <div className="space-y-3">
                  {cvData.experience.map((exp, idx) => (
                    <SwipeToDelete key={exp.id} onDelete={() => removeExperience(exp.id)}>
                      <div
                        draggable
                        onDragStart={expDrag.onDragStart(exp.id)}
                        onDragOver={expDrag.onDragOver(exp.id)}
                        onDragEnd={expDrag.onDragEnd}
                        className="p-4 border border-border rounded-lg bg-muted/40"
                      >
                        <div className="flex justify-between items-start mb-4 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Drag handle">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <h4 className="font-medium text-foreground truncate">Pengalaman #{idx + 1}</h4>
                          </div>
                          <div className="flex items-center gap-1">
                            <InlineAISuggestChip label="AI" onClick={() => aiSuggestExperienceDesc(exp.id)} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExperience(exp.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Perusahaan</Label>
                            <Input
                              placeholder="Nama Perusahaan"
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Jabatan</Label>
                            <Input
                              placeholder="Posisi Pekerjaan"
                              value={exp.position}
                              onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Mulai</Label>
                            <Input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tanggal Selesai</Label>
                            <Input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-2">
                            <Label>Deskripsi</Label>
                            <Textarea
                              placeholder="Jelaskan tanggung jawab dan pencapaian Anda..."
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </SwipeToDelete>
                  ))}
                  {cvData.experience.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Belum ada pengalaman. Klik &quot;Tambah Pekerjaan&quot; untuk memulai. <span className="text-xs italic">(Tip: swipe kiri untuk hapus, drag untuk urutkan)</span></p>
                  )}
                </div>
              </SectionCard>

              {/* Education */}
              <SectionCard
                title="Pendidikan"
                icon={GraduationCap}
                sectionId="education"
                onAdd={addEducation}
                addLabel="Tambah Pendidikan"
              >
                <div className="space-y-6">
                  {cvData.education.map((edu, idx) => (
                    <div key={edu.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-slate-900">Pendidikan #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Institusi</Label>
                          <Input
                            placeholder="Nama Universitas/Sekolah"
                            value={edu.institution}
                            onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gelar</Label>
                          <Input
                            placeholder="S1, S2, D3, dll"
                            value={edu.degree}
                            onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bidang Studi</Label>
                          <Input
                            placeholder="Teknik Informatika"
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>IPK (Opsional)</Label>
                          <Input
                            placeholder="3.5/4.0"
                            value={edu.gpa || ''}
                            onChange={(e) => updateEducation(edu.id, 'gpa', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Mulai</Label>
                          <Input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Selesai</Label>
                          <Input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cvData.education.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada pendidikan. Klik &quot;Tambah Pendidikan&quot; untuk memulai.</p>
                  )}
                </div>
              </SectionCard>

              {/* Skills */}
              <SectionCard
                title="Skill"
                icon={Sparkles}
                sectionId="skills"
                onAdd={addSkill}
                addLabel="Tambah Skill"
              >
                <div className="space-y-3">
                  {cvData.skills.map((skill) => (
                    <div
                      key={skill.id}
                      draggable
                      onDragStart={skillDrag.onDragStart(skill.id)}
                      onDragOver={skillDrag.onDragOver(skill.id)}
                      onDragEnd={skillDrag.onDragEnd}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/40"
                    >
                      <span className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Drag handle">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <div className="flex-1 grid sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="Nama skill (contoh: JavaScript)"
                          value={skill.name}
                          onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                        />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={skill.category}
                          onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                        >
                          <option value="technical">Teknis</option>
                          <option value="soft">Soft Skill</option>
                          <option value="language">Bahasa</option>
                          <option value="tool">Tool</option>
                        </select>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={skill.proficiency}
                          onChange={(e) => updateSkill(skill.id, 'proficiency', parseInt(e.target.value))}
                        >
                          <option value={1}>Pemula</option>
                          <option value={2}>Dasar</option>
                          <option value={3}>Menengah</option>
                          <option value={4}>Mahir</option>
                          <option value={5}>Ahli</option>
                        </select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(skill.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cvData.skills.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada skill. Klik &quot;Tambah Skill&quot; untuk memulai.</p>
                  )}
                </div>
              </SectionCard>

              {/* Certifications */}
              <SectionCard
                title="Sertifikasi"
                icon={Award}
                sectionId="certifications"
                onAdd={addCertification}
                addLabel="Tambah Sertifikasi"
              >
                <div className="space-y-4">
                  {cvData.certifications.map((cert, idx) => (
                    <div key={cert.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-slate-900">Sertifikasi #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(cert.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nama Sertifikasi</Label>
                          <Input
                            placeholder="AWS Certified Developer"
                            value={cert.name}
                            onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Organisasi Penerbit</Label>
                          <Input
                            placeholder="Amazon Web Services"
                            value={cert.issuer}
                            onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Diperoleh</Label>
                          <Input
                            type="month"
                            value={cert.date}
                            onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Kadaluarsa (Opsional)</Label>
                          <Input
                            type="month"
                            value={cert.expiryDate || ''}
                            onChange={(e) => updateCertification(cert.id, 'expiryDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cvData.certifications.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada sertifikasi. Klik &quot;Tambah Sertifikasi&quot; untuk memulai.</p>
                  )}
                </div>
              </SectionCard>

              {/* Projects */}
              <SectionCard
                title="Proyek"
                icon={Folder}
                sectionId="projects"
                onAdd={addProject}
                addLabel="Tambah Proyek"
              >
                <div className="space-y-4">
                  {cvData.projects.map((proj, idx) => (
                    <div key={proj.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-slate-900">Proyek #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(proj.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nama Proyek</Label>
                          <Input
                            placeholder="Website E-commerce"
                            value={proj.name}
                            onChange={(e) => updateProject(proj.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Deskripsi</Label>
                          <Textarea
                            placeholder="Jelaskan proyek Anda, peran Anda, dan teknologi yang digunakan..."
                            value={proj.description}
                            onChange={(e) => updateProject(proj.id, 'description', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Link Proyek (Opsional)</Label>
                          <Input
                            placeholder="https://github.com/username/project"
                            value={proj.link || ''}
                            onChange={(e) => updateProject(proj.id, 'link', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cvData.projects.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Belum ada proyek. Klik &quot;Tambah Proyek&quot; untuk memulai.</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Preview & Actions Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-career-600" />
                      Pratinjau CV
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Kelengkapan</span>
                          <span className="text-sm font-semibold text-career-600">
                            {Math.round(
                              (Object.values(cvData.profile).filter(v => v && v !== '').length / Object.keys(cvData.profile).length) * 100
                            )}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-career-500 to-career-600 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                (Object.values(cvData.profile).filter(v => v && v !== '').length / Object.keys(cvData.profile).length) * 100
                              )}%`
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Info Pribadi</span>
                          {cvData.profile.name ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Lengkap</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Belum Lengkap</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Pengalaman</span>
                          <Badge variant="secondary" className="bg-slate-100">
                            {cvData.experience.length} item
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Pendidikan</span>
                          <Badge variant="secondary" className="bg-slate-100">
                            {cvData.education.length} item
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Skill</span>
                          <Badge variant="secondary" className="bg-slate-100">
                            {cvData.skills.length} item
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Button
                          className="w-full bg-career-600 hover:bg-career-700"
                          onClick={() => setPreviewOpen(true)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat CV
                        </Button>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Menyimpan...' : 'Simpan CV'}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={downloadCV}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CVScoreBadge cvData={cvData} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pratinjau CV</DialogTitle>
          </DialogHeader>
          <div ref={cvPreviewRef} className={`bg-white text-slate-900 p-8 border border-slate-200 rounded-lg ${format === 'international' ? 'font-sans text-[14px] leading-snug' : ''}`}>
            <div className="mb-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                Format: {format === 'national' ? 'Nasional (Indonesia)' : 'Internasional (ATS)'}
              </Badge>
            </div>
            {/* CV Preview Content */}
            <div className={format === 'international' ? 'space-y-3' : 'space-y-6'}>
              {/* Header */}
              {format === 'international' ? (
                <div className="border-b border-slate-300 pb-3">
                  <h2 className="text-2xl font-bold uppercase tracking-wide">{cvData.profile.name || 'YOUR NAME'}</h2>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-700">
                    {cvData.profile.email && <span>{cvData.profile.email}</span>}
                    {cvData.profile.phone && <span>· {cvData.profile.phone}</span>}
                    {cvData.profile.location && <span>· {cvData.profile.location}</span>}
                    {cvData.profile.linkedin && <span>· {cvData.profile.linkedin}</span>}
                  </div>
                  {cvData.profile.summary && (
                    <p className="text-sm mt-2 text-slate-700">{cvData.profile.summary}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-6 border-b border-slate-200 pb-6">
                  {photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Foto" className="w-24 h-32 object-cover rounded border border-slate-300" />
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-slate-900">{cvData.profile.name || 'Nama Anda'}</h2>
                    <p className="text-slate-600 mt-2">{cvData.profile.summary || 'Ringkasan Profesional'}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                      {cvData.profile.email && <span>{cvData.profile.email}</span>}
                      {cvData.profile.phone && <span>{cvData.profile.phone}</span>}
                      {cvData.profile.location && <span>{cvData.profile.location}</span>}
                      {cvData.profile.linkedin && <span>{cvData.profile.linkedin}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Experience */}
              {cvData.experience.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Pengalaman Kerja</h3>
                  <div className="space-y-4">
                    {cvData.experience.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{exp.position}</h4>
                            <p className="text-slate-600">{exp.company}</p>
                          </div>
                          <span className="text-sm text-slate-500">
                            {exp.startDate} - {exp.endDate || 'Sekarang'}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-2 text-sm">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {cvData.education.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Pendidikan</h3>
                  <div className="space-y-4">
                    {cvData.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900">{edu.degree} - {edu.fieldOfStudy}</h4>
                            <p className="text-slate-600">{edu.institution}</p>
                          </div>
                          <span className="text-sm text-slate-500">
                            {edu.startDate} - {edu.endDate}
                          </span>
                        </div>
                        {edu.gpa && <p className="text-slate-600 mt-1 text-sm">IPK: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {cvData.skills.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Skill</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="bg-slate-100">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {cvData.certifications.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Sertifikasi</h3>
                  <div className="space-y-2">
                    {cvData.certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between">
                        <span className="font-medium">{cert.name}</span>
                        <span className="text-slate-500 text-sm">{cert.issuer} • {cert.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {cvData.projects.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Proyek</h3>
                  <div className="space-y-4">
                    {cvData.projects.map((proj) => (
                      <div key={proj.id}>
                        <h4 className="font-semibold text-slate-900">{proj.name}</h4>
                        <p className="text-slate-600 text-sm mt-1">{proj.description}</p>
                        {proj.link && <p className="text-career-600 text-sm mt-1">{proj.link}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
