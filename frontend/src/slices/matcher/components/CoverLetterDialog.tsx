"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Copy, Download, FileText, Loader2, Sparkles } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/shared/components/ui/responsive-dialog";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import { Textarea } from "@/shared/components/ui/textarea";
import { notify } from "@/shared/lib/notify";

import type { JobListing } from "../types";

interface CoverLetterDialogProps {
  job: JobListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "en", label: "English" },
];

const TONE_OPTIONS = [
  { value: "warm", label: "Hangat & natural" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Antusias" },
];

export function CoverLetterDialog({ job, open, onOpenChange }: CoverLetterDialogProps) {
  const generate = useAction(api.cv.actions.generateCoverLetter);
  const [language, setLanguage] = useState("id");
  const [tone, setTone] = useState("warm");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);

  const reset = () => {
    setText("");
    setGenerating(false);
  };

  const handleGenerate = async () => {
    if (!job) return;
    setGenerating(true);
    try {
      const res = await generate({
        jobListingId: job._id,
        language,
        tone,
      });
      setText(res.text);
      notify.success("Cover letter siap — edit dan copy", {
        description: res.jobMeta,
      });
    } catch (err) {
      notify.fromError(err, "Gagal generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success("Tersalin ke clipboard");
    } catch {
      notify.error("Gagal salin — pilih teks lalu Ctrl+C");
    }
  };

  const handleDownload = () => {
    if (!job) return;
    const slug = `${job.company}-${job.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${slug || "job"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <ResponsiveDialogContent size="2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand" />
            Cover Letter Generator
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {job
              ? `${job.title} · ${job.company}`
              : "Pilih lowongan untuk generate cover letter."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {/* Settings row */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cl-lang">Bahasa</Label>
              <ResponsiveSelect value={language} onValueChange={setLanguage}>
                <ResponsiveSelectTrigger id="cl-lang" />
                <ResponsiveSelectContent drawerTitle="Bahasa">
                  {LANGUAGE_OPTIONS.map((o) => (
                    <ResponsiveSelectItem key={o.value} value={o.value}>
                      {o.label}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cl-tone">Nada</Label>
              <ResponsiveSelect value={tone} onValueChange={setTone}>
                <ResponsiveSelectTrigger id="cl-tone" />
                <ResponsiveSelectContent drawerTitle="Nada">
                  {TONE_OPTIONS.map((o) => (
                    <ResponsiveSelectItem key={o.value} value={o.value}>
                      {o.label}
                    </ResponsiveSelectItem>
                  ))}
                </ResponsiveSelectContent>
              </ResponsiveSelect>
            </div>
          </div>

          {/* Generate button */}
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!job || generating}
            className="w-full gap-2 bg-brand hover:bg-brand"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menulis cover letter…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{text ? "Generate Ulang" : "Generate Cover Letter"}</span>
              </>
            )}
          </Button>

          {/* Output */}
          {text && (
            <div className="space-y-2">
              <Label htmlFor="cl-output">Hasil — edit sebelum kirim</Label>
              <Textarea
                id="cl-output"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                className="font-mono text-[13px] leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {text.split(/\s+/).filter(Boolean).length} kata · pakai CV terbaru kamu sebagai sumber
              </p>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {text && (
            <>
              <Button type="button" variant="secondary" onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                Salin
              </Button>
              <Button type="button" onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download .txt
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
