"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import {
  User, Briefcase, GraduationCap, Award, Folder,
  Plus, Trash2, Download, Eye, Sparkles,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, Save, GripVertical,
  Languages, Undo2
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { QuickFillButton } from '@/shared/components/onboarding';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  ResponsiveDialog as Dialog,
  ResponsiveDialogContent as DialogContent,
  ResponsiveDialogHeader as DialogHeader,
  ResponsiveDialogTitle as DialogTitle,
  ResponsiveDialogDescription as DialogDescription,
} from '@/shared/components/ui/responsive-dialog';
import { FileUpload } from '@/shared/components/files/FileUpload';
import { api } from '../../../../../convex/_generated/api';
import type { CVData, CVTemplateId, Education, Experience, Skill, Certification, Project } from '../types';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useCV } from '../hooks/useCV';
import { useCVAIActions } from '../hooks/useCVAIActions';
import { CV_TEMPLATES, initialCVData, type CVFormat } from '../constants';
import { MagneticTabs, SwipeToDelete, useDragReorder } from '@/shared/components/interactions/MicroInteractions';
import { DocChecklistInline } from './DocChecklistInline';
import { CVScoreBadge, computeScore } from './CVScoreBadge';
import { ScaledCVPreview } from './templates/ScaledCVPreview';
import { ProgressWalker } from '@/shared/components/stats/ProgressWalker';
import { InlineAISuggestChip } from './InlineAISuggestChip';
import { useCVTranslate, TRANSLATE_LANGUAGES, type CVLangCode } from '../hooks/useCVTranslate';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { ResponsiveCarousel } from '@/shared/components/ui/responsive-carousel';
import { cn } from '@/shared/lib/utils';
import { notify } from '@/shared/lib/notify';

export function CVGenerator() {
  const { cvData: remoteCVData, saveCV, isLoading: isCVLoading } = useCV();
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [format, setFormat] = useState<CVFormat>('national');

  // Photo = Convex storage id on cvData.profile.avatarStorageId.
  // URL resolves via api.files.queries.getFileUrl (skip when not set).
  const avatarStorageId = cvData.profile.avatarStorageId;
  const resolvedPhotoUrl = useQuery(
    api.files.queries.getFileUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip",
  );
  const photoUrl = resolvedPhotoUrl ?? '';

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('personal');
  const cvPreviewRef = useRef<HTMLDivElement>(null);

  // Template swipe state — swipeDx tracks drag delta in px, reset on
  // commit/cancel. Threshold intentionally loose (70 px) so a flick
  // counts but an accidental tap never fires.
  const templateIds = CV_TEMPLATES.map((t) => t.id as CVTemplateId);
  const currentTemplateIdx = Math.max(
    0,
    templateIds.indexOf(cvData.displayPrefs.templateId),
  );
  const cycleTemplate = useCallback(
    (dir: 1 | -1) => {
      const next = (currentTemplateIdx + dir + templateIds.length) % templateIds.length;
      setCvData((prev) => ({
        ...prev,
        displayPrefs: { ...prev.displayPrefs, templateId: templateIds[next] },
      }));
    },
    [currentTemplateIdx, templateIds],
  );
  const swipeStartX = useRef<number | null>(null);
  const [swipeDx, setSwipeDx] = useState(0);
  const SWIPE_THRESHOLD = 70;

  const onSwipeStart = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    swipeStartX.current = e.clientX;
    setSwipeDx(0);
  }, []);
  const onSwipeMove = useCallback((e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.clientX - swipeStartX.current;
    // Only hijack horizontal — if the user is vertically scrolling
    // they don't mean to swipe templates.
    setSwipeDx(dx);
  }, []);
  const onSwipeEnd = useCallback(() => {
    if (swipeStartX.current === null) return;
    const dx = swipeDx;
    swipeStartX.current = null;
    setSwipeDx(0);
    if (dx <= -SWIPE_THRESHOLD) cycleTemplate(1);
    else if (dx >= SWIPE_THRESHOLD) cycleTemplate(-1);
  }, [swipeDx, cycleTemplate]);

  // Keyboard shortcuts — ←/→ cycle when dialog is open + focus isn't
  // in a form field. Power-user affordance for desktop.
  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); cycleTemplate(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); cycleTemplate(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewOpen, cycleTemplate]);

  // Translation overlays the captured data without mutating it — the
  // underlying cvData stays Indonesian so the form + saved state are
  // source of truth. Preview + PDF use the translated snapshot when
  // active.
  const {
    translate,
    revert: revertTranslation,
    activeLang,
    translatedCV,
    isTranslating,
  } = useCVTranslate(cvData);
  const renderCV = translatedCV ?? cvData;

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

  const handlePhotoUploaded = (result: { storageId: string }) => {
    setCvData((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatarStorageId: result.storageId },
    }));
    notify.success('Foto CV terunggah');
  };

  const handlePhotoClear = () => {
    setCvData((prev) => ({
      ...prev,
      profile: { ...prev.profile, avatarStorageId: undefined },
    }));
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
    notify.success('Saran AI diterapkan ke ringkasan');
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
    notify.success('Saran AI diterapkan');
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

  const updatePref = useCallback(
    <K extends keyof CVData['displayPrefs']>(key: K, value: CVData['displayPrefs'][K]) => {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: { ...prev.displayPrefs, [key]: value },
      }));
    },
    [],
  );

  // Switching format flips the photo/age/grad-year defaults to match
  // local convention. International = ATS-friendly, no photo/age. The
  // user can still override afterwards.
  const setFormatWithDefaults = useCallback((next: CVFormat) => {
    setFormat(next);
    if (next === 'international') {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: {
          ...prev.displayPrefs,
          showPicture: false,
          showAge: false,
          showGraduationYear: false,
          templateId: prev.displayPrefs.templateId === 'classic' ? 'minimal' : prev.displayPrefs.templateId,
        },
      }));
    } else {
      setCvData((prev) => ({
        ...prev,
        displayPrefs: {
          ...prev.displayPrefs,
          showPicture: true,
          showAge: true,
          showGraduationYear: true,
          templateId: prev.displayPrefs.templateId === 'minimal' ? 'classic' : prev.displayPrefs.templateId,
        },
      }));
    }
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
        notify.info('Buka pratinjau dulu, lalu ekspor');
      }
      return;
    }
    setIsExporting(true);
    try {
      // html2canvas-pro (fork) supports modern CSS color functions —
      // oklch / lab / lch / color(). The original html2canvas that
      // html2pdf.js bundles crashes with "Attempting to parse an
      // unsupported color function 'oklch'" because every shadcn +
      // theme token in the CV preview resolves to oklch() at render.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);

      const safeName =
        (cvData.profile.name || 'cv')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || 'cv';

      // Rendered color shape for the PDF — white background so opacity
      // tokens compose predictably and the canvas isn't transparent.
      // scale=3 → ~288dpi capture, crisp on print without ballooning
      // the file (jpeg at 0.92 keeps it under 1 MB for typical CVs).
      const canvas = await html2canvas(node, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Templates render at exactly A4 width (210 mm) so we map the
      // canvas straight onto the page edge-to-edge — no margin band.
      // Long CVs paginate by sliding the image up by pageH each step.
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      let heightLeft = imgH;
      let y = 0;
      pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
      heightLeft -= pageH;

      // 3 mm threshold — avoids spawning a near-blank page when the
      // captured canvas overshoots A4 by rounding noise (which would
      // show up as a second page with only a sliver of content).
      while (heightLeft > 3) {
        pdf.addPage();
        y = -(imgH - heightLeft);
        pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
        heightLeft -= pageH;
      }

      pdf.save(`cv-${safeName}.pdf`);
      notify.success('PDF berhasil diunduh');
    } catch (err) {
      notify.fromError(err, 'Gagal ekspor PDF');
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
    <PageContainer size="lg">
      {/* Header — mobile-friendly, with compact format toggle inline
          (no Card chrome) + mobile-only "Pratinjau" button so small
          viewports can reach the preview dialog without scrolling to
          the bottom sidebar. Desktop still uses the sticky sidebar. */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pembuat CV</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format === 'national'
              ? 'Format Indonesia · dengan foto, data lengkap'
              : 'Format Internasional · ATS-friendly, no photo, 1 halaman'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <QuickFillButton variant="outline" size="sm" />
          <MagneticTabs<CVFormat>
            value={format}
            onChange={setFormatWithDefaults}
            tabs={[
              { id: 'national', label: 'Nasional' },
              { id: 'international', label: 'Internasional' },
            ]}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              // Blur before opening the preview dialog so Radix's
              // aria-hidden on the page background doesn't trip the
              // "descendant retained focus" a11y warning.
              e.currentTarget.blur();
              setPreviewOpen(true);
            }}
            className="lg:hidden gap-1.5"
            aria-label="Buka pratinjau CV"
          >
            <Eye className="w-4 h-4" />
            Pratinjau
          </Button>
        </div>
      </div>

      {/* gap: tighter on mobile (single-col stack), generous on lg.
          min-w-0 on children is the canonical fix for grid-track
          overflow — lets cards shrink below their intrinsic content
          width so long text wraps instead of horizontally scrolling
          the whole page. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {isCVLoading && (
          <div className="lg:col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        )}

        {/* Form Section */}
        {!isCVLoading && (
          <>
            <div className="min-w-0 lg:col-span-2 space-y-6">
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
                    <div className="mb-4">
                      <Label className="text-sm">Foto Formal</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Wajib untuk format Nasional. Rasio 4:6 direkomendasikan —
                        kami akan memotong otomatis. Dikonversi ke WebP + EXIF dihapus.
                      </p>
                      {avatarStorageId && photoUrl ? (
                        <div className="flex items-start gap-4">
                          <Image
                            src={photoUrl}
                            alt="Foto CV"
                            width={80}
                            height={112}
                            unoptimized
                            className="w-20 h-28 rounded-lg object-cover border-2 border-border"
                          />
                          <div>
                            <p className="text-sm text-muted-foreground">Foto sudah tersimpan.</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-2"
                              onClick={handlePhotoClear}
                            >
                              <Trash2 className="w-4 h-4" />
                              Hapus foto
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <FileUpload
                          label=""
                          accept="image/*"
                          crop={{ aspect: 4 / 6 }}
                          hint="Pilih gambar JPG/PNG/WebP (maks 10 MB). Otomatis dipotong rasio 4:6."
                          onUploaded={handlePhotoUploaded}
                        />
                      )}
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
                    <div className="space-y-2">
                      <Label htmlFor="profile-dob">Tanggal Lahir (opsional)</Label>
                      <Input
                        id="profile-dob"
                        type="date"
                        value={cvData.profile.dateOfBirth || ''}
                        onChange={(e) => updateProfile('dateOfBirth', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Hanya digunakan untuk menghitung usia. Tidak disimpan sebagai tanggal eksplisit di CV.
                      </p>
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

              {/* Tampilan & Template — collapsible like the other
                  SectionCards so the form view isn't a wall of cards.
                  Template name shown in the header as a hint of the
                  current state without expanding. */}
              <SectionCard
                title="Tampilan & Template"
                icon={Sparkles}
                sectionId="display"
              >
                <div className="space-y-5">
                  <div>
                    <Label className="text-sm">Template</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Geser untuk melihat semua · ketuk untuk memilih.
                    </p>
                    {/* Mobile/tablet (<md): swipe carousel with 78%
                        cell width — next template peeks at edge so the
                        swipe affordance is visible. Desktop: 3-col
                        grid with all options shown at once. */}
                    <div className="md:hidden -mx-1">
                      <ResponsiveCarousel
                        cellWidth="w-[78%]"
                        cellClassName="first:pl-1 last:pr-1"
                        hideControls
                      >
                        {CV_TEMPLATES.map((tmpl) => (
                          <TemplatePickerCard
                            key={tmpl.id}
                            tmpl={tmpl}
                            active={cvData.displayPrefs.templateId === tmpl.id}
                            onSelect={() => updatePref('templateId', tmpl.id as CVTemplateId)}
                          />
                        ))}
                      </ResponsiveCarousel>
                    </div>
                    <div className="hidden md:grid grid-cols-3 gap-3">
                      {CV_TEMPLATES.map((tmpl) => (
                        <TemplatePickerCard
                          key={tmpl.id}
                          tmpl={tmpl}
                          active={cvData.displayPrefs.templateId === tmpl.id}
                          onSelect={() => updatePref('templateId', tmpl.id as CVTemplateId)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <PrefToggle
                      label="Tampilkan foto"
                      description="Konvensi Indonesia. Sembunyikan untuk lamaran luar negeri."
                      checked={cvData.displayPrefs.showPicture}
                      onChange={(v) => updatePref('showPicture', v)}
                    />
                    <PrefToggle
                      label="Tampilkan usia"
                      description="Direkomendasikan untuk Indonesia. Wajib isi tanggal lahir."
                      checked={cvData.displayPrefs.showAge}
                      onChange={(v) => updatePref('showAge', v)}
                    />
                    <PrefToggle
                      label="Tampilkan tahun kelulusan"
                      description="Standar di Indonesia. Hilangkan untuk anti-bias usia di luar negeri."
                      checked={cvData.displayPrefs.showGraduationYear}
                      onChange={(v) => updatePref('showGraduationYear', v)}
                    />
                  </div>
                </div>
              </SectionCard>

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
            <div className="min-w-0 lg:col-span-1">
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
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-muted-foreground">Kelengkapan</span>
                          <span className="text-sm font-semibold text-brand tabular-nums">
                            {computeScore(cvData)}%
                          </span>
                        </div>
                        {/* Narrative progress — tiny walker traversing
                            a 4-stop timeline, 🎉 at 100%. Replaces the
                            generic bar for a memorable hook. */}
                        <ProgressWalker
                          value={computeScore(cvData)}
                          label="Kelengkapan CV"
                        />
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

      {/* Checklist moved below — collapsed by default; user opens when
          ready to audit completeness against application requirements. */}
      <div className="mt-6">
        <DocChecklistInline format={format} />
      </div>

      {/* Preview Dialog — wide on desktop so 210 mm board fits edge-to-
          edge without horizontal scroll; drawer on mobile with scaled
          preview so A4 fits the narrow viewport. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          size="content"
          className="max-h-[95vh] overflow-y-auto"
          drawerClassName="max-h-[95vh]"
        >
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
              <DialogTitle className="flex items-center gap-2">
                Pratinjau CV
                {activeLang && (
                  <Badge variant="secondary" className="bg-brand-muted text-brand-muted-foreground">
                    {activeLang.toUpperCase()}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={isTranslating}
                    >
                      <Languages className="w-4 h-4" />
                      {isTranslating ? 'Menerjemahkan...' : 'Terjemahkan'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Pilih bahasa tujuan</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {TRANSLATE_LANGUAGES.map((lang) => (
                      <DropdownMenuItem
                        key={lang.id}
                        onClick={() => translate(lang.id as CVLangCode)}
                        disabled={isTranslating}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <span className="font-medium">{lang.label}</span>
                        {lang.note && (
                          <span className="text-xs text-muted-foreground">{lang.note}</span>
                        )}
                      </DropdownMenuItem>
                    ))}
                    {activeLang && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={revertTranslation} className="gap-2">
                          <Undo2 className="w-4 h-4" />
                          Kembali ke bahasa asli
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportCVToPDF}
                  disabled={isExporting}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Mengekspor...' : 'Ekspor PDF'}
                </Button>
              </div>
            </div>
            <DialogDescription className="text-xs">
              Tekan <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">Ctrl</kbd>+
              <kbd className="px-1 py-0.5 rounded bg-muted text-[11px]">P</kbd> untuk print-to-PDF native browser.
            </DialogDescription>
          </DialogHeader>
          {/* Layout (top→bottom): preview with overlay arrows + swipe,
              then thumbnail strip with name/dot pager. Translate &
              export sit in the dialog header above. Three discoverable
              ways to change template: tap an overlay arrow, swipe the
              preview, or tap a thumb below. ←/→ keys on desktop too. */}
          <div className="space-y-3">
            {/* Preview region — relative wraps the swipe surface so
                the L/R arrow buttons can absolute-overlay it without
                clipping. The capture ref still points at the unscaled
                A4 board inside ScaledCVPreview. */}
            <div className="relative">
              <div
                onPointerDown={onSwipeStart}
                onPointerMove={onSwipeMove}
                onPointerUp={onSwipeEnd}
                onPointerCancel={onSwipeEnd}
                style={{
                  transform: swipeDx
                    ? `translateX(${Math.max(-120, Math.min(120, swipeDx))}px)`
                    : undefined,
                  transition:
                    swipeStartX.current === null
                      ? 'transform 220ms cubic-bezier(0.2,0.8,0.3,1)'
                      : 'none',
                  touchAction: 'pan-y',
                }}
              >
                <ScaledCVPreview
                  ref={cvPreviewRef}
                  cv={renderCV}
                  photoUrl={photoUrl}
                />
              </div>
              {/* Overlay arrows — semi-opaque pills on the L/R edges
                  with a subtle drift animation so users see the swipe
                  affordance without reading any copy. Larger tap target
                  than the page-pager arrows in the strip below. */}
              <button
                type="button"
                aria-label="Template sebelumnya"
                onClick={() => cycleTemplate(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/85 shadow-md backdrop-blur border border-border hover:bg-background hover:scale-105 transition-transform motion-safe:animate-swipe-hint-left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Template berikutnya"
                onClick={() => cycleTemplate(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-background/85 shadow-md backdrop-blur border border-border hover:bg-background hover:scale-105 transition-transform motion-safe:animate-swipe-hint-right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Pager strip header — current template + dot indicator.
                Sits above the thumb chips so the user gets an explicit
                label of which one is active. */}
            <div className="flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-medium truncate">
                {CV_TEMPLATES[currentTemplateIdx]?.name}
              </p>
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
                {templateIds.map((id, i) => (
                  <span
                    key={id}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      i === currentTemplateIdx
                        ? 'w-5 bg-brand'
                        : 'w-1.5 bg-border',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Tappable thumbnail strip — placed BELOW preview so the
                preview is the primary visual focus. Snap-scroll on
                mobile, equal-width on ≥sm. */}
            <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CV_TEMPLATES.map((tmpl, i) => {
                const active = i === currentTemplateIdx;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() =>
                      updatePref('templateId', tmpl.id as CVTemplateId)
                    }
                    className={cn(
                      'shrink-0 snap-start w-32 sm:w-40 rounded-md border p-2 text-left transition-all',
                      active
                        ? 'border-brand ring-2 ring-brand/40 bg-brand-muted/30'
                        : 'border-border hover:border-brand/40',
                    )}
                    aria-pressed={active}
                  >
                    <div className="w-full">
                      <TemplateThumb id={tmpl.id as CVTemplateId} />
                    </div>
                    <p className="mt-1 text-[11px] font-medium truncate">
                      {tmpl.name}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

interface PrefToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function PrefToggle({ label, description, checked, onChange }: PrefToggleProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
      <div className="space-y-0.5 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

interface TemplatePickerCardProps {
  tmpl: (typeof CV_TEMPLATES)[number];
  active: boolean;
  onSelect: () => void;
}

function TemplatePickerCard({ tmpl, active, onSelect }: TemplatePickerCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full text-left rounded-lg border p-3 transition-all',
        active
          ? 'border-brand ring-2 ring-brand/40 bg-brand-muted/40'
          : 'border-border hover:border-brand/40 hover:bg-muted/40',
      )}
      aria-pressed={active}
    >
      <TemplateThumb id={tmpl.id as CVTemplateId} />
      <p className="text-sm font-semibold mt-2">{tmpl.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
        {tmpl.blurb}
      </p>
    </button>
  );
}

/**
 * Pure-CSS schematic of each template — block + lines that hint at the
 * layout without screenshotting the real preview. Renders crisp at any
 * size and is theme-token-free so it never drifts.
 */
function TemplateThumb({ id }: { id: CVTemplateId }) {
  if (id === "modern") {
    return (
      <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white">
        <div className="h-1/4 bg-blue-700 flex items-center px-2 gap-1.5">
          <span className="block h-3 w-3 rounded-full bg-white/70" />
          <span className="block h-1.5 w-10 rounded-sm bg-white/80" />
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-1.5 p-2">
          <div className="space-y-1">
            <span className="block h-1 w-full bg-blue-100 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-2/3 bg-neutral-200 rounded-sm" />
            <span className="mt-1 block h-1 w-full bg-blue-100 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
          </div>
          <div className="space-y-1">
            <span className="block h-1.5 w-1/2 bg-neutral-800 rounded-sm" />
            <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
            <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "minimal") {
    return (
      <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white p-2 space-y-1.5">
        <div className="text-center space-y-1">
          <span className="mx-auto block h-1.5 w-2/3 bg-neutral-900 rounded-sm" />
          <span className="mx-auto block h-1 w-1/2 bg-neutral-400 rounded-sm" />
        </div>
        <div className="border-t border-neutral-300 pt-1 space-y-1">
          <span className="block h-1 w-1/3 bg-neutral-900 rounded-sm" />
          <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
          <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
        </div>
        <div className="border-t border-neutral-300 pt-1 space-y-1">
          <span className="block h-1 w-1/3 bg-neutral-900 rounded-sm" />
          <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
          <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[3/4] w-full rounded border border-border overflow-hidden bg-white p-2">
      <div className="flex gap-2 border-b-2 border-emerald-800 pb-1.5">
        <span className="block h-9 w-7 rounded-sm bg-neutral-200" />
        <div className="flex-1 space-y-1 pt-0.5">
          <span className="block h-1.5 w-2/3 bg-emerald-800 rounded-sm" />
          <span className="block h-1 w-1/2 bg-neutral-400 rounded-sm" />
          <span className="block h-1 w-3/4 bg-neutral-200 rounded-sm" />
        </div>
      </div>
      <div className="mt-1.5 space-y-1">
        <span className="block h-1 w-1/3 bg-emerald-800 rounded-sm" />
        <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
        <span className="block h-1 w-5/6 bg-neutral-200 rounded-sm" />
        <span className="mt-1 block h-1 w-1/3 bg-emerald-800 rounded-sm" />
        <span className="block h-1 w-full bg-neutral-200 rounded-sm" />
      </div>
    </div>
  );
}
