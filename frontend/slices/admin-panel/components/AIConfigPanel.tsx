"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  Server,
  Settings2,
  Wrench,
} from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  ResponsiveAlertDialog,
  ResponsiveAlertDialogAction,
  ResponsiveAlertDialogCancel,
  ResponsiveAlertDialogContent,
  ResponsiveAlertDialogDescription,
  ResponsiveAlertDialogFooter,
  ResponsiveAlertDialogHeader,
  ResponsiveAlertDialogTitle,
  ResponsiveAlertDialogTrigger,
} from "@/shared/components/ui/responsive-alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { OpenRouterModelPicker } from "./OpenRouterModelPicker";
import { UserModelOverrideSection } from "./UserModelOverrideSection";
import { AISkillsPanel } from "./AISkillsPanel";
import { AIToolsPanel } from "./AIToolsPanel";

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
  provider: "openrouter",
  model: "openai/gpt-4o-mini",
  apiKey: "",
  baseUrl: "",
  enabled: true,
};

/**
 * System-wide AI fallback. Resolution order is per-user setting →
 * this admin global → env defaults. Set this once with an OpenRouter
 * key and every user who hasn't pasted their own key gets routed here.
 */
export function AIConfigPanel() {
  const providers = useQuery(api.ai.queries.listAIProviders) as ProviderOption[] | undefined;
  const current = useQuery(api.ai.queries.getGlobalAISettings);
  const save = useMutation(api.ai.mutations.setGlobalAISettings);
  const clear = useMutation(api.ai.mutations.clearGlobalAISettings);
  const test = useAction(api.ai.actions.testConnection);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dirty, setDirty] = useState(false);

  const selectedSpec = useMemo(
    () => providers?.find((p) => p.id === form.provider),
    [providers, form.provider],
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
      const openrouter = providers.find((p) => p.id === "openrouter") ?? providers[0];
      setForm({
        provider: openrouter?.id ?? "openrouter",
        model: openrouter?.defaultModel ?? "openai/gpt-4o-mini",
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
      notify.validation("API key belum diisi");
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
      notify.success("Konfigurasi AI global tersimpan");
      setForm((prev) => ({ ...prev, apiKey: "" }));
      setDirty(false);
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan konfigurasi global");
    } finally {
      setSaving(false);
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

  const onClear = async () => {
    try {
      await clear({});
      notify.success("Konfigurasi global dihapus");
    } catch (err) {
      notify.fromError(err, "Gagal menghapus konfigurasi");
    }
  };

  const loading = providers === undefined || current === undefined;
  const aiEnabled = form.enabled;

  return (
    <Tabs defaultValue="config" className="w-full">
      <TabsList variant="pills">
        <TabsTrigger value="config">
          <Settings2 className="w-3.5 h-3.5" />
          Konfigurasi
        </TabsTrigger>
        <TabsTrigger value="skills">
          <Sparkles className="w-3.5 h-3.5" />
          Skills
        </TabsTrigger>
        <TabsTrigger value="tools">
          <Wrench className="w-3.5 h-3.5" />
          Tools
        </TabsTrigger>
      </TabsList>

      <TabsContent value="config" className="mt-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-brand" />
            AI Default Sistem
          </CardTitle>
          <CardDescription>
            Resolusi: <strong>per-user setting</strong> → <strong>global ini</strong> → env default. Set OpenRouter key sekali, semua user pakai
            tanpa harus paste API key sendiri.
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert className="border-warning/40 bg-warning/10">
        <ShieldAlert className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Kunci ini dipakai semua user</AlertTitle>
        <AlertDescription className="text-xs text-warning/90">
          API key di sini di-share oleh semua user yang belum punya konfigurasi
          AI sendiri. Pastikan provider quota cukup atau set rate-limit di
          dashboard provider. Aktifkan untuk start, nonaktifkan untuk fallback ke env default.
        </AlertDescription>
      </Alert>

      <Card className={cn(!aiEnabled && "opacity-60")}>
        <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Provider &amp; Model
            </CardTitle>
            {current && (
              <p className="text-xs text-muted-foreground mt-1">
                Terakhir diupdate {new Date(current.updatedAt).toLocaleString("id-ID")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="g-enabled" className="text-xs text-muted-foreground">
              Aktifkan
            </Label>
            <Switch
              id="g-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => update("enabled", v)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="g-provider">Provider</Label>
            <Select value={form.provider} onValueChange={onProviderChange} disabled={loading}>
              <SelectTrigger id="g-provider">
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
                className="text-xs text-brand inline-flex items-center gap-1 hover:underline"
              >
                Dapatkan API key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {form.provider === "openrouter" ? (
            <OpenRouterModelPicker
              value={form.model}
              onChange={(v) => update("model", v)}
              inputId="g-model"
            />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="g-model">Model</Label>
              {selectedSpec && selectedSpec.models.length > 0 && (
                <Select
                  value={selectedSpec.models.includes(form.model) ? form.model : ""}
                  onValueChange={(v) => update("model", v)}
                >
                  <SelectTrigger>
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
              )}
              <Input
                id="g-model"
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder={selectedSpec?.defaultModel || "mis. openai/gpt-4o-mini"}
              />
              <p className="text-xs text-muted-foreground">
                Ketik bebas kalau model tidak ada di daftar.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="g-apiKey">API Key</Label>
            <div className="relative">
              <Input
                id="g-apiKey"
                type={showKey ? "text" : "password"}
                value={form.apiKey}
                onChange={(e) => update("apiKey", e.target.value)}
                placeholder={current?.hasKey ? `Tersimpan: ${current.keyPreview}` : "sk-or-..."}
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
            <Label htmlFor="g-baseUrl">
              Base URL{" "}
              {form.provider !== "custom" && (
                <span className="text-muted-foreground">(opsional override)</span>
              )}
            </Label>
            <Input
              id="g-baseUrl"
              value={form.baseUrl}
              onChange={(e) => update("baseUrl", e.target.value)}
              placeholder={selectedSpec?.baseUrl || "https://.../v1"}
            />
            <p className="text-xs text-muted-foreground">
              Default: <code className="text-[11px]">{selectedSpec?.baseUrl || "-"}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 justify-end">
        {current && (
          <ResponsiveAlertDialog>
            <ResponsiveAlertDialogTrigger asChild>
              <Button variant="outline" disabled={saving}>
                <Trash2 className="w-4 h-4 mr-2" /> Hapus
              </Button>
            </ResponsiveAlertDialogTrigger>
            <ResponsiveAlertDialogContent>
              <ResponsiveAlertDialogHeader>
                <ResponsiveAlertDialogTitle>Hapus konfigurasi global?</ResponsiveAlertDialogTitle>
                <ResponsiveAlertDialogDescription>
                  Semua user yang belum punya AI key sendiri akan kembali ke env default.
                </ResponsiveAlertDialogDescription>
              </ResponsiveAlertDialogHeader>
              <ResponsiveAlertDialogFooter>
                <ResponsiveAlertDialogCancel>Batal</ResponsiveAlertDialogCancel>
                <ResponsiveAlertDialogAction variant="destructive" onClick={onClear}>
                  Ya, hapus
                </ResponsiveAlertDialogAction>
              </ResponsiveAlertDialogFooter>
            </ResponsiveAlertDialogContent>
          </ResponsiveAlertDialog>
        )}
        <Button variant="outline" onClick={onTest} disabled={testing || !current?.enabled}>
          <Wand2 className="w-4 h-4 mr-2" />
          {testing ? "Menguji…" : "Tes Koneksi"}
        </Button>
        <Button onClick={onSave} disabled={saving || (!dirty && !current)}>
          {saving ? "Menyimpan…" : "Simpan"}
        </Button>
      </div>

      <UserModelOverrideSection
        globalProvider={current?.provider ?? null}
        globalEnabled={!!current?.enabled}
      />
      </TabsContent>

      <TabsContent value="skills" className="mt-4">
        <AISkillsPanel />
      </TabsContent>

      <TabsContent value="tools" className="mt-4">
        <AIToolsPanel />
      </TabsContent>
    </Tabs>
  );
}
