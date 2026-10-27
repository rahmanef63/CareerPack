"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { CheckCircle2, Loader2, PlugZap } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

/** Models fetched from the endpoint the user just proved works. */
export interface VerifiedEndpoint {
  /** The base URL the list belongs to — a stale list must not answer for a new one. */
  baseUrl: string;
  models: Array<{ id: string; name: string }>;
}

export interface CustomModelFieldProps {
  id: string;
  baseUrl: string;
  apiKey: string;
  hasStoredKey: boolean;
  value: string;
  onChange: (model: string) => void;
  verified: VerifiedEndpoint | null;
  onVerified: (v: VerifiedEndpoint | null) => void;
}

/**
 * Model picker for the `custom` provider — where a catalog is not a given.
 *
 * Deliberately two-step: "Sambungkan" proves the URL and key by reading
 * `/models`, and only then is there a dropdown to pick from. Every
 * OpenAI-compatible gateway serves that route, so it doubles as the
 * reachability + auth check the form previously had no way to run before
 * asking for a model slug it could not validate.
 *
 * Free text is still allowed afterwards: some gateways omit `/models` or hide
 * entries from it, and a picker that refuses an unknown-but-working slug is
 * worse than no picker.
 */
export function CustomModelField({
  id,
  baseUrl,
  apiKey,
  hasStoredKey,
  value,
  onChange,
  verified,
  onVerified,
}: CustomModelFieldProps) {
  const verify = useAction(api.ai.actions.verifyCustomEndpoint);
  const [checking, setChecking] = useState(false);

  // A list fetched from a different endpoint says nothing about this one.
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  const active = verified && verified.baseUrl === trimmed ? verified : null;
  const canVerify = trimmed.length > 0 && (apiKey.trim().length > 0 || hasStoredKey);

  const onVerify = async () => {
    setChecking(true);
    try {
      const { models } = await verify({ baseUrl: trimmed, apiKey: apiKey.trim() });
      onVerified({ baseUrl: trimmed, models });
      // Preselect the only sensible default: the first model, unless the user
      // already typed one that this endpoint actually serves.
      if (!value.trim() || !models.some((m) => m.id === value.trim())) {
        onChange(models[0].id);
      }
      notify.success(`Tersambung — ${models.length} model tersedia`);
    } catch (err) {
      onVerified(null);
      notify.fromError(err, "Gagal menyambung endpoint");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>Model</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void onVerify()}
          disabled={checking || !canVerify}
          title={canVerify ? undefined : "Isi Base URL dan API key dulu"}
        >
          {checking ? <Loader2 className="animate-spin" /> : <PlugZap />}
          {checking ? "Menyambung…" : active ? "Sambungkan ulang" : "Sambungkan"}
        </Button>
      </div>

      {active && active.models.length > 0 ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Pilih model" />
          </SelectTrigger>
          <SelectContent>
            {active.models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="mis. gpt-4o-mini"
          autoComplete="off"
          spellCheck={false}
        />
      )}

      <p className="text-xs text-muted-foreground inline-flex items-start gap-1">
        {active ? (
          <>
            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-success-text" />
            {active.models.length} model dari {active.baseUrl}. Ketik bebas kalau model Anda tidak
            ada di daftar.
          </>
        ) : (
          "Isi Base URL + API key, lalu Sambungkan. Daftar model diambil dari endpoint itu sendiri."
        )}
      </p>
    </div>
  );
}
