"use client";

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
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
} from '@/shared/components/ui/responsive-dialog';
import type { CVData, Education, Experience, Skill, Certification, Project } from '../types';
import { useCV } from '../hooks/useCV';
import { useCVAIActions } from '../hooks/useCVAIActions';
import { initialCVData, type CVFormat } from '../constants';
import { MagneticTabs, SwipeToDelete, useDragReorder } from '@/shared/components/interactions/MicroInteractions';
import { DocChecklistInline } from './DocChecklistInline';
import { CVScoreBadge, computeScore } from './CVScoreBadge';
import { AnimatedProgress } from '@/shared/components/interactions/MicroInteractions';
import { InlineAISuggestChip } from './InlineAISuggestChip';
import { toast } from 'sonner';

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

  // AI agent bus subscriptions — wire di hook terpisah (lihat useCVAIActions)
  useCVAIActions({
    setCVData: setCvData,
    setActiveSection,
    setFormat,
  });

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

  const [isExporting, setIsExporting] = useState(false);
  const exportCVToPDF = async () => {
    const node = cvPreviewRef.current;
    if (!node) {
      if (!previewOpen) {
        setPreviewOpen(true);
        toast.info('Buka pratinjau dulu, lalu ekspor');
      }
      return;
    }
    setIsExporting(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const safeName = (cvData.profile.name || 'cv')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'cv';
      await html2pdf()
        .from(node)
        .set({
          filename: `cv-${safeName}.pdf`,
          margin: 10,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save();
      toast.success('PDF berhasil diunduh');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal ekspor PDF';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = () => {
    if (!previewOpen) {
      setPreviewOpen(true);
      setTimeout(() => {
        void exportCVToPDF();
      }, 50);
      return;
    }
    void exportCVToPDF();
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
      <Card className="border-border overflow-hidden">
        <CardHeader
          className="bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
          onClick={handleHeaderClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand" />
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
                  className="text-brand hover:text-brand hover:bg-brand-muted"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {addLabel}
                </Button>
              )}
              {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
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
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pembuat CV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format === 'national'
            ? 'Format Indonesia · dengan foto, data lengkap'
            : 'Format Internasional · ATS-friendly, no photo, 1 halaman'}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Format CV</CardTitle>
        </CardHeader>
        <CardContent>
          <MagneticTabs<CVFormat>
            value={format}
            onChange={setFormat}
            tabs={[
              { id: 'national', label: 'Nasional' },
              { id: 'international', label: 'Internasional' },
            ]}
          />
        </CardContent>
      </Card>

      <div className="mb-6">
        <DocChecklistInline format={format} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {isCVLoading && (
          <div className="lg:col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        )}

        {/* Form Section */}
        {!isCVLoading && (
          <>
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="border-border overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-muted flex items-center justify-center">
                      <User className="w-5 h-5 text-brand" />
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
                        <input
                          id="cv-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="sr-only"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("cv-photo")?.click()}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {photoUrl ? "Ganti Foto" : "Unggah Foto"}
                        </Button>
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
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <div key={edu.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-foreground">Pendidikan #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <p className="text-center text-muted-foreground py-4">Belum ada pendidikan. Klik &quot;Tambah Pendidikan&quot; untuk memulai.</p>
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {cvData.skills.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Belum ada skill. Klik &quot;Tambah Skill&quot; untuk memulai.</p>
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
                    <div key={cert.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-foreground">Sertifikasi #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(cert.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <p className="text-center text-muted-foreground py-4">Belum ada sertifikasi. Klik &quot;Tambah Sertifikasi&quot; untuk memulai.</p>
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
                    <div key={proj.id} className="p-4 border border-border rounded-lg bg-muted/50/50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-foreground">Proyek #{idx + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProject(proj.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <p className="text-center text-muted-foreground py-4">Belum ada proyek. Klik &quot;Tambah Proyek&quot; untuk memulai.</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Preview & Actions Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-brand" />
                      Pratinjau CV
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/40 rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">Kelengkapan</span>
                          <span className="text-sm font-semibold text-brand">
                            {computeScore(cvData)}%
                          </span>
                        </div>
                        <AnimatedProgress value={computeScore(cvData)} />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Info Pribadi</span>
                          {cvData.profile.name ? (
                            <Badge variant="secondary" className="bg-success/20 text-success">Lengkap</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-warning/20 text-warning">Belum Lengkap</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pengalaman</span>
                          <Badge variant="secondary" className="bg-muted">
                            {cvData.experience.length} item
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pendidikan</span>
                          <Badge variant="secondary" className="bg-muted">
                            {cvData.education.length} item
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Skill</span>
                          <Badge variant="secondary" className="bg-muted">
                            {cvData.skills.length} item
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Button
                          className="w-full bg-brand hover:bg-brand"
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
                          onClick={handleExportClick}
                          disabled={isExporting}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {isExporting ? 'Mengekspor...' : 'Unduh PDF'}
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
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Pratinjau CV</DialogTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportCVToPDF}
                disabled={isExporting}
                className="gap-2 mr-8"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Tekan <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">Ctrl</kbd>+
              <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">P</kbd> untuk print-to-PDF native browser.
            </p>
          </DialogHeader>
          <div ref={cvPreviewRef} className={`bg-card text-foreground p-8 border border-border rounded-lg ${format === 'international' ? 'font-sans text-[14px] leading-snug' : ''}`}>
            <div className="mb-2">
              <Badge variant="secondary" className="bg-muted text-foreground">
                Format: {format === 'national' ? 'Nasional (Indonesia)' : 'Internasional (ATS)'}
              </Badge>
            </div>
            {/* CV Preview Content */}
            <div className={format === 'international' ? 'space-y-3' : 'space-y-6'}>
              {/* Header */}
              {format === 'international' ? (
                <div className="border-b border-border pb-3">
                  <h2 className="text-2xl font-bold uppercase tracking-wide">{cvData.profile.name || 'YOUR NAME'}</h2>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-foreground">
                    {cvData.profile.email && <span>{cvData.profile.email}</span>}
                    {cvData.profile.phone && <span>· {cvData.profile.phone}</span>}
                    {cvData.profile.location && <span>· {cvData.profile.location}</span>}
                    {cvData.profile.linkedin && <span>· {cvData.profile.linkedin}</span>}
                  </div>
                  {cvData.profile.summary && (
                    <p className="text-sm mt-2 text-foreground">{cvData.profile.summary}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-6 border-b border-border pb-6">
                  {photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Foto" className="w-24 h-32 object-cover rounded border border-border" />
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground">{cvData.profile.name || 'Nama Anda'}</h2>
                    <p className="text-muted-foreground mt-2">{cvData.profile.summary || 'Ringkasan Profesional'}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
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
                  <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">Pengalaman Kerja</h3>
                  <div className="space-y-4">
                    {cvData.experience.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-foreground">{exp.position}</h4>
                            <p className="text-muted-foreground">{exp.company}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {exp.startDate} - {exp.endDate || 'Sekarang'}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-2 text-sm">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {cvData.education.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">Pendidikan</h3>
                  <div className="space-y-4">
                    {cvData.education.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-foreground">{edu.degree} - {edu.fieldOfStudy}</h4>
                            <p className="text-muted-foreground">{edu.institution}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {edu.startDate} - {edu.endDate}
                          </span>
                        </div>
                        {edu.gpa && <p className="text-muted-foreground mt-1 text-sm">IPK: {edu.gpa}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {cvData.skills.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">Skill</h3>
                  <div className="flex flex-wrap gap-2">
                    {cvData.skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary" className="bg-muted">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {cvData.certifications.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">Sertifikasi</h3>
                  <div className="space-y-2">
                    {cvData.certifications.map((cert) => (
                      <div key={cert.id} className="flex justify-between">
                        <span className="font-medium">{cert.name}</span>
                        <span className="text-muted-foreground text-sm">{cert.issuer} • {cert.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {cvData.projects.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">Proyek</h3>
                  <div className="space-y-4">
                    {cvData.projects.map((proj) => (
                      <div key={proj.id}>
                        <h4 className="font-semibold text-foreground">{proj.name}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{proj.description}</p>
                        {proj.link && <p className="text-brand text-sm mt-1">{proj.link}</p>}
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
