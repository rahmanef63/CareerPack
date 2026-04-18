"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, ExternalLink, Wand2, Trash2 } from "lucide-react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface ProviderOption {
  id: string;
  label: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  docsUrl?: string;
}

type FormState = {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
};

const EMPTY_FORM: FormState = {
  provider: "openai",
  model: "",
  apiKey: "",
  baseUrl: "",
  enabled: true,
};

export function AISettingsPanel() {
  const providers = useQuery(api.aiSettings.listProviders) as ProviderOption[] | undefined;
  const current = useQuery(api.aiSettings.getMine);
  const save = useMutation(api.aiSettings.setMine);
  const clear = useMutation(api.aiSettings.clearMine);
  const test = useAction(api.ai.testConnection);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const selectedSpec = useMemo(
    () => providers?.find((p) => p.id === form.provider),
    [providers, form.provider]
  );

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
    } else {
      const openai = providers.find((p) => p.id === "openai") ?? providers[0];
      setForm({
        provider: openai?.id ?? "openai",
        model: openai?.defaultModel ?? "",
        apiKey: "",
        baseUrl: "",
        enabled: true,
      });
    }
    setDirty(false);
  }, [providers, current]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const onProviderChange = (next: string) => {
    const spec = providers?.find((p) => p.id === next);
    setForm((prev) => ({
      ...prev,
      provider: next,
      model: spec?.defaultModel ?? "",
      baseUrl: next === "custom" ? prev.baseUrl : "",
    }));
    setDirty(true);
  };

  const onSave = async () => {
    if (!form.apiKey.trim() && !current?.hasKey) {
      toast.error("API key belum diisi");
      return;
    }
    setSaving(true);
    try {
      await save({
        provider: form.provider,
        model: form.model.trim(),
        apiKey: form.apiKey.trim(),
        baseUrl: form.baseUrl.trim() || undefined,
        enabled: form.enabled,
      });
      toast.success("Setelan AI tersimpan");
      setForm((prev) => ({ ...prev, apiKey: "" }));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal simpan");
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    try {
      const res = await test({});
      toast.success(`Koneksi OK: ${res.reply || "balas kosong"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tes gagal");
    } finally {
      setTesting(false);
    }
  };

  const onClear = async () => {
    if (!confirm("Hapus konfigurasi AI kustom? Akan kembali ke default bawaan.")) return;
    try {
      await clear({});
      toast.success("Konfigurasi AI dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal hapus");
    }
  };

  const loading = providers === undefined || current === undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-career-600" /> Setelan AI
        </h1>
        <p className="text-sm text-muted-foreground">
          Pakai model AI sendiri (OpenRouter, OpenAI, Gemini, Groq, Grok, GLM, DeepSeek, Moonshot, Mistral, atau endpoint kustom OpenAI-compat). Kalau kosong, fitur AI pakai default sistem.
        </p>
      </header>

      <Alert>
        <AlertDescription className="text-xs">
          API key disimpan di backend Convex Anda. Jangan share akun dengan orang lain — kunci bisa dipakai sepanjang akun aktif.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provider & Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={form.provider} onValueChange={onProviderChange} disabled={loading}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Pilih provider" />
              </SelectTrigger>
              <SelectContent>
                {(providers ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpec?.docsUrl && (
              <a
                href={selectedSpec.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-career-600 inline-flex items-center gap-1 hover:underline"
              >
                Dapatkan API key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            {selectedSpec && selectedSpec.models.length > 0 ? (
              <div className="flex gap-2">
                <Select
                  value={selectedSpec.models.includes(form.model) ? form.model : ""}
                  onValueChange={(v) => update("model", v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih model umum" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSpec.models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <Input
              id="model"
              value={form.model}
              onChange={(e) => update("model", e.target.value)}
              placeholder={selectedSpec?.defaultModel || "mis. gpt-4o-mini"}
            />
            <p className="text-xs text-muted-foreground">
              Ketik bebas kalau model tidak ada di daftar.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                value={form.apiKey}
                onChange={(e) => update("apiKey", e.target.value)}
                placeholder={current?.hasKey ? `Tersimpan: ${current.keyPreview}` : "sk-..."}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showKey ? "Sembunyikan key" : "Tampilkan key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {current?.hasKey && (
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk pakai key yang sudah tersimpan.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              Base URL {form.provider !== "custom" && <span className="text-muted-foreground">(opsional override)</span>}
            </Label>
            <Input
              id="baseUrl"
              value={form.baseUrl}
              onChange={(e) => update("baseUrl", e.target.value)}
              placeholder={selectedSpec?.baseUrl || "https://.../v1"}
            />
            <p className="text-xs text-muted-foreground">
              Default:{" "}
              <code className="text-[11px]">{selectedSpec?.baseUrl || "-"}</code>
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="enabled" className="text-sm font-medium">
                Aktifkan AI kustom
              </Label>
              <p className="text-xs text-muted-foreground">
                Kalau off, semua fitur AI pakai default sistem.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={form.enabled}
              onCheckedChange={(v) => update("enabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        {current && (
          <Button variant="outline" onClick={onClear} disabled={saving}>
            <Trash2 className="w-4 h-4 mr-2" /> Hapus
          </Button>
        )}
        <Button variant="outline" onClick={onTest} disabled={testing || !current?.enabled}>
          <Wand2 className="w-4 h-4 mr-2" />
          {testing ? "Menguji…" : "Tes Koneksi"}
        </Button>
        <Button onClick={onSave} disabled={saving || (!dirty && !current)}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
