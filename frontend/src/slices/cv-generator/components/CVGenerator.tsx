"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { QuickFillButton } from '@/shared/components/onboarding';
import { api } from '../../../../../convex/_generated/api';
import type { CVData, CVTemplateId, Experience, Skill } from '../types';
import { PageContainer } from '@/shared/components/layout/PageContainer';
import { useCV } from '../hooks/useCV';
import { useCVAIActions } from '../hooks/useCVAIActions';
import { CV_TEMPLATES, initialCVData, type CVFormat } from '../constants';
import { MagneticTabs, useDragReorder } from '@/shared/components/interactions/MicroInteractions';
import { DocChecklistInline } from './DocChecklistInline';
import { useCVTranslate } from '../hooks/useCVTranslate';
import { notify } from '@/shared/lib/notify';
import { exportCVToPDF } from './cv-generator/exportPDF';
import { useCVHandlers } from './cv-generator/useCVHandlers';
import { PersonalInfoSection } from './cv-generator/sections/PersonalInfoSection';
import { DisplayPrefsSection } from './cv-generator/sections/DisplayPrefsSection';
import { ExperienceSection } from './cv-generator/sections/ExperienceSection';
import { EducationSection } from './cv-generator/sections/EducationSection';
import { SkillsSection } from './cv-generator/sections/SkillsSection';
import { CertificationsSection } from './cv-generator/sections/CertificationsSection';
import { ProjectsSection } from './cv-generator/sections/ProjectsSection';
import { PreviewSidebar } from './cv-generator/PreviewSidebar';
import { CVPreviewDialog } from './cv-generator/CVPreviewDialog';

export function CVGenerator() {
  const { cvData: remoteCVData, saveCV, isLoading: isCVLoading, activeCVId } = useCV();
  const [cvData, setCvData] = useState<CVData>(initialCVData);
  const [hydratedFromId, setHydratedFromId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<CVFormat>('national');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('personal');

  const avatarStorageId = cvData.profile.avatarStorageId;
  const resolvedPhotoUrl = useQuery(
    api.files.queries.getFileUrl,
    avatarStorageId ? { storageId: avatarStorageId } : "skip",
  );
  const photoUrl = resolvedPhotoUrl ?? '';

  const toggleSection = useCallback((id: string) => {
    setActiveSection((prev) => (prev === id ? null : id));
  }, []);
  const cvPreviewRef = useRef<HTMLDivElement>(null);

  const handlers = useCVHandlers(setCvData, setFormat);

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

  // Power-user: ←/→ cycle when dialog is open + focus isn't in a form field.
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
  // source of truth. Preview + PDF use the translated snapshot when active.
  const {
    translate, revert: revertTranslation,
    activeLang, translatedCV, isTranslating,
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

  // Hydrate form from the active Convex CV. Watching the CV's id (not
  // a one-shot boolean) means a freshly-imported QuickFill CV becomes
  // active — useCV picks the newest — and the form swaps over without
  // a page reload. Demo mode has no activeCVId, so we use the literal
  // "demo" sentinel so demo data still loads once.
  useEffect(() => {
    if (!remoteCVData) return;
    const idStr = activeCVId ? String(activeCVId) : "demo";
    if (hydratedFromId === idStr) return;
    setCvData(remoteCVData);
    setHydratedFromId(idStr);
  }, [remoteCVData, activeCVId, hydratedFromId]);

  useCVAIActions({ setCVData: setCvData, setActiveSection, setFormat });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCV(cvData);
      notify.success("CV tersimpan");
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan CV");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
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
      await exportCVToPDF({ node, cvData });
    } catch (err) {
      notify.fromError(err, 'Gagal ekspor PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = () => {
    if (!previewOpen) {
      setPreviewOpen(true);
      setTimeout(() => { void handleExport(); }, 50);
      return;
    }
    void handleExport();
  };

  return (
    <PageContainer size="lg">
      {/* Header — mobile-friendly, with compact format toggle inline
          (no Card chrome) + mobile-only "Pratinjau" button so small
          viewports can reach the preview dialog without scrolling to
          the bottom sidebar. */}
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
            onChange={handlers.setFormatWithDefaults}
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
              // Blur before opening — Radix's aria-hidden on background
              // would otherwise trip the "descendant retained focus" a11y
              // warning.
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

      {/* min-w-0 on children: canonical fix for grid-track overflow —
          lets cards shrink below their intrinsic content width. */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {isCVLoading && (
          <div className="lg:col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        )}

        {!isCVLoading && (
          <>
            <div className="min-w-0 lg:col-span-2 space-y-6">
              <PersonalInfoSection
                cvData={cvData}
                format={format}
                photoUrl={photoUrl}
                avatarStorageId={avatarStorageId}
                updateProfile={handlers.updateProfile}
                onPhotoUploaded={handlers.handlePhotoUploaded}
                onPhotoClear={handlers.handlePhotoClear}
                aiSuggestSummary={handlers.aiSuggestSummary}
              />
              <DisplayPrefsSection
                cvData={cvData}
                isOpen={activeSection === 'display'}
                onToggle={() => toggleSection('display')}
                updatePref={handlers.updatePref}
              />
              <ExperienceSection
                cvData={cvData}
                isOpen={activeSection === 'experience'}
                onToggle={() => toggleSection('experience')}
                expDrag={expDrag}
                addExperience={handlers.addExperience}
                updateExperience={handlers.updateExperience}
                removeExperience={handlers.removeExperience}
                aiSuggestExperienceDesc={handlers.aiSuggestExperienceDesc}
              />
              <EducationSection
                cvData={cvData}
                isOpen={activeSection === 'education'}
                onToggle={() => toggleSection('education')}
                addEducation={handlers.addEducation}
                updateEducation={handlers.updateEducation}
                removeEducation={handlers.removeEducation}
              />
              <SkillsSection
                cvData={cvData}
                isOpen={activeSection === 'skills'}
                onToggle={() => toggleSection('skills')}
                skillDrag={skillDrag}
                addSkill={handlers.addSkill}
                updateSkill={handlers.updateSkill}
                removeSkill={handlers.removeSkill}
              />
              <CertificationsSection
                cvData={cvData}
                isOpen={activeSection === 'certifications'}
                onToggle={() => toggleSection('certifications')}
                addCertification={handlers.addCertification}
                updateCertification={handlers.updateCertification}
                removeCertification={handlers.removeCertification}
              />
              <ProjectsSection
                cvData={cvData}
                isOpen={activeSection === 'projects'}
                onToggle={() => toggleSection('projects')}
                addProject={handlers.addProject}
                updateProject={handlers.updateProject}
                removeProject={handlers.removeProject}
              />
            </div>

            <PreviewSidebar
              cvData={cvData}
              renderCV={renderCV}
              photoUrl={photoUrl}
              isSaving={isSaving}
              isExporting={isExporting}
              onPreviewOpen={() => setPreviewOpen(true)}
              onSave={handleSave}
              onExportClick={handleExportClick}
            />
          </>
        )}
      </div>

      {/* Checklist below — collapsed by default; user opens when ready
          to audit completeness against application requirements. */}
      <div className="mt-6">
        <DocChecklistInline format={format} />
      </div>

      <CVPreviewDialog
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        renderCV={renderCV}
        photoUrl={photoUrl}
        cvPreviewRef={cvPreviewRef}
        currentTemplateIdx={currentTemplateIdx}
        templateIds={templateIds}
        swipeStartXRef={swipeStartX}
        swipeDx={swipeDx}
        onSwipeStart={onSwipeStart}
        onSwipeMove={onSwipeMove}
        onSwipeEnd={onSwipeEnd}
        cycleTemplate={cycleTemplate}
        updatePref={handlers.updatePref}
        onExportPDF={handleExport}
        isExporting={isExporting}
        translate={translate}
        revertTranslation={revertTranslation}
        activeLang={activeLang}
        isTranslating={isTranslating}
      />
    </PageContainer>
  );
}
