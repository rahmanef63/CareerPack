"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Trash2, UserCog } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { notify } from "@/shared/lib/notify";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { CopyButton } from "@/shared/components/ui/copy-button";
import { ModelPicker } from "@/shared/components/ai-settings/ModelPicker";
import type { ProviderOption } from "@/shared/components/ai-settings/providerAuth";

/**
 * Per-user MODEL override. Inherits provider + apiKey + baseUrl from the global
 * config above; just routes specific users to a different model on the shared
 * key.
 *
 * Reads the global row itself instead of taking it as props: it needs the same
 * two queries the form above already subscribes to (Convex dedupes them), and
 * props would have made the parent hold state for a section it only renders.
 */
export function UserModelOverrideSection() {
  const providers = useQuery(api.ai.queries.listAIProviders) as ProviderOption[] | undefined;
  const global = useQuery(api.ai.queries.getGlobalAISettings);
  const overrides = useQuery(api.ai.queries.listAIOverrides);
  const setOverride = useMutation(api.ai.mutations.setUserAIModelOverride);
  const clearOverride = useMutation(api.ai.mutations.clearUserAIModelOverride);

  const [email, setEmail] = useState("");
  // No seeded slug: an override is only valid for whatever provider the global
  // row points at, and hardcoding one meant an OpenRouter slug sat prefilled
  // even when global was Anthropic. Chips + placeholder come from the spec.
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  // The override rides on the global provider's key, so the picker is fed that
  // provider's spec — chips, catalog and slug check all follow from it.
  const globalProvider = global?.provider;
  const spec = useMemo(
    () => providers?.find((p) => p.id === globalProvider),
    [providers, globalProvider],
  );

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <UserCog className="w-4 h-4 text-brand" />
          Override Model Per-User
        </CardTitle>
        <CardDescription>
          Model khusus untuk user tertentu, memakai provider dan kunci global di
          atas — misal user premium ke model bagus, sisanya ke model murah.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!global?.enabled && (
          <Alert>
            <AlertDescription className="text-xs">
              Aktifkan dulu konfigurasi AI global di atas. Tanpa global, override
              ini diabaikan dan user fallback ke env default.
            </AlertDescription>
          </Alert>
        )}

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

        <ModelPicker spec={spec} value={model} onChange={setModel} inputId="ov-model" />

        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin" /> Menyimpan…
              </>
            ) : (
              "Simpan Override"
            )}
          </Button>
        </div>

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
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {o.model}
                        </Badge>
                        <CopyButton
                          value={o.model}
                          label={`Salin slug model ${o.model}`}
                          size="sm"
                        />
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
