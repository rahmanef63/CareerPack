"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { Check, Loader2, RefreshCw } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/utils";
import { hasLiveCatalog, modelChips, slugStatus, type CatalogModel } from "./modelCatalog";
import type { ProviderOption } from "./providerAuth";

/**
 * The one model picker. It was built three times — twice inside the admin
 * panel alone (global config + per-user override), once more in the per-user
 * settings — so the chips, the free-text slug, the availability count, the
 * validity mark and the price line all drifted independently.
 *
 * Free text always wins: the catalog is a typo check, never a gate. Chips are
 * a shortcut for the common picks and the datalist carries the long tail, so
 * a provider with 300 models needs neither a chip wall nor a 300-row <Select>.
 */
export interface ModelPickerProps {
  spec?: ProviderOption;
  value: string;
  onChange: (model: string) => void;
  inputId: string;
}

export function ModelPicker({ spec, value, onChange, inputId }: ModelPickerProps) {
  const datalistId = `${inputId}-datalist`;
  const live = hasLiveCatalog(spec?.id);
  const fetchModels = useAction(api.ai.actions.listOpenRouterModels);
  const [catalog, setCatalog] = useState<CatalogModel[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard against unmount + out-of-order responses: each load takes a sequence
  // number and only the newest one on a still-mounted picker writes state, so a
  // slow first fetch cannot clobber a fresher "Muat ulang".
  const mounted = useRef(true);
  const seqRef = useRef(0);
  useEffect(() => () => { mounted.current = false; }, []);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = (await fetchModels({})) as CatalogModel[];
      if (!mounted.current || seq !== seqRef.current) return;
      setCatalog(data);
    } catch (err) {
      if (!mounted.current || seq !== seqRef.current) return;
      setError(err instanceof Error ? err.message : "Gagal memuat daftar model");
    } finally {
      if (mounted.current && seq === seqRef.current) setLoading(false);
    }
  }, [fetchModels]);

  // At most one automatic fetch per mount. `listOpenRouterModels` runs through
  // `requireQuota`, so re-fetching every time the provider select bounces back
  // to OpenRouter would spend the user's 10/min AI budget on a dropdown.
  const autoLoaded = useRef(false);
  useEffect(() => {
    if (!live || autoLoaded.current) return;
    autoLoaded.current = true;
    void load();
  }, [live, load]);

  // Kept in state across a provider switch but only consulted while the
  // catalog belongs to the selected provider — otherwise "✓ Slug valid" would
  // be answered by some other provider's list.
  const active = live ? catalog : null;
  const chips = useMemo(() => modelChips(spec), [spec]);
  const status = slugStatus(value, active);
  const matched = useMemo(
    () => active?.find((m) => m.id === value.trim()) ?? null,
    [active, value],
  );
  // Long tail for the datalist: everything the provider list knows, plus the
  // live catalog when there is one. Free text still overrides both.
  const options = useMemo(() => {
    const ids = new Set(spec?.models ?? []);
    for (const m of active ?? []) ids.add(m.id);
    return [...ids];
  }, [spec, active]);

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Model</Label>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const selected = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onChange(c.id)}
                title={c.hint}
                aria-pressed={selected}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                  selected
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-muted/30 hover:bg-accent",
                )}
              >
                {selected && <Check className="h-3 w-3" />}
                {c.id}
              </button>
            );
          })}
        </div>
      )}

      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={spec?.defaultModel || "mis. gpt-4o-mini"}
        list={datalistId}
        autoComplete="off"
        spellCheck={false}
      />
      <datalist id={datalistId}>
        {options.map((id) => (
          <option key={id} value={id} />
        ))}
      </datalist>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          {live && loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Memuat daftar model…
            </>
          ) : live && error ? (
            <span className="text-destructive-text">{error}</span>
          ) : active ? (
            <>
              {active.length} model tersedia.{" "}
              {status !== "empty" && (
                <span className={status === "valid" ? "text-success-text" : "text-warning-text"}>
                  {status === "valid" ? "✓ Slug valid" : "⚠ Slug tidak ada di daftar"}
                </span>
              )}
            </>
          ) : (
            "Ketik bebas kalau model tidak ada di daftar."
          )}
        </span>
        {live && (
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Muat ulang
          </button>
        )}
      </div>

      {matched && (
        <p className="text-[11px] text-muted-foreground">
          <strong>{matched.name}</strong> · prompt ${matched.promptUsd.toFixed(2)}/M ·
          completion ${matched.completionUsd.toFixed(2)}/M · konteks{" "}
          {matched.context.toLocaleString("id-ID")} token
        </p>
      )}
    </div>
  );
}
