"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { Sparkles, Trash2, Wand2 } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { CodeBlock } from "@/shared/components/ui/copy-button";
import { BaseUrlField, ConfirmDestructiveButton, ProviderSelect } from "./fields";
import { ModelPicker } from "./ModelPicker";
import { ProviderAuthSection } from "./ProviderAuthSection";
import { providerAffordances, type ProviderOption, type StoredAISettings } from "./providerAuth";

export interface AIProviderFormProps {
  /**
   * `"user"` reads/writes the caller's own `aiSettings`; `"global"` the
   * admin-managed `globalAISettings` (requires admin). Nothing else differs —
   * same fields, same order, same widgets.
   */
  scope: "user" | "global";
  /** Per-user OAuth round-trip came back with `?ai=error`. */
  connectFailed?: boolean;
}

/**
 * The ONE AI provider form. Three near-identical implementations preceded it
 * (per-user panel, admin global panel, admin per-user override), which is how
 * the model picker ended up rendered twice inside a single admin tab.
 *
 * The order is the feature: provider → how you authenticate THAT provider →
 * model → advanced. Anything a field can say for itself is helper text under
 * that field, not an explainer card stacked above the form.
 */
const COPY = {
  user: {
    title: "AI Pribadi",
    description:
      "Pakai kunci AI Anda sendiri. Selama kosong, fitur AI memakai default sistem.",
    saved: "Setelan AI tersimpan",
    saveFailed: "Gagal menyimpan setelan AI",
    cleared: "Konfigurasi AI dihapus",
    clearTitle: "Hapus konfigurasi AI?",
    clearBody:
      "Provider, model, API key, dan base URL yang tersimpan akan dihapus. Fitur AI kembali memakai default sistem.",
  },
  global: {
    title: "AI Default Sistem",
    description:
      "Dipakai semua user yang belum punya kunci sendiri. Urutan: setelan user → global ini → env default.",
    saved: "Konfigurasi AI global tersimpan",
    saveFailed: "Gagal menyimpan konfigurasi global",
    cleared: "Konfigurasi global dihapus",
    clearTitle: "Hapus konfigurasi global?",
    clearBody:
      "Semua user yang belum punya AI key sendiri akan kembali ke env default.",
  },
} as const;

type FormState = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
};

export function AIProviderForm({ scope, connectFailed }: AIProviderFormProps) {
  const copy = COPY[scope];
  const idPrefix = scope === "global" ? "g-ai" : "u-ai";

  const providers = useQuery(api.ai.queries.listAIProviders) as ProviderOption[] | undefined;
  // Both queries return the same shape; "skip" keeps the admin-only one from
  // firing (and throwing) for a normal user, and keeps the scopes from paying
  // for each other's subscriptions.
  const mine = useQuery(api.ai.queries.getMyAISettings, scope === "user" ? {} : "skip");
  const shared = useQuery(api.ai.queries.getGlobalAISettings, scope === "global" ? {} : "skip");
  const current = (scope === "global" ? shared : mine) as StoredAISettings | null | undefined;

  const saveMine = useMutation(api.ai.mutations.setMyAISettings);
  const saveShared = useMutation(api.ai.mutations.setGlobalAISettings);
  const clearMine = useMutation(api.ai.mutations.clearMyAISettings);
  const clearShared = useMutation(api.ai.mutations.clearGlobalAISettings);
  const test = useAction(api.ai.actions.testConnection);

  const [form, setForm] = useState<FormState>({
    // OpenRouter first because it is the only provider with a login flow — the
    // path that needs no key pasted at all should be the one already selected.
    provider: "openrouter",
    model: "",
    apiKey: "",
    baseUrl: "",
    enabled: true,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const spec = useMemo(
    () => providers?.find((p) => p.id === form.provider),
    [providers, form.provider],
  );
  const affordances = providerAffordances(spec);

  useEffect(() => {
    if (!providers) return;
    if (current) {
      setForm({
        provider: current.provider,
        model: current.model,
        apiKey: "",
        baseUrl: current.baseUrl ?? "",
        enabled: current.enabled,
      });
    } else if (current === null) {
      const fallback = providers.find((p) => p.id === "openrouter") ?? providers[0];
      setForm((prev) => ({
        ...prev,
        provider: fallback?.id ?? prev.provider,
        model: fallback?.defaultModel ?? "",
      }));
    }
    setDirty(false);
  }, [providers, current]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const onProviderChange = (next: string) => {
    const nextSpec = providers?.find((p) => p.id === next);
    setForm((prev) => ({
      ...prev,
      provider: next,
      model: nextSpec?.defaultModel ?? "",
      // A pasted endpoint only means something for the provider it was typed
      // for; keep it only where the provider ships none of its own.
      baseUrl: nextSpec?.baseUrl ? "" : prev.baseUrl,
    }));
    setDirty(true);
  };

  const onSave = async () => {
    if (affordances.apiKey && !form.apiKey.trim() && !current?.hasKey) {
      notify.validation("API key belum diisi");
      return;
    }
    if (affordances.baseUrl === "required" && !form.baseUrl.trim()) {
      notify.validation("Base URL wajib untuk provider ini");
      return;
    }
    const payload = {
      provider: form.provider,
      model: form.model.trim(),
      apiKey: form.apiKey.trim(),
      baseUrl: form.baseUrl.trim() || undefined,
      enabled: form.enabled,
    };
    setSaving(true);
    try {
      if (scope === "global") await saveShared(payload);
      else await saveMine(payload);
      notify.success(copy.saved);
      setForm((prev) => ({ ...prev, apiKey: "" }));
      setDirty(false);
    } catch (err) {
      notify.fromError(err, copy.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const onClear = async () => {
    try {
      if (scope === "global") await clearShared({});
      else await clearMine({});
      notify.success(copy.cleared);
    } catch (err) {
      notify.fromError(err, "Gagal menghapus konfigurasi");
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const res = await test({});
      notify.success(`Koneksi OK: ${res.reply || "balas kosong"}`);
    } catch (err) {
      notify.fromError(err, "Tes koneksi gagal");
    } finally {
      setTesting(false);
    }
  };

  const loading = providers === undefined || current === undefined;

  return (
    <div className="space-y-4">
      <Card className={cn(!form.enabled && "opacity-60")}>
        <CardHeader className="pb-3 flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Label htmlFor={`${idPrefix}-enabled`} className="text-xs text-muted-foreground">
              Aktifkan
            </Label>
            <Switch
              id={`${idPrefix}-enabled`}
              checked={form.enabled}
              onCheckedChange={(v) => update("enabled", v)}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <ProviderSelect
            id={`${idPrefix}-provider`}
            providers={providers ?? []}
            value={form.provider}
            onChange={onProviderChange}
            disabled={loading}
          />

          <ProviderAuthSection
            spec={spec}
            scope={scope}
            stored={current ?? null}
            storedLabel={providers?.find((p) => p.id === current?.provider)?.label ?? null}
            apiKey={form.apiKey}
            onApiKeyChange={(v) => update("apiKey", v)}
            onDisconnect={onClear}
            connectFailed={connectFailed}
            idPrefix={idPrefix}
          />

          {affordances.baseUrl === "required" && (
            // Not an "advanced override" here: without an endpoint this
            // provider has nothing to call, so it belongs with the credential.
            <BaseUrlField
              id={`${idPrefix}-baseUrl`}
              value={form.baseUrl}
              onChange={(v) => update("baseUrl", v)}
              placeholder="https://.../v1"
              required
            />
          )}

          <ModelPicker
            spec={spec}
            value={form.model}
            onChange={(v) => update("model", v)}
            inputId={`${idPrefix}-model`}
          />

          {affordances.baseUrl === "optional" && spec && (
            <details className="rounded-md border border-border/60 px-3 py-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">Lanjutan</summary>
              <div className="mt-3 space-y-3">
                <BaseUrlField
                  id={`${idPrefix}-baseUrl`}
                  value={form.baseUrl}
                  onChange={(v) => update("baseUrl", v)}
                  placeholder={spec.baseUrl}
                  required={false}
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Kosongkan untuk memakai endpoint bawaan {spec.label}:
                  </p>
                  <CodeBlock value={spec.baseUrl} label={`Salin base URL ${spec.label}`} />
                </div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {current && (
          <p className="mr-auto text-xs text-muted-foreground">
            Tersimpan {new Date(current.updatedAt).toLocaleString("id-ID")}
          </p>
        )}
        {current && (
          <ConfirmDestructiveButton
            label="Hapus"
            icon={<Trash2 />}
            title={copy.clearTitle}
            description={copy.clearBody}
            confirmLabel="Ya, hapus"
            onConfirm={onClear}
            disabled={saving}
          />
        )}
        <Button variant="outline" onClick={() => void onTest()} disabled={testing || !current?.enabled}>
          <Wand2 />
          {testing ? "Menguji…" : "Tes Koneksi"}
        </Button>
        <Button onClick={() => void onSave()} disabled={saving || !dirty}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
