"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import type { BrandingPayload } from "../themes";

export type ShowMoreList =
  | "projects"
  | "skills"
  | "experience"
  | "education"
  | "certifications"
  | "languages";

const TITLES: Record<ShowMoreList, string> = {
  projects: "Semua proyek",
  skills: "Semua skill",
  experience: "Semua pengalaman",
  education: "Semua pendidikan",
  certifications: "Semua sertifikasi",
  languages: "Semua bahasa",
};

const DESCRIPTIONS: Record<ShowMoreList, string> = {
  projects: "Daftar lengkap proyek dengan deskripsi, tech stack, dan link.",
  skills: "Seluruh skill yang Anda kuasai.",
  experience: "Riwayat pengalaman kerja lengkap dengan pencapaian.",
  education: "Riwayat pendidikan formal.",
  certifications: "Sertifikasi profesional yang Anda miliki.",
  languages: "Bahasa yang Anda kuasai.",
};

interface Props {
  branding: BrandingPayload | undefined;
  listName: ShowMoreList | null;
  onClose: () => void;
}

export function BrandingShowMoreDialog({ branding, listName, onClose }: Props) {
  const open = listName !== null;
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <ResponsiveDialogContent
        size="3xl"
        className="bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {listName ? TITLES[listName] : ""}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {listName ? DESCRIPTIONS[listName] : ""}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[70dvh] overflow-y-auto pr-1">
          {branding && listName ? (
            <ListBody branding={branding} listName={listName} />
          ) : null}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

function ListBody({
  branding,
  listName,
}: {
  branding: BrandingPayload;
  listName: ShowMoreList;
}) {
  switch (listName) {
    case "projects":
      return <ProjectsGrid items={branding.projects} />;
    case "skills":
      return <SkillsCloud items={branding.skills} />;
    case "experience":
      return <ExperienceList items={branding.experience} />;
    case "education":
      return <EducationList items={branding.education} />;
    case "certifications":
      return <CertList items={branding.certifications} />;
    case "languages":
      return <LangList items={branding.languages} />;
  }
}

const cardClass =
  "rounded-xl border border-border/60 bg-card/80 p-4 shadow-lg ring-1 ring-border/40 backdrop-blur-sm";

function ProjectsGrid({ items }: { items: BrandingPayload["projects"] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((p) => (
        <article key={p.id} className={cardClass}>
          {p.coverUrl ? (
            <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.coverUrl}
                alt={p.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : p.coverEmoji ? (
            <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-muted text-5xl">
              {p.coverEmoji}
            </div>
          ) : null}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
            {p.link ? (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-brand"
                aria-label="Buka link proyek"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
          {p.category ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
          ) : null}
          {p.description ? (
            <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
              {p.description}
            </p>
          ) : null}
          {p.techStack.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.techStack.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/80"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SkillsCloud({ items }: { items: string[] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className={`${cardClass} flex flex-wrap gap-2`}>
      {items.map((s) => (
        <span
          key={s}
          className="rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function ExperienceList({ items }: { items: BrandingPayload["experience"] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="space-y-3">
      {items.map((e, i) => {
        const period = e.current
          ? `${e.startDate} — Sekarang`
          : e.startDate && e.endDate
            ? `${e.startDate} — ${e.endDate}`
            : e.startDate || e.endDate || "";
        return (
          <article key={i} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {e.position}
                </h3>
                <p className="text-xs text-muted-foreground">{e.company}</p>
              </div>
              {period ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {period}
                </span>
              ) : null}
            </div>
            {e.description ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {e.description}
              </p>
            ) : null}
            {e.achievements.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-foreground/85">
                {e.achievements.map((a, ai) => (
                  <li key={ai}>{a}</li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function EducationList({ items }: { items: BrandingPayload["education"] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="space-y-3">
      {items.map((e, i) => {
        const period =
          e.startDate && e.endDate
            ? `${e.startDate} — ${e.endDate}`
            : e.startDate || e.endDate || "";
        return (
          <article key={i} className={cardClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {e.institution}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {[e.degree, e.field].filter(Boolean).join(" · ")}
                </p>
              </div>
              {period ? (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {period}
                </span>
              ) : null}
            </div>
            {e.gpa ? (
              <p className="mt-1 text-xs text-muted-foreground">GPA: {e.gpa}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function CertList({ items }: { items: BrandingPayload["certifications"] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((c, i) => (
        <article key={i} className={cardClass}>
          <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{c.issuer}</p>
          {c.date ? (
            <p className="mt-1 text-[10px] text-muted-foreground">{c.date}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function LangList({ items }: { items: BrandingPayload["languages"] }) {
  if (items.length === 0) return <Empty />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((l, i) => (
        <article
          key={i}
          className={`${cardClass} flex items-center justify-between`}
        >
          <span className="text-sm font-medium text-foreground">
            {l.language}
          </span>
          <span className="text-xs text-muted-foreground">{l.proficiency}</span>
        </article>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
      Belum ada data untuk ditampilkan.
    </p>
  );
}
