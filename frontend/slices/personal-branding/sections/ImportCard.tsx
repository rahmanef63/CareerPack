"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { Loader2, Sparkles, Upload, Wand2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { QuickFillButton } from "@/shared/components/onboarding/QuickFillButton";
import { notify } from "@/shared/lib/notify";

/**
 * Import tab — three paths from "raw text I have" to "profile filled":
 *
 * 1. **AI Quick Fill (copy-paste prompt)** — most flexible. User runs
 *    our prompt through Claude/ChatGPT/Gemini, pastes JSON back. Covers
 *    every scope (profile + cv + portfolio + contacts + applications).
 * 2. **Server-side AI parse** — fastest. User pastes raw resume / LinkedIn
 *    text into a textarea here; we call our own AI proxy with the same
 *    prompt and apply the result. Currently scope=profile only.
 * 3. **Structured import (LinkedIn URL / Notion / PDF)** — needs OAuth /
 *    PDF parsing, scoped out of the current batch. Documented in
 *    docs/progress/ as a follow-up.
 */
export function ImportCard() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle as="h3" className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-brand" />
            Isi Cepat dengan AI (copy–paste prompt)
          </CardTitle>
          <CardDescription>
            Paling fleksibel — cocok untuk import lengkap (profile + CV +
            portofolio + kontak). Tempel CV / LinkedIn ke AI eksternal,
            balasan JSON tempel kembali ke sini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Klik <strong>Mulai Quick Fill</strong> di bawah.</li>
            <li>Pilih <em>scope</em> &quot;Profil&quot; (default), salin prompt yang ditampilkan.</li>
            <li>Tempel ke AI bersama dengan teks CV / LinkedIn Anda.</li>
            <li>Salin balasan AI (JSON), tempel ke step terakhir, klik Apply.</li>
          </ol>
          <QuickFillButton
            scope="profile"
            label="Mulai Quick Fill — scope Profil"
          />
        </CardContent>
      </Card>

      <ServerSideParseCard />
    </div>
  );
}

function ServerSideParseCard() {
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const parse = useAction(api.ai.actions.parseImportText);
  const apply = useMutation(api.onboarding.mutations.quickFill);

  const onParse = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 40) {
      notify.error("Teks terlalu pendek — minimal 40 karakter.");
      return;
    }
    setRunning(true);
    try {
      const payload = await parse({ text: trimmed });
      const res = await apply({ payload, scope: "profile" });
      const inserted = (res as { inserted?: number })?.inserted ?? 0;
      notify.success("Profil berhasil diisi", {
        description: inserted > 0 ? `${inserted} field dipopulasi dari teks Anda.` : "Cek tab Profile untuk hasilnya.",
      });
      setText("");
    } catch (err) {
      notify.fromError(err, "Gagal memparse teks");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3" className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4 text-brand" />
          Parse Otomatis (server-side)
        </CardTitle>
        <CardDescription>
          Tempel teks resume atau ringkasan LinkedIn — AI kami yang
          ekstrak field profile-nya. Lebih cepat dari jalur copy-paste,
          tapi saat ini hanya isi <strong>scope profile</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={6}
          placeholder="Tempel ringkasan LinkedIn / resume teks polos di sini…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={running}
          aria-label="Teks resume atau profil LinkedIn untuk diparse"
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {text.length} karakter · minimal 40
          </p>
          <Button
            type="button"
            onClick={onParse}
            disabled={running || text.trim().length < 40}
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memparse…</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Parse &amp; Apply</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
