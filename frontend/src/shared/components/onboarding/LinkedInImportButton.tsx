"use client";

import { useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle2, FileUp, Linkedin, Loader2, Sparkles } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { notify } from "@/shared/lib/notify";

interface ParsedProfile {
  fullName?: string;
  phone?: string;
  location?: string;
  targetRole?: string;
  experienceLevel?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

interface LinkedInImportButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  className?: string;
  /** Called after a successful apply so the parent can react (refresh
   *  query, advance wizard, dismiss dialog, etc.). */
  onApplied?: () => void;
}

/**
 * One-shot LinkedIn / resume PDF importer. Dynamic-imports `pdfjs-dist`
 * only when the user actually opens the dialog so the main bundle stays
 * lean. Pipeline: PDF → extracted text (browser-side) → parseImportText
 * AI action (server-side) → preview → createOrUpdateProfile mutation.
 */
export function LinkedInImportButton({
  variant = "outline",
  size = "default",
  className,
  onApplied,
}: LinkedInImportButtonProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractedText, setExtractedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [parsed, setParsed] = useState<ParsedProfile | null>(null);

  const me = useQuery(api.profile.queries.getCurrentUser);
  const parseAction = useAction(api.ai.actions.parseImportText);
  const saveProfile = useMutation(api.profile.mutations.createOrUpdateProfile);

  const reset = () => {
    setExtractedText("");
    setExtracting(false);
    setParsing(false);
    setApplying(false);
    setParsed(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      notify.error("File harus PDF");
      return;
    }
    setExtracting(true);
    setParsed(null);
    try {
      const text = await extractPdfText(file);
      if (!text || text.trim().length < 60) {
        notify.error("PDF tidak menghasilkan teks (mungkin scan-image). Coba export PDF text-based.");
        return;
      }
      setExtractedText(text);
      notify.success(`PDF diekstrak — ${text.length} karakter`);
    } catch (err) {
      notify.fromError(err, "Gagal ekstrak PDF");
    } finally {
      setExtracting(false);
    }
  };

  const handleParse = async () => {
    if (extractedText.trim().length < 40) {
      notify.error("Teks terlalu pendek untuk diparse");
      return;
    }
    setParsing(true);
    try {
      const result = (await parseAction({ text: extractedText })) as { profile?: ParsedProfile };
      const profile = result?.profile;
      if (!profile || !profile.fullName) {
        notify.error("AI tidak berhasil ekstrak profil. Coba edit teks lalu parse ulang.");
        return;
      }
      setParsed(profile);
      notify.success("Profil ter-ekstrak — review lalu apply");
    } catch (err) {
      notify.fromError(err, "Gagal parse teks");
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!parsed) return;
    setApplying(true);
    try {
      await saveProfile({
        fullName: parsed.fullName ?? me?.profile?.fullName ?? "Anonymous",
        phone: parsed.phone ?? me?.profile?.phone,
        location: parsed.location ?? me?.profile?.location ?? "—",
        targetRole: parsed.targetRole ?? me?.profile?.targetRole ?? "—",
        experienceLevel: parsed.experienceLevel ?? me?.profile?.experienceLevel ?? "mid-level",
        skills: parsed.skills ?? me?.profile?.skills ?? [],
        interests: parsed.interests ?? me?.profile?.interests ?? [],
        bio: parsed.bio ?? me?.profile?.bio,
      });
      notify.success("Profil ter-update dari LinkedIn import");
      setOpen(false);
      setTimeout(() => {
        reset();
        onApplied?.();
      }, 300);
    } catch (err) {
      notify.fromError(err, "Gagal apply ke profil");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Linkedin className="h-4 w-4" />
        <span>Import LinkedIn (PDF)</span>
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setTimeout(reset, 300);
          } else setOpen(true);
        }}
      >
        <ResponsiveDialogContent size="2xl">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-brand" />
              Import dari LinkedIn / Resume PDF
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Upload PDF (LinkedIn → Save as PDF, atau resume PDF kamu). Kami
              ekstrak teks → AI parse jadi profil.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <div className="space-y-4">
            {/* Step 1 — file picker */}
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 text-center">
              <FileUp className="mx-auto mb-2 h-6 w-6 text-brand" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengekstrak…</span>
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" />
                    <span>{extractedText ? "Ganti PDF" : "Pilih PDF"}</span>
                  </>
                )}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                LinkedIn → ⋯ More → Save to PDF
              </p>
            </div>

            {/* Step 2 — extracted text (editable) */}
            {extractedText && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Teks ter-ekstrak (boleh edit)
                </p>
                <Textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={6}
                  className="text-xs"
                  spellCheck={false}
                />
                {!parsed && (
                  <Button
                    type="button"
                    onClick={handleParse}
                    disabled={parsing || extractedText.trim().length < 40}
                    className="w-full gap-2 bg-brand hover:bg-brand"
                  >
                    {parsing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI memparse…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Parse dengan AI</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Step 3 — parsed preview */}
            {parsed && (
              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Pratinjau profil
                </p>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <Item label="Nama" value={parsed.fullName} />
                  <Item label="Lokasi" value={parsed.location} />
                  <Item label="Target role" value={parsed.targetRole} />
                  <Item label="Level" value={parsed.experienceLevel} />
                  <Item label="Phone" value={parsed.phone} />
                  <Item label="Bio" value={parsed.bio} className="sm:col-span-2" />
                  <Item
                    label="Skills"
                    value={parsed.skills?.join(", ")}
                    className="sm:col-span-2"
                  />
                </dl>
              </div>
            )}
          </div>

          <ResponsiveDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setTimeout(reset, 300);
              }}
            >
              Tutup
            </Button>
            {parsed && (
              <Button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="gap-2 bg-brand hover:bg-brand"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menerapkan…</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Apply ke Profil</span>
                  </>
                )}
              </Button>
            )}
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

function Item({
  label,
  value,
  className,
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Lazy-load pdfjs-dist on first invocation. Imports the legacy build
 * (Node + browser compatible, no top-level worker dependency) and runs
 * the worker inline. This avoids shipping pdfjs to every page.
 */
async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore — pdfjs-dist legacy build lacks DT for this entry point.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Inline worker so we don't have to copy worker file into /public.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/legacy/build/pdf.worker.min.mjs";
  }
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages && p <= 30; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((it: unknown) => {
        if (it && typeof it === "object" && "str" in it && typeof (it as { str: unknown }).str === "string") {
          return (it as { str: string }).str;
        }
        return "";
      })
      .filter(Boolean)
      .join(" ");
    pages.push(text);
  }
  return pages.join("\n\n").replace(/\s+/g, " ").trim();
}
