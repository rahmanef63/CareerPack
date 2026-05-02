"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Trash2, UserCog } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { OpenRouterModelPicker } from "./OpenRouterModelPicker";

interface UserModelOverrideSectionProps {
  globalProvider: string | null;
  globalEnabled: boolean;
}

/**
 * Per-user MODEL override. Inherits provider + apiKey + baseUrl from
 * the global config above; just lets admin route specific users to a
 * different model on the shared key. Only meaningful when global is
 * enabled and provider is OpenRouter (other providers' free-text
 * model field works the same way but has no live catalog).
 */
export function UserModelOverrideSection({
  globalProvider,
  globalEnabled,
}: UserModelOverrideSectionProps) {
  const overrides = useQuery(api.ai.queries.listAIOverrides);
  const setOverride = useMutation(api.ai.mutations.setUserAIModelOverride);
  const clearOverride = useMutation(api.ai.mutations.clearUserAIModelOverride);

  const [email, setEmail] = useState("");
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedModel = model.trim();
    if (!trimmedEmail) {
      notify.validation("Email wajib");
      return;
    }
    if (!trimmedModel) {
      notify.validation("Model wajib");
      return;
    }
    setSaving(true);
    try {
      await setOverride({ email: trimmedEmail, model: trimmedModel });
      notify.success(`Override tersimpan untuk ${trimmedEmail}`);
      setEmail("");
    } catch (err) {
      notify.fromError(err, "Gagal menyimpan override");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async (userId: Id<"users">, label: string) => {
    try {
      await clearOverride({ userId });
      notify.success(`Override untuk ${label} dihapus`);
    } catch (err) {
      notify.fromError(err, "Gagal hapus override");
    }
  };

  const showOpenRouterPicker = globalProvider === "openrouter";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCog className="w-4 h-4 text-brand" />
          Override Model Per-User
        </CardTitle>
        <CardDescription>
          Pilih model spesifik untuk user tertentu. Inherits provider + API
          key dari config global di atas — cocok kalau admin mau routing user
          premium ke model bagus, user lain ke model murah, semua via satu
          OpenRouter key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!globalEnabled && (
          <Alert>
            <AlertDescription className="text-xs">
              Aktifkan dulu config AI global di atas. Tanpa global, override
              ini diabaikan dan user fallback ke env default.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="ov-email">Email user</Label>
            <Input
              id="ov-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="sm:self-end">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan…
              </>
            ) : (
              "Set Override"
            )}
          </Button>
        </div>

        {showOpenRouterPicker ? (
          <OpenRouterModelPicker value={model} onChange={setModel} inputId="ov-model" />
        ) : (
          <div className="space-y-2">
            <Label htmlFor="ov-model">Model</Label>
            <Input
              id="ov-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="mis. gpt-4o-mini"
            />
            <p className="text-xs text-muted-foreground">
              Pakai slug yang valid untuk provider {globalProvider ?? "global"}.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Override aktif
          </h4>
          {overrides === undefined ? (
            <p className="text-xs text-muted-foreground">Memuat…</p>
          ) : overrides.length === 0 ? (
            <p className="text-xs text-muted-foreground">Belum ada override.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {overrides.map((o) => {
                const label = o.email ?? String(o.userId);
                return (
                  <li
                    key={o.userId}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{label}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {o.model}
                        </Badge>
                        <span>
                          diset {new Date(o.updatedAt).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleClear(o.userId, label)}
                      aria-label={`Hapus override untuk ${label}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
