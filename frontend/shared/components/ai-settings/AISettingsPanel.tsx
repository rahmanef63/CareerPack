"use client";

import { Sparkles } from "lucide-react";

import { AIProviderForm } from "./AIProviderForm";

export interface AISettingsPanelProps {
  /** When embedded (di dalam SettingsView), skip outer container + header. */
  embedded?: boolean;
  /** The OAuth callback came back with `?ai=error`. See `settings/lib/aiConnectResult.ts`. */
  connectFailed?: boolean;
}

/**
 * Per-user AI settings — the page shell around `AIProviderForm`. It has no
 * fields of its own: account login used to live in a separate card above the
 * form (`slices/settings/components/AIConnectCard`), which offered "masuk
 * dengan OpenRouter" before the user had picked a provider. Both halves are one
 * form now, ordered provider → auth → model.
 */
export function AISettingsPanel({
  embedded = false,
  connectFailed,
}: AISettingsPanelProps = {}) {
  const form = <AIProviderForm scope="user" connectFailed={connectFailed} />;
  if (embedded) return form;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand" /> Setelan AI
        </h1>
        <p className="text-sm text-muted-foreground">
          Sambungkan akun atau tempel API key sendiri. Tanpa itu, fitur AI tetap jalan dengan
          default sistem.
        </p>
      </header>
      {form}
    </div>
  );
}
