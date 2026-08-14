"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/shared/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export interface AuthorizeParams {
  responseType: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  state: string;
  resource: string;
}

/** Appends to the client's redirect without clobbering a query it already has. */
function redirectWith(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">{children}</Card>
    </main>
  );
}

export function AuthorizeConsent(params: AuthorizeParams) {
  const { state } = useAuth();
  const createAuthCode = useMutation(api.mcp.oauth.createAuthCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paramError = useMemo(() => {
    if (params.responseType !== "code") return "response_type harus 'code'.";
    if (!params.clientId) return "client_id tidak ada.";
    if (!params.redirectUri) return "redirect_uri tidak ada.";
    if (!params.codeChallenge) return "code_challenge tidak ada.";
    // Refused here as well as on the server so a misconfigured client gets a
    // readable answer instead of a failed exchange minutes later.
    if (params.codeChallengeMethod !== "S256") {
      return "code_challenge_method harus 'S256'.";
    }
    try {
      new URL(params.redirectUri);
    } catch {
      return "redirect_uri bukan URL yang valid.";
    }
    return null;
  }, [params]);

  const redirectHost = useMemo(() => {
    try {
      return new URL(params.redirectUri).host;
    } catch {
      return "";
    }
  }, [params.redirectUri]);

  // A client that registered itself through RFC 7591 has a `cp_…` id nobody
  // can read. Show the name it gave — and say who supplied it, because
  // nothing on this server verifies that name.
  // Skipped while signed out: the query is behind requireUser, and letting it
  // run anyway would throw through the "Masuk dulu" branch below.
  const client = useQuery(
    api.mcp.register.getClientInfo,
    state.user ? { clientId: params.clientId } : "skip",
  );

  // What Izinkan actually grants. The screen used to promise read AND write
  // unconditionally; since scopes became enforceable per call, a client that
  // asks only for mcp.read gets only that, and saying otherwise would be the
  // consent screen lying in the direction that costs the user most.
  const canWrite = !params.scope || params.scope.split(/\s+/).includes("mcp.write");

  if (paramError) {
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Permintaan tidak valid</CardTitle>
          <CardDescription>{paramError}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Coba sambungkan ulang dari aplikasi yang mengirim Anda ke sini.
        </CardContent>
      </Shell>
    );
  }

  if (state.isLoading) {
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Memuat…</CardTitle>
        </CardHeader>
      </Shell>
    );
  }

  if (!state.user) {
    // `/login` does not yet honour `next`, so this returns to the dashboard
    // and the user re-runs the connector. The parameter is here so that a
    // one-line change in LoginPage completes the round trip.
    const next = encodeURIComponent(
      typeof window === "undefined"
        ? "/oauth/authorize"
        : window.location.pathname + window.location.search,
    );
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Masuk dulu</CardTitle>
          <CardDescription>
            Anda perlu masuk ke CareerPack sebelum memberi akses ke aplikasi lain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={`/login?next=${next}`}>Masuk ke CareerPack</Link>
          </Button>
        </CardContent>
      </Shell>
    );
  }

  if (state.isDemo) {
    // An anonymous session is a throwaway sandbox tied to this browser. A
    // token minted against it would outlive the only way back into that
    // account, so it could never be reviewed or revoked by its owner.
    return (
      <Shell>
        <CardHeader>
          <CardTitle>Sesi demo tidak bisa dihubungkan</CardTitle>
          <CardDescription>
            Buat akun dengan email dulu, lalu sambungkan lagi dari aplikasi Anda.
          </CardDescription>
        </CardHeader>
      </Shell>
    );
  }

  const deny = () => {
    window.location.replace(
      redirectWith(params.redirectUri, {
        error: "access_denied",
        state: params.state,
      }),
    );
  };

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      const { code } = await createAuthCode({
        clientId: params.clientId,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod,
        scope: params.scope || undefined,
        resource: params.resource || undefined,
      });
      window.location.replace(
        redirectWith(params.redirectUri, { code, state: params.state }),
      );
    } catch (err) {
      setBusy(false);
      setError(
        err instanceof Error
          ? err.message.replace(/^\[Request ID:[^\]]+\]\s*/, "")
          : "Gagal membuat kode akses.",
      );
    }
  };

  return (
    <Shell>
      <CardHeader>
        <CardTitle>Hubungkan {client?.clientName ?? params.clientId}</CardTitle>
        <CardDescription>
          Aplikasi ini meminta akses ke data CareerPack milik {state.user.email}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li>Membaca CV, lamaran, jadwal, dan catatan karier Anda.</li>
          {canWrite ? (
            <li>Membuat, mengubah, dan menghapus data tersebut atas nama Anda.</li>
          ) : (
            <li className="text-muted-foreground">
              Tidak bisa mengubah atau menghapus apa pun — akses baca saja.
            </li>
          )}
        </ul>
        <p className="text-xs text-muted-foreground">
          Kode akan dikirim ke <span className="font-mono">{redirectHost}</span>.
          Jangan lanjutkan kalau Anda tidak mengenali alamat itu.
        </p>
        {client ? (
          <p className="text-xs text-muted-foreground">
            Nama aplikasi di atas dilaporkan sendiri oleh aplikasinya saat
            mendaftar, bukan diverifikasi CareerPack. Alamat tujuan di atas yang
            bisa Anda percaya.
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive-text" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={deny}
            disabled={busy}
          >
            Batal
          </Button>
          <Button className="flex-1" onClick={approve} disabled={busy}>
            {busy ? "Menghubungkan…" : "Izinkan"}
          </Button>
        </div>
      </CardContent>
    </Shell>
  );
}
