"use client";

import { useCallback, useState } from "react";
import { useAction } from "convex/react";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../../convex/_generated/api";
import type { CVData } from "../types";

export const TRANSLATE_LANGUAGES: Array<{
  id: CVLangCode;
  label: string;
  note?: string;
}> = [
  { id: "en", label: "English", note: "Default for LinkedIn & luar negeri" },
  { id: "ar", label: "العربية (Arab)", note: "Timur Tengah / Saudi, UAE, Qatar" },
  { id: "zh", label: "中文 (Mandarin)", note: "China daratan, Taiwan, Singapura" },
  { id: "ja", label: "日本語 (Jepang)", note: "SSW / ingenieur" },
  { id: "ko", label: "한국어 (Korea)", note: "EPS worker, chaebol, K-industry" },
  { id: "de", label: "Deutsch (Jerman)", note: "Ausbildung & engineering" },
  { id: "nl", label: "Nederlands (Belanda)", note: "StuNed, tech & akademik" },
];

export type CVLangCode = "en" | "ar" | "zh" | "ja" | "ko" | "de" | "nl";

interface FlatField {
  key: string;
  text: string;
}

/** Walk a CVData into a flat {key,text} list for AI translation. */
function flatten(cv: CVData): FlatField[] {
  const out: FlatField[] = [];
  if (cv.profile.summary) out.push({ key: "profile.summary", text: cv.profile.summary });
  if (cv.profile.targetIndustry) out.push({ key: "profile.targetIndustry", text: cv.profile.targetIndustry });
  cv.experience.forEach((e) => {
    if (e.position) out.push({ key: `exp.${e.id}.position`, text: e.position });
    if (e.description) out.push({ key: `exp.${e.id}.description`, text: e.description });
    e.achievements.forEach((a, i) => {
      if (a) out.push({ key: `exp.${e.id}.ach.${i}`, text: a });
    });
  });
  cv.education.forEach((ed) => {
    if (ed.degree) out.push({ key: `edu.${ed.id}.degree`, text: ed.degree });
    if (ed.fieldOfStudy) out.push({ key: `edu.${ed.id}.field`, text: ed.fieldOfStudy });
  });
  cv.certifications.forEach((c) => {
    if (c.name) out.push({ key: `cert.${c.id}.name`, text: c.name });
  });
  cv.projects.forEach((p) => {
    if (p.name) out.push({ key: `proj.${p.id}.name`, text: p.name });
    if (p.description) out.push({ key: `proj.${p.id}.description`, text: p.description });
  });
  return out;
}

function applyTranslations(cv: CVData, t: Record<string, string>): CVData {
  const pick = (key: string, fallback: string) => (t[key] && t[key].length > 0 ? t[key] : fallback);
  return {
    ...cv,
    profile: {
      ...cv.profile,
      summary: pick("profile.summary", cv.profile.summary),
      targetIndustry: pick("profile.targetIndustry", cv.profile.targetIndustry),
    },
    experience: cv.experience.map((e) => ({
      ...e,
      position: pick(`exp.${e.id}.position`, e.position),
      description: pick(`exp.${e.id}.description`, e.description),
      achievements: e.achievements.map((a, i) => pick(`exp.${e.id}.ach.${i}`, a)),
    })),
    education: cv.education.map((ed) => ({
      ...ed,
      degree: pick(`edu.${ed.id}.degree`, ed.degree),
      fieldOfStudy: pick(`edu.${ed.id}.field`, ed.fieldOfStudy),
    })),
    certifications: cv.certifications.map((c) => ({
      ...c,
      name: pick(`cert.${c.id}.name`, c.name),
    })),
    projects: cv.projects.map((p) => ({
      ...p,
      name: pick(`proj.${p.id}.name`, p.name),
      description: pick(`proj.${p.id}.description`, p.description),
    })),
  };
}

export function useCVTranslate(source: CVData) {
  const translateAction = useAction(api.cv.actions.translate);
  const [activeLang, setActiveLang] = useState<CVLangCode | null>(null);
  const [translatedCV, setTranslatedCV] = useState<CVData | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(
    async (lang: CVLangCode) => {
      if (isTranslating) return;
      setIsTranslating(true);
      try {
        const fields = flatten(source);
        if (fields.length === 0) {
          notify.info("Belum ada teks untuk diterjemahkan");
          return;
        }
        const { translations } = await translateAction({ targetLang: lang, fields });
        const next = applyTranslations(source, translations);
        setTranslatedCV(next);
        setActiveLang(lang);
        notify.success(`CV diterjemahkan ke ${lang.toUpperCase()}`);
      } catch (err) {
        notify.fromError(err, "Gagal menerjemahkan CV");
      } finally {
        setIsTranslating(false);
      }
    },
    [source, translateAction, isTranslating],
  );

  const revert = useCallback(() => {
    setActiveLang(null);
    setTranslatedCV(null);
  }, []);

  return {
    translate,
    revert,
    activeLang,
    translatedCV,
    isTranslating,
  };
}
