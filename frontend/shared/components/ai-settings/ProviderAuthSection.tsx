"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { CheckCircle2, TriangleAlert } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { notify } from "@/shared/lib/notify";
import { Button } from "@/shared/components/ui/button";
import { ApiKeyField, ConfirmDestructiveButton } from "./fields";
import { providerAffordances, type ProviderOption, type StoredAISettings } from "./providerAuth";

export interface ProviderAuthSectionProps {
  spec?: ProviderOption;
  /** Which settings row is being edited. Decides the caveats, not the widgets. */
  scope: "user" | "global";
  stored: StoredAISettings | null;
  /** Label of `stored.provider`, for the "you are replacing X" warning. */
  storedLabel?: string | null;
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  onDisconnect: () => void | Promise<void>;
  /** The OAuth callback came back with `?ai=error`. */
  connectFailed?: boolean;
  idPrefix: string;
}

/**
 * How you authenticate the provider you just picked — and nothing else.
 *
 * Sits directly under the provider select because "Masuk dengan OpenRouter"
 * means nothing to someone who has not chosen OpenRouter yet; it used to be
 * the FIRST card on the page. Every widget here comes from the provider's
 * `auth` descriptor, so no provider id is compared anywhere in this file.
 */
export function ProviderAuthSection({
  spec,
  scope,
  stored,
  storedLabel,
  apiKey,
  onApiKeyChange,
  onDisconnect,
  connectFailed = false,
  idPrefix,
}: ProviderAuthSectionProps) {
  const affordances = providerAffordances(spec);
  const startConnect = useMutation(api.ai.oauth.startOAuthConnect);
  const [connecting, setConnecting] = useState(false);

  // Back-button from the provider restores this page from bfcache with the DOM
  // intact, so without this the button reads "Mengalihkan…" forever for a user
  // who simply changed their mind on the consent screen.
  useEffect(() => {
    if (!connecting) return;
    const reset = () => setConnecting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, [connecting]);

  // OAuth writes the CALLER's own `aiSettings` row (see convex/ai/oauth.ts), so
  // offering it here for the system default would silently save to the admin's
  // personal settings instead — and tie everyone's AI to one person's account.
  const canConnect = affordances.oauth !== null && scope === "user";
  const connectedAt = stored?.hasKey && stored.provider === spec?.id ? stored.updatedAt : null;
  // The case users get burned by: there is ONE settings row, so connecting
  // replaces whatever provider is in it.
  const otherProvider = stored?.hasKey && stored.provider !== spec?.id ? stored.provider : null;

  const onConnect = async () => {
    if (!spec) return;
    setConnecting(true);
    try {
      const { url } = await startConnect({ provider: spec.id });
      // Deliberately not clearing `connecting`: navigation is already underway
      // and resetting would flash the button back to idle.
      window.location.href = url;
    } catch (err) {
      setConnecting(false);
      notify.fromError(err, "Gagal memulai penyambungan");
    }
  };

  return (
    <div className="space-y-3">
      {connectFailed && (
        <p className="text-xs text-warning-text inline-flex items-start gap-1">
          <TriangleAlert className="w-3 h-3 mt-0.5 shrink-0" />
          Penyambungan gagal — tidak ada kunci tersimpan. Coba lagi, atau tempel API key di bawah.
        </p>
      )}

      {canConnect && affordances.oauth && (
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">Login akun — cara tercepat</p>
              {connectedAt !== null ? (
                // Says "a key is stored", not "connected via OAuth": both paths
                // write the same field and the schema records no method.
                <p className="text-xs text-success-text inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Tersambung · disimpan {new Date(connectedAt).toLocaleString("id-ID")}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Kunci dibuat dan disimpan terenkripsi otomatis — tidak ada yang perlu disalin.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {connectedAt !== null && (
                <ConfirmDestructiveButton
                  size="sm"
                  label="Putuskan"
                  title={`Putuskan ${spec?.label}?`}
                  description={`Provider, model, dan kunci tersimpan dihapus dari akun Anda, dan fitur AI kembali memakai default sistem. Kunci di sisi ${spec?.label} tidak ikut dicabut — hapus sendiri di dashboard mereka kalau perlu.`}
                  confirmLabel="Ya, putuskan"
                  onConfirm={onDisconnect}
                />
              )}
              <Button size="sm" onClick={() => void onConnect()} disabled={connecting}>
                {connecting ? "Mengalihkan…" : affordances.oauth.label}
              </Button>
            </div>
          </div>

          {otherProvider && (
            <p className="text-xs text-warning-text inline-flex items-start gap-1">
              <TriangleAlert className="w-3 h-3 mt-0.5 shrink-0" />
              Sekarang memakai {storedLabel ?? otherProvider}. Menyambungkan mengganti provider
              sekaligus kunci yang tersimpan.
            </p>
          )}
        </div>
      )}

      {affordances.apiKey ? (
        <ApiKeyField
          id={`${idPrefix}-apiKey`}
          value={apiKey}
          onChange={onApiKeyChange}
          placeholder={stored?.hasKey ? `Tersimpan: ${stored.keyPreview}` : "sk-…"}
          docsUrl={affordances.apiKey.docsUrl}
          helper={
            <div className="space-y-1 text-xs text-muted-foreground">
              {stored?.hasKey && <p>Kosongkan untuk memakai kunci yang sudah tersimpan.</p>}
              {canConnect && (
                <p>Kunci login dan kunci tempel memakai slot yang sama — yang terakhir disimpan itu yang dipakai.</p>
              )}
              {scope === "global" ? (
                <p className="text-warning-text">
                  Dipakai semua user yang belum punya kunci sendiri — pastikan kuota provider cukup.
                </p>
              ) : (
                <p>Kunci ini mengakses akun provider atas nama Anda. Kami simpan terenkripsi; jangan tempel di chat publik.</p>
              )}
              {scope === "global" && affordances.oauth && (
                <p>
                  Login akun ada di{" "}
                  <Link href="/dashboard/settings" className="underline">
                    Setelan → AI
                  </Link>{" "}
                  untuk pemakaian pribadi — kuncinya atas nama satu orang, jadi ikut mati kalau
                  orang itu mencabutnya.
                </p>
              )}
            </div>
          }
        />
      ) : (
        <p className="text-xs text-warning-text">
          {spec?.label} tidak menyediakan API key untuk ditempel — pakai login akun di atas.
        </p>
      )}
    </div>
  );
}
