import { convexHttpUrl } from "@/shared/lib/env";

/**
 * Apa yang harus diisi pengguna di form connector tiap host — dan, yang lebih
 * penting, apa yang TIDAK boleh diisi.
 *
 * Form ChatGPT menampilkan dua puluh kolom. Lima belas di antaranya diisi
 * otomatis dari `/.well-known/oauth-protected-resource` dan
 * `/.well-known/oauth-authorization-server` milik kita. Mengetiknya manual
 * adalah cara paling umum merusak connector yang sebenarnya sudah hampir jalan.
 * Karena itu tiap baris membawa satu vonis, bukan sekadar nilai.
 *
 * Tidak ada satu pun deployment yang di-hardcode di sini: semuanya diturunkan
 * dari NEXT_PUBLIC_CONVEX_URL (origin SITE — yang `.cloud` menjawab 404 di
 * `/mcp`) dan dari origin halaman ini.
 *
 * Sumber nilainya adalah dokumen discovery yang server ini benar-benar
 * sajikan, jadi kalau salah satu berubah, ubah di `convex/mcp/wellKnown.ts`
 * lebih dulu — bukan di sini.
 */

export type Verdict = "salin" | "pilih" | "centang" | "otomatis" | "kosongkan";

export const VERDICT_HINT: Record<Verdict, string> = {
  salin: "Salin nilai ini ke kolom tersebut",
  pilih: "Pilih opsi ini",
  centang: "Centang kotak ini",
  otomatis: "Sudah terisi sendiri — salin HANYA kalau kolomnya kosong",
  kosongkan: "Biarkan kosong",
};

export interface GuideRow {
  /** Label persis seperti yang tertulis di aplikasi tujuan. */
  field: string;
  verdict: Verdict;
  value?: string;
  note?: string;
}

export interface GuideGroup {
  title: string;
  note?: string;
  rows: GuideRow[];
}

export interface HostGuide {
  id: string;
  host: string;
  path: string;
  lede: string;
  groups: GuideGroup[];
  traps?: string[];
}

const siteOrigin = () => convexHttpUrl("/").replace(/\/+$/, "");

export interface ConnectorValues {
  server: string;
  resource: string;
  asBase: string;
  authorize: string;
  token: string;
  register: string;
  scopes: string[];
  slug: string;
}

/**
 * `appOrigin` datang dari `window.location.origin`, bukan dari konstanta —
 * pengguna di domain kustom melihat domainnya sendiri, dan itu sesuai dengan
 * `authorization_endpoint` yang diumumkan dokumen discovery.
 */
export function connectorValues(appOrigin: string): ConnectorValues {
  const site = siteOrigin();
  return {
    server: `${site}/mcp`,
    // RFC 8707: penanda resource adalah endpoint MCP-nya, bukan origin-nya.
    resource: `${site}/mcp`,
    // RFC 9728 `authorization_servers[0]` — origin Convex site, BUKAN domain app.
    asBase: site,
    // Dua endpoint ini memang di domain app, bukan di Convex. Perbedaan itu
    // nyata dan sengaja: halaman consent adalah halaman Next.
    authorize: `${appOrigin}/oauth/authorize`,
    token: `${appOrigin}/api/oauth/token`,
    register: `${site}/oauth/register`,
    scopes: ["mcp.read", "mcp.write"],
    slug: "careerpack",
  };
}

export function buildGuides(v: ConnectorValues): HostGuide[] {
  return [
    {
      id: "chatgpt",
      host: "ChatGPT",
      path: "Settings → Apps → Advanced settings → Developer mode, lalu Plugins → +",
      lede:
        "Tempel Server URL, sisanya ditemukan sendiri oleh ChatGPT dari dokumen .well-known kita. Panel lanjutan hanya cadangan kalau penemuan itu gagal — kolom yang kosong di sana adalah satu-satunya alasan menyentuhnya.",
      groups: [
        {
          title: "1 · Kolom yang benar-benar Anda isi",
          rows: [
            { field: "Name", verdict: "salin", value: "CareerPack" },
            {
              field: "Connection",
              verdict: "pilih",
              value: "Server URL",
              note: "Bukan “Tunnel” — itu untuk server yang jalan di komputer Anda sendiri.",
            },
            {
              field: "Server URL",
              verdict: "salin",
              value: v.server,
              note: "Path /mcp wajib ditulis; ChatGPT tidak menebaknya dari origin.",
            },
            { field: "Authentication", verdict: "pilih", value: "OAuth" },
          ],
        },
        {
          title: "2 · Advanced OAuth settings → Client registration",
          note: "Buka panel “Advanced OAuth settings”. Mulai dari sini semuanya sudah terisi kecuali penemuan otomatisnya gagal.",
          rows: [
            {
              field: "Registration method",
              verdict: "pilih",
              value: "Dynamic Client Registration (DCR)",
              note:
                "Server ini mendaftarkan klien secara dinamis, jadi tidak perlu Client ID sama sekali. Kalau opsinya tertulis “(Unavailable)”, berarti Registration URL gagal ditemukan — tempel nilainya di bagian 4, tutup dialognya, lalu buka lagi.",
            },
          ],
        },
        {
          title: "3 · Scopes",
          rows: [
            {
              field: "Default scopes",
              verdict: "salin",
              value: v.scopes.join("\n"),
              note: "Satu per baris. mcp.read untuk membaca, mcp.write untuk mengubah — token yang hanya punya mcp.read akan ditolak 403 saat mencoba menulis.",
            },
            {
              field: "Base scopes",
              verdict: "kosongkan",
              note: "Diminta di setiap permintaan auth apa pun aksinya. Tidak ada scope di sini yang perlu selalu ada.",
            },
          ],
        },
        {
          title: "4 · OAuth endpoints",
          note: "Ditemukan otomatis dari server. Cocokkan saja — kalau ada yang kosong, tempel; kalau ada yang beda, yang salah dokumen discovery-nya, dan memperbaikinya di sana lebih benar daripada menambalnya di sini.",
          rows: [
            { field: "Auth URL", verdict: "otomatis", value: v.authorize },
            { field: "Token URL", verdict: "otomatis", value: v.token },
            { field: "Registration URL", verdict: "otomatis", value: v.register },
            {
              field: "Authorization server base",
              verdict: "otomatis",
              value: v.asBase,
              note: "Perhatikan: ini origin Convex, sedangkan Auth URL dan Token URL ada di domain aplikasi. Memang beda host, dan itu benar.",
            },
            { field: "Resource", verdict: "otomatis", value: v.resource, note: "Endpoint MCP-nya sendiri, bukan origin-nya." },
          ],
        },
        {
          title: "5 · OpenID support",
          note: "Keempat kontrolnya tidak disentuh. “OIDC enabled” memang abu-abu karena server ini tidak mengumumkan OIDC configuration URL — itu kondisi normal, dan MCP tidak membutuhkannya.",
          rows: [
            { field: "OIDC enabled", verdict: "kosongkan" },
            { field: "OIDC configuration URL", verdict: "kosongkan" },
            { field: "OIDC userinfo endpoint", verdict: "kosongkan" },
            { field: "OIDC scopes supported", verdict: "kosongkan" },
          ],
        },
        {
          title: "6 · Selesai",
          rows: [
            { field: "Icon (optional)", verdict: "kosongkan", note: "PNG saja, minimal 256×256, maksimal 10 KB. Murni kosmetik." },
            { field: "I understand and want to continue", verdict: "centang", note: "Tombol Create baru aktif setelah ini dicentang." },
            { field: "Create", verdict: "pilih", note: "Lalu jalankan Scan Tools. Aplikasinya masuk ke Drafts." },
          ],
        },
      ],
      traps: [
        "Developer mode hanya ada di web. Kalau Settings → Apps tidak punya Advanced settings, cek Settings → Security and login.",
        "Status 401 saat pertama kali menyambung itu wajar — artinya gerbang auth bekerja, bukan bahwa ada yang rusak.",
      ],
    },

    {
      id: "claude",
      host: "Claude.ai",
      path: "Settings → Connectors → Add custom connector",
      lede: "Dua kolom. Pasangan lanjutannya dibiarkan kosong karena server ini mendaftarkan klien sendiri.",
      groups: [
        {
          title: "1 · Formulirnya",
          rows: [
            { field: "Name", verdict: "salin", value: "CareerPack", note: "Yang muncul di daftar connector." },
            {
              field: "Remote MCP server URL",
              verdict: "salin",
              value: v.server,
              note: "Wajib HTTPS dan wajib menyertakan path-nya.",
            },
          ],
        },
        {
          title: "2 · Advanced settings",
          rows: [
            {
              field: "OAuth Client ID (optional)",
              verdict: "kosongkan",
              note: "Server ini mendaftarkan klien secara dinamis — biarkan kosong, Claude mengurusnya sendiri.",
            },
            { field: "OAuth Client Secret (optional)", verdict: "kosongkan" },
          ],
        },
        { title: "3 · Selesai", rows: [{ field: "Add", verdict: "pilih", note: "Lalu setujui halaman izin yang muncul." }] },
      ],
      traps: [
        "Connector tidak bisa diedit setelah ditambahkan — harus dihapus lalu dibuat ulang. Salah ketik URL berarti mengulang dari awal.",
        "Claude menghubungi server dari cloud Anthropic, bukan dari perangkat Anda. localhost tidak akan pernah tersambung.",
      ],
    },

    {
      id: "claude-code",
      host: "Claude Code",
      path: "terminal, atau .mcp.json di akar repo",
      lede: "Satu-satunya host di sini yang punya kolom kredensial sungguhan, jadi yang ini menerima token langsung.",
      groups: [
        {
          title: "Pilihan A · satu perintah",
          rows: [
            {
              field: "terminal",
              verdict: "salin",
              value: `claude mcp add --transport http ${v.slug} ${v.server} \\\n  --header "Authorization: Bearer MCP_TOKEN"`,
              note: "Ganti MCP_TOKEN dengan token Anda. Menambahkan tidak memvalidasi apa pun — jalankan /mcp sesudahnya; token salah tampil sebagai failed.",
            },
          ],
        },
        {
          title: "Pilihan B · ikut masuk repo",
          note: "Token tidak ikut ter-commit — ${MCP_TOKEN} diambil dari environment saat dimuat.",
          rows: [
            {
              field: ".mcp.json",
              verdict: "salin",
              value: JSON.stringify(
                { mcpServers: { [v.slug]: { type: "http", url: v.server, headers: { Authorization: "Bearer ${MCP_TOKEN}" } } } },
                null,
                2,
              ),
              note: '"type" wajib ada. URL tanpa "type" dianggap salah konfigurasi dan server-nya dilewati diam-diam.',
            },
          ],
        },
      ],
      traps: [
        "${MCP_TOKEN} yang belum di-set tidak menggagalkan pemuatan — Claude Code mengirim teksnya apa adanya dan server menjawab 401.",
      ],
    },

    {
      id: "cursor",
      host: "Cursor",
      path: ".cursor/mcp.json di proyek, atau ~/.cursor/mcp.json global",
      lede: "Terlihat identik dengan berkas Claude Code, dan tidak bisa saling tukar.",
      groups: [
        {
          title: "Berkasnya",
          rows: [
            {
              field: ".cursor/mcp.json",
              verdict: "salin",
              value: JSON.stringify(
                { mcpServers: { [v.slug]: { url: v.server, headers: { Authorization: "Bearer ${env:MCP_TOKEN}" } } } },
                null,
                2,
              ),
            },
          ],
        },
      ],
      traps: [
        'Tidak ada kunci "type" di sini — bentuk remote Cursor tidak memakainya, sedangkan Claude Code error tanpanya.',
        "Sintaks variabelnya ${env:NAMA}. Tempel ${MCP_TOKEN} milik Claude Code ke sini dan Cursor mengirimnya sebagai teks biasa.",
      ],
    },
  ];
}
