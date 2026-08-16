"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { KeyRound, Plug, Trash2 } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { CodeBlock } from "@/shared/components/ui/copy-button";
import { notify } from "@/shared/lib/notify";
import {
  VERDICT_HINT,
  buildGuides,
  connectorValues,
  type ConnectorValues,
  type GuideRow,
} from "./mcpConnectorGuide";

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
/** Warna vonis dipakai sebagai makna, bukan hiasan: biru = tindakan Anda,
 *  kuning = pilihan yang harus diambil, hijau = sudah beres, abu = jangan
 *  disentuh. Garis kiri membawa status yang sama tanpa perlu dibaca. */
const VERDICT_STYLE: Record<string, { stripe: string; badge: string }> = {
  salin: { stripe: "border-l-brand", badge: "border-brand/40 text-brand" },
  pilih: { stripe: "border-l-warning", badge: "border-warning/40 text-warning-text" },
  centang: { stripe: "border-l-warning", badge: "border-warning/40 text-warning-text" },
  otomatis: { stripe: "border-l-success", badge: "border-success/40 text-success-text" },
  kosongkan: { stripe: "border-l-border", badge: "border-border text-muted-foreground" },
};

function GuideRowView({ row, host }: { row: GuideRow; host: string }) {
  const style = VERDICT_STYLE[row.verdict] ?? VERDICT_STYLE.kosongkan!;
  return (
    <div
      className={`rounded-md border border-l-[3px] border-border ${style.stripe} p-2.5 ${
        row.verdict === "kosongkan" ? "opacity-75" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono text-xs font-semibold">{row.field}</code>
        <Badge
          variant="outline"
          className={`h-4 px-1.5 text-[10px] uppercase tracking-wide ${style.badge}`}
          title={VERDICT_HINT[row.verdict]}
        >
          {row.verdict}
        </Badge>
      </div>
      {row.value && (
        <div className="mt-1.5">
          <CodeBlock value={row.value} label={`Salin ${host} ${row.field}`} />
        </div>
      )}
      {row.note && <p className="mt-1.5 text-xs text-muted-foreground">{row.note}</p>}
    </div>
  );
}

export function McpConnectorCard() {
  const tokens = useQuery(api.mcp.oauth.listMyTokens);
  const revoke = useMutation(api.mcp.oauth.revokeMyToken);
  const [busy, setBusy] = useState<string | null>(null);

  // window is unavailable during SSR; the fields render once mounted, which is
  // fine — this card is below the fold of a settings tab, not a landing page.
  const appOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const values = useMemo(() => connectorValues(appOrigin), [appOrigin]);
  const guides = useMemo(() => buildGuides(values), [values]);

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
          data CareerPack Anda lewat percakapan. Pilih aplikasinya di bawah — tiap
          kolom sudah ditandai mana yang perlu Anda isi dan mana yang dibiarkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Alamat server MCP</p>
          <CodeBlock value={values.server} label="Salin alamat server MCP" />
        </div>

        <Tabs defaultValue={guides[0]!.id}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
            {guides.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="text-xs">
                {g.host}
              </TabsTrigger>
            ))}
          </TabsList>

          {guides.map((g) => {
            const rows = g.groups.flatMap((x) => x.rows);
            const mine = rows.filter(
              (r) => r.verdict !== "otomatis" && r.verdict !== "kosongkan",
            ).length;
            return (
              <TabsContent key={g.id} value={g.id} className="space-y-4 pt-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    <span className="mr-1.5 rounded border border-border px-1 py-px text-[10px] uppercase tracking-wide">
                      Di mana
                    </span>
                    {g.path}
                  </p>
                  <p className="text-sm text-muted-foreground">{g.lede}</p>
                  {/* Ringkasan sebelum detail: inti kartu ini adalah bahwa
                      sebagian besar kolom di form itu bukan urusan pengguna. */}
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-brand tabular-nums">{mine}</span> dari{" "}
                    {rows.length} kolom butuh Anda
                    {rows.length - mine > 0
                      ? ` — ${rows.length - mine} sisanya terisi sendiri atau dibiarkan kosong`
                      : ""}
                    .
                  </p>
                </div>

                {g.groups.map((grp) => (
                  <div key={grp.title} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {grp.title}
                    </p>
                    {grp.note && (
                      <p className="text-xs text-muted-foreground">{grp.note}</p>
                    )}
                    {grp.rows.map((row, i) => (
                      <GuideRowView key={`${row.field}-${i}`} row={row} host={g.host} />
                    ))}
                  </div>
                ))}

                {g.traps && g.traps.length > 0 && (
                  <div className="rounded-md border border-border bg-muted/40 p-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sebelum disimpan
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {g.traps.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        <ApiKeySection values={values} />

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

/**
 * API key — a client id + client secret pair.
 *
 * Two uses, and the second is the one people come here for:
 *
 *  1. A host that refuses to register itself — ChatGPT's "User-Defined OAuth
 *     Client". Rare, and DCR is better wherever it works: nothing to copy is
 *     nothing to leak.
 *  2. Software the user wrote. `grant_type=client_credentials` trades the pair
 *     for a bearer with no browser and no consent screen, which is the only
 *     way a script or cron job can read this account's data — a token from the
 *     interactive flow is never shown to its owner (see listMyTokens).
 *
 * The secret is shown ONCE, from the value still in memory at creation. Only
 * its sha256 is stored, so a surface that could show it again would be a
 * surface whose database holds it in the clear.
 */
function ApiKeySection({ values }: { values: ConnectorValues }) {
  const clients = useQuery(api.mcp.oauth.listMyClients);
  const createClient = useMutation(api.mcp.oauth.createMyClient);
  const revokeClient = useMutation(api.mcp.oauth.revokeMyClient);

  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [minted, setMinted] = useState<{ clientId: string; clientSecret: string } | null>(
    null,
  );

  const onCreate = async () => {
    if (!label.trim()) {
      notify.error("Beri label dulu supaya nanti bisa dibedakan");
      return;
    }
    setBusy(true);
    try {
      const res = await createClient({ label: label.trim() });
      setMinted({ clientId: res.clientId, clientSecret: res.clientSecret });
      setLabel("");
    } catch (err) {
      notify.fromError(err, "Gagal membuat API key");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await revokeClient({ clientRowId: id as never });
      notify.success("API key dicabut");
    } catch (err) {
      notify.fromError(err, "Gagal mencabut API key");
    } finally {
      setRevoking(null);
    }
  };

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">API key (Client ID + Secret)</p>
          <p className="text-xs text-muted-foreground">
            Untuk <strong>aplikasi buatan Anda sendiri</strong> yang mau membaca dan
            mengubah data CareerPack ini tanpa lewat ChatGPT — skrip, cron, backend
            apa pun. Pair ini ditukar jadi token lewat{" "}
            <span className="font-mono">client_credentials</span>, tanpa layar izin
            dan tanpa browser. Lihat “Cara pakai” di bawah setelah dibuat.
          </p>
          <p className="text-xs text-muted-foreground">
            Untuk ChatGPT/Claude biasanya <em>tidak</em> perlu: keduanya mendaftar
            sendiri. Pakai ini di sana hanya kalau terpaksa memilih{" "}
            <span className="font-mono">User-Defined OAuth Client</span>.
          </p>
        </div>
      </div>

      {minted && (
        <div className="space-y-2 rounded-md border border-warning/40 bg-warning/5 p-3">
          <p className="text-xs font-semibold text-warning-text">
            Secret ini hanya ditampilkan sekali. Salin sekarang — setelah kotak ini
            ditutup, nilainya tidak bisa dilihat lagi dan harus dibuat ulang.
          </p>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Client ID</p>
            <CodeBlock value={minted.clientId} label="Salin Client ID" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Client Secret</p>
            <CodeBlock value={minted.clientSecret} label="Salin Client Secret" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setMinted(null)}>
            Sudah saya salin
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label, misal: ChatGPT kantor"
          maxLength={60}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={() => void onCreate()} disabled={busy}>
          {busy ? "Membuat…" : "Buat"}
        </Button>
      </div>

      {/* <details> rather than a collapsible component: it is two commands most
          people read once, and the browser already ships the widget. */}
      <details className="rounded-md border border-border bg-muted/30 p-2.5">
        <summary className="cursor-pointer text-xs font-semibold">
          Cara pakai dari aplikasi sendiri
        </summary>
        <div className="mt-2 space-y-2">
          <p className="text-xs text-muted-foreground">
            1 · Tukar pair jadi token. Token berlaku 30 hari; panggilan berikutnya
            mengembalikan token yang sama sampai mendekati kedaluwarsa, jadi aman
            dipanggil tiap kali aplikasi hidup.
          </p>
          <CodeBlock
            value={`curl -sX POST ${values.token} \\
  -d grant_type=client_credentials \\
  -d client_id=CLIENT_ID \\
  -d client_secret=CLIENT_SECRET \\
  -d scope='mcp.read mcp.write'`}
            label="Salin perintah tukar token"
          />
          <p className="text-xs text-muted-foreground">
            2 · Pakai <span className="font-mono">access_token</span> dari jawaban di
            atas sebagai Bearer. Daftar tool ada di{" "}
            <span className="font-mono">tools/list</span>.
          </p>
          <CodeBlock
            value={`curl -sX POST ${values.server} \\
  -H 'Authorization: Bearer ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cv_list","arguments":{}}}'`}
            label="Salin contoh panggilan MCP"
          />
          <p className="text-xs text-muted-foreground">
            Minta <span className="font-mono">scope=mcp.read</span> saja kalau
            aplikasinya cuma membaca — token itu ditolak 403 saat mencoba menulis.
            Mencabut API key di bawah mematikan token yang sudah terbit juga.
          </p>
        </div>
      </details>

      {clients && clients.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.label}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {c.clientId}
                </p>
                <p className="text-xs text-muted-foreground">Dibuat {fmt(c.createdAt)}</p>
              </div>
              {c.revokedAt !== null ? (
                <Badge variant="outline" className="shrink-0">Dicabut</Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive"
                  disabled={revoking === c.id}
                  onClick={() => void onRevoke(c.id)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {revoking === c.id ? "Mencabut…" : "Cabut"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
