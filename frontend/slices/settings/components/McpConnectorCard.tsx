"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plug, Trash2 } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { CodeBlock } from "@/shared/components/ui/copy-button";
import { notify } from "@/shared/lib/notify";
import { convexHttpUrl } from "@/shared/lib/env";

/**
 * The MCP connector surface: what to paste into ChatGPT/Claude, and the list
 * of connections this account has granted — with the only way to cut one off.
 *
 * The revoke half is the reason this exists. Access tokens live a year, and
 * until now the sole way to stop one was an operator editing `revokedAt` by
 * hand. A connector a user can create but not withdraw is not a connector,
 * it is a key handed over permanently.
 *
 * Every field below is a value someone retypes into another app's form, which
 * is exactly where a typo costs twenty minutes of "MCP server does not
 * implement OAuth" — hence CodeBlock, which carries its own copy button,
 * rather than selectable text.
 *
 * Nothing here is hardcoded to a deployment: the MCP origin is derived from
 * NEXT_PUBLIC_CONVEX_URL (the SITE origin — the CLOUD one 404s on /mcp) and
 * the OAuth endpoints from wherever this page is being served.
 */
export function McpConnectorCard() {
  const tokens = useQuery(api.mcp.oauth.listMyTokens);
  const revoke = useMutation(api.mcp.oauth.revokeMyToken);
  const [busy, setBusy] = useState<string | null>(null);

  // window is unavailable during SSR; the fields render once mounted, which is
  // fine — this card is below the fold of a settings tab, not a landing page.
  const appOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const fields = useMemo(
    () => [
      { label: "MCP Server URL", value: convexHttpUrl("/mcp") },
      { label: "Resource", value: convexHttpUrl("/mcp") },
      { label: "Auth URL", value: `${appOrigin}/oauth/authorize` },
      { label: "Token URL", value: `${appOrigin}/api/oauth/token` },
      { label: "Client ID", value: "chatgpt-careerpack" },
    ],
    [appOrigin],
  );

  const onRevoke = async (id: string) => {
    setBusy(id);
    try {
      await revoke({ tokenId: id as never });
      notify.success("Koneksi dicabut");
    } catch (err) {
      notify.fromError(err, "Gagal mencabut koneksi");
    } finally {
      setBusy(null);
    }
  };

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plug className="w-4 h-4 text-brand" />
          Koneksi MCP
        </CardTitle>
        <CardDescription>
          Sambungkan ChatGPT, Claude, atau Cursor supaya bisa membaca dan mengubah
          data CareerPack Anda lewat percakapan. Isi form connector di aplikasi itu
          dengan nilai di bawah — Client Secret dikosongkan, dan metode auth-nya
          &quot;none&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              <CodeBlock value={f.value} label={`Salin ${f.label}`} />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Koneksi aktif</p>
          {tokens === undefined ? (
            <p className="text-sm text-muted-foreground">Memuat…</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada aplikasi yang tersambung.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {tokens.map((t) => {
                // Expiry is checked server-side on every request, so a row past
                // its date is already dead — the badge just stops the user
                // hunting for a revoke button they do not need.
                const expired = t.expiresAt < Date.now();
                const dead = t.revokedAt !== null || expired;
                return (
                  <li key={t.id} className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.label ?? t.clientId}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {t.preview}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dibuat {fmt(t.createdAt)} · berlaku sampai {fmt(t.expiresAt)}
                      </p>
                    </div>
                    {t.revokedAt !== null ? (
                      <Badge variant="outline" className="shrink-0">Dicabut</Badge>
                    ) : expired ? (
                      <Badge variant="outline" className="shrink-0">Kedaluwarsa</Badge>
                    ) : (
                      <Badge className="shrink-0 bg-success/15 text-success-text">Aktif</Badge>
                    )}
                    {!dead && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-destructive"
                        disabled={busy === t.id}
                        onClick={() => onRevoke(t.id)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        {busy === t.id ? "Mencabut…" : "Cabut"}
                      </Button>
                    )}
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
