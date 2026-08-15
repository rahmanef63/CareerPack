"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, RotateCcw, Save, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { notify } from "@/shared/lib/notify";
import type { Bind } from "../form/types";

/** Mirrors PUBLIC_HTML_MAX in convex/profile/publicHtml.ts. */
const HTML_MAX = 250_000;

export interface CustomHtmlCardProps {
  bind: Bind;
}

/**
 * Custom page HTML — replaces the built-in template with a document the user
 * (or ChatGPT, over the MCP connector) wrote.
 *
 * This card is what replaced the block builder: nine block types, nested
 * containers, drag-and-drop, a presets gallery and a second renderer, all so a
 * non-developer could arrange a page. An AI host writes better HTML than that
 * UI could express, and the people who don't have one still have the
 * templates. What's left is a text box and two buttons.
 *
 * The textarea holds a LOCAL buffer and only commits to form state on save —
 * `html` rides the 1.5s autosave loop with everything else, and committing per
 * keystroke would ship the whole document on every character.
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

      <div className="flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p>
          Cara paling gampang: sambungkan CareerPack sebagai connector di
          ChatGPT, lalu minta{" "}
          <em>&quot;bikinin halaman personal branding aku&quot;</em>. ChatGPT
          baca data kamu lewat <code className="font-mono">branding_data</code>{" "}
          dan menyimpan hasilnya lewat{" "}
          <code className="font-mono">branding_set_html</code>. Data (CV,
          proyek, skill) tetap ketarik otomatis — HTML-nya cuma kerangka, jadi
          halaman ikut update tiap kamu ubah CV.
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
  );
}
