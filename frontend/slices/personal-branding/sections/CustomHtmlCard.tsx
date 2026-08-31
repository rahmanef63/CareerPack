"use client";

import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Code2, Loader2, RotateCcw, Save, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  ResponsiveSelect,
  ResponsiveSelectContent,
  ResponsiveSelectItem,
  ResponsiveSelectTrigger,
} from "@/shared/components/ui/responsive-select";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
} from "@/shared/components/ui/responsive-alert-dialog";
import { notify } from "@/shared/lib/notify";
import { api } from "../../../../convex/_generated/api";
import { TEMPLATE_THEMES, THEME_LABELS, type PersonalBrandingTheme } from "../blocks/types";
import type { Bind } from "../form/types";

/** Mirrors PUBLIC_HTML_MAX in convex/profile/publicHtml.ts. */
const HTML_MAX = 250_000;
/** Mirrors MAX_INSTRUCTION_CHARS in convex/ai/branding.ts. */
const INSTRUCTION_MAX = 400;

export interface CustomHtmlCardProps {
  bind: Bind;
}

/**
 * Custom page HTML — replaces the built-in template with a document CareerPack's
 * own AI wrote (via `generateBrandingHtml`, one click), the user typed by
 * hand, or ChatGPT wrote over the MCP connector.
 *
 * This card is what replaced the block builder: nine block types, nested
 * containers, drag-and-drop, a presets gallery and a second renderer, all so a
 * non-developer could arrange a page. An AI writes better HTML than that UI
 * could express, and the people who don't want AI involved still have the
 * templates. What's left is a generator, a text box, and two buttons.
 *
 * The textarea holds a LOCAL buffer and only commits to form state on save —
 * `html` rides the 1.5s autosave loop with everything else, and committing per
 * keystroke would ship the whole document on every character. A generated
 * document lands in that same buffer, not in `html` directly — "Simpan HTML"
 * is still the only thing that publishes it, so a generation the user doesn't
 * like costs nothing but a re-roll.
 */
export function CustomHtmlCard({ bind }: CustomHtmlCardProps) {
  const html = bind("html");
  const saved = html.value;
  const [draft, setDraft] = useState(saved);

  // Re-sync when the server value changes underneath us — an MCP write from
  // ChatGPT lands here while the editor is open. Uncommitted typing wins: it
  // is the only copy that exists, and clobbering it would lose work the user
  // can see on screen.
  const dirtyRef = useRef(false);
  useEffect(() => {
    if (dirtyRef.current) return;
    setDraft(saved);
  }, [saved]);

  const dirty = draft !== saved;
  const active = saved.trim().length > 0;

  const generateHtml = useAction(api.ai.branding.generateBrandingHtml);
  const [generating, setGenerating] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [templateId, setTemplateId] = useState<PersonalBrandingTheme>(bind("theme").value);
  // Generating overwrites the LOCAL draft, not the saved page — but if the
  // user has unsaved typing/edits sitting in that draft, silently discarding
  // it would still lose visible work. Only asks when there's something to lose.
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);

  async function runGenerate() {
    setConfirmOverwrite(false);
    setGenerating(true);
    try {
      const result = await generateHtml({
        instruction: instruction.trim() || undefined,
        templateId,
      });
      dirtyRef.current = true;
      setDraft(result.html);
      notify.success(
        `HTML dibuat (${result.chars.toLocaleString("id-ID")} karakter) — cek dulu di bawah, lalu klik "Simpan HTML".`,
      );
    } catch (err) {
      notify.fromError(err, "Gagal generate HTML");
    } finally {
      setGenerating(false);
    }
  }

  function onGenerateClick() {
    if (dirty) {
      setConfirmOverwrite(true);
      return;
    }
    void runGenerate();
  }

  function commit() {
    if (draft.length > HTML_MAX) {
      notify.warning(
        `HTML terlalu besar (${draft.length.toLocaleString("id-ID")} karakter, maksimal ${HTML_MAX.toLocaleString("id-ID")})`,
      );
      return;
    }
    dirtyRef.current = false;
    html.onChange(draft);
    notify.success(
      draft.trim() ? "HTML kustom dipakai" : "Kembali ke template bawaan",
    );
  }

  function reset() {
    dirtyRef.current = false;
    setDraft("");
    html.onChange("");
    notify.success("Kembali ke template bawaan");
  }

  return (
    <>
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            active
              ? "rounded-full bg-brand/15 px-2.5 py-0.5 text-xs font-medium text-brand"
              : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          }
        >
          {active
            ? `HTML kustom aktif · ${saved.length.toLocaleString("id-ID")} karakter`
            : "Pakai template bawaan"}
        </span>
      </div>

      <div className="space-y-2.5 rounded-lg border border-brand/30 bg-brand/[0.04] p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-brand">
          <Wand2 className="h-4 w-4" />
          Generate dengan AI
        </div>
        <p className="text-xs text-muted-foreground">
          AI CareerPack menulis halaman pakai profil, CV, skill dan project
          kamu — datanya tetap ikut update otomatis tiap kamu ubah CV
          (halaman tidak menyimpan teks statis). Hasilnya masuk ke kotak di
          bawah untuk kamu cek dulu; belum tersimpan sampai kamu klik
          &quot;Simpan HTML&quot;.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ResponsiveSelect
            value={templateId}
            onValueChange={(v) => setTemplateId(v as PersonalBrandingTheme)}
          >
            <ResponsiveSelectTrigger
              placeholder="Template dasar"
              aria-label="Template dasar untuk AI"
              className="sm:w-48"
            />
            <ResponsiveSelectContent drawerTitle="Template dasar">
              {TEMPLATE_THEMES.map((id) => (
                <ResponsiveSelectItem key={id} value={id}>
                  {THEME_LABELS[id].label}
                </ResponsiveSelectItem>
              ))}
            </ResponsiveSelectContent>
          </ResponsiveSelect>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value.slice(0, INSTRUCTION_MAX))}
            rows={1}
            maxLength={INSTRUCTION_MAX}
            placeholder="Opsional: gaya/fokus, mis. 'minimalis, warna biru, tonjolkan project'"
            aria-label="Preferensi gaya untuk AI"
            className="min-h-9 flex-1 resize-none text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button type="button" size="sm" onClick={onGenerateClick} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-4 w-4" />
            )}
            {generating ? "Membuat…" : "Generate"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {instruction.length}/{INSTRUCTION_MAX}
          </span>
        </div>
      </div>

      <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          Alternatif: sambungkan CareerPack sebagai connector di ChatGPT, lalu
          minta <em>&quot;bikinin halaman personal branding aku&quot;</em>.
          ChatGPT baca data kamu lewat{" "}
          <code className="font-mono">branding_data</code> dan menyimpan
          hasilnya lewat <code className="font-mono">branding_set_html</code>{" "}
          — dipakai kalau kamu mau iterasi lewat percakapan, bukan satu klik.
        </p>
      </div>

      <Textarea
        value={draft}
        onChange={(e) => {
          dirtyRef.current = true;
          setDraft(e.target.value);
        }}
        spellCheck={false}
        rows={10}
        placeholder="<!doctype html> … tempel dokumen HTML lengkap di sini, atau biarkan kosong untuk pakai template."
        className="font-mono text-xs"
        aria-label="HTML kustom halaman publik"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={commit} disabled={!dirty}>
          <Save className="mr-1.5 h-4 w-4" />
          {dirty ? "Simpan HTML" : "Tersimpan"}
        </Button>
        {active && (
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Hapus, balik ke template
          </Button>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Code2 className="h-3.5 w-3.5" />
          Dirender di iframe terisolasi — script kamu tidak bisa menyentuh akun
          CareerPack.
        </span>
      </div>
    </div>
    <ResponsiveAlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
      <ResponsiveAlertDialogContent>
        <ResponsiveAlertDialogHeader>
          <ResponsiveAlertDialogTitle>Timpa draft yang belum disimpan?</ResponsiveAlertDialogTitle>
          <ResponsiveAlertDialogDescription>
            Ada perubahan di kotak HTML yang belum kamu klik &quot;Simpan
            HTML&quot;. Generate akan mengganti isi kotak itu dengan hasil AI —
            perubahan yang belum disimpan akan hilang.
          </ResponsiveAlertDialogDescription>
        </ResponsiveAlertDialogHeader>
        <ResponsiveAlertDialogFooter>
          <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
          <ResponsiveAlertDialogAction onClick={() => void runGenerate()}>
            Timpa &amp; generate
          </ResponsiveAlertDialogAction>
        </ResponsiveAlertDialogFooter>
      </ResponsiveAlertDialogContent>
    </ResponsiveAlertDialog>
    </>
  );
}
