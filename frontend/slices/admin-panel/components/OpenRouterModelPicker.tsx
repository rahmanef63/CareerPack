"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { Check, Loader2, RefreshCw } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";

interface OpenRouterModel {
  id: string;
  name: string;
  promptUsd: number;
  completionUsd: number;
  context: number;
}

const RECOMMENDED: ReadonlyArray<{ id: string; hint: string }> = [
  { id: "openai/gpt-4o-mini", hint: "Murah, cepat, default" },
  { id: "openai/gpt-4o", hint: "Lebih kuat, lebih mahal" },
  { id: "anthropic/claude-haiku-4.5", hint: "Cepat, ringan" },
  { id: "anthropic/claude-sonnet-4.5", hint: "Top tier penalaran" },
  { id: "google/gemini-2.5-flash", hint: "Murah, multimodal" },
  { id: "google/gemini-2.5-pro", hint: "Konteks panjang" },
  { id: "x-ai/grok-4", hint: "Penalaran kuat" },
  { id: "deepseek/deepseek-chat", hint: "Sangat murah" },
  { id: "meta-llama/llama-3.3-70b-instruct", hint: "Open weights" },
  { id: "moonshotai/kimi-k2", hint: "Long context" },
];

interface OpenRouterModelPickerProps {
  value: string;
  onChange: (model: string) => void;
  /** Optional id used by a parent <label htmlFor=…>. */
  inputId?: string;
}

/**
 * Model picker for OpenRouter. Shows 10 curated chips for one-click
 * picking, plus a free-text input with a `<datalist>` autocomplete
 * sourced live from `openrouter.ai/api/v1/models`. Free text is always
 * accepted — datalist is just a hint to reduce typos. We mark the
 * value with a green check when it matches a known OpenRouter slug.
 */
export function OpenRouterModelPicker({ value, onChange, inputId }: OpenRouterModelPickerProps) {
  const datalistId = `${inputId ?? "or-model"}-datalist`;
  const fetchModels = useAction(api.ai.actions.listOpenRouterModels);
  const [models, setModels] = useState<OpenRouterModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await fetchModels({})) as OpenRouterModel[];
      setModels(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar model");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const knownSet = useMemo(() => new Set((models ?? []).map((m) => m.id)), [models]);
  const trimmed = value.trim();
  const isKnown = trimmed.length > 0 && knownSet.has(trimmed);

  const matchedModel = useMemo(
    () => models?.find((m) => m.id === trimmed) ?? null,
    [models, trimmed],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {RECOMMENDED.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            title={r.hint}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
              value === r.id
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-muted/30 hover:bg-accent",
            )}
          >
            {value === r.id && <Check className="h-3 w-3" />}
            {r.id}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <Label htmlFor={inputId ?? "or-model"}>Model</Label>
        <Input
          id={inputId ?? "or-model"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="openai/gpt-4o-mini atau pilih dari rekomendasi"
          list={datalistId}
          autoComplete="off"
          spellCheck={false}
        />
        <datalist id={datalistId}>
          {(models ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </datalist>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Memuat daftar OpenRouter…
              </>
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : models ? (
              <>
                {models.length} model tersedia.{" "}
                {trimmed && (
                  <span className={isKnown ? "text-emerald-500" : "text-amber-500"}>
                    {isKnown ? "✓ Slug valid" : "⚠ Slug tidak ada di daftar"}
                  </span>
                )}
              </>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 hover:text-foreground"
            aria-label="Refresh daftar model"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {matchedModel && (
          <p className="text-[11px] text-muted-foreground">
            <strong>{matchedModel.name}</strong> · prompt $
            {matchedModel.promptUsd.toFixed(2)}/M · completion $
            {matchedModel.completionUsd.toFixed(2)}/M · konteks{" "}
            {matchedModel.context.toLocaleString("id-ID")} token
          </p>
        )}
      </div>
    </div>
  );
}
