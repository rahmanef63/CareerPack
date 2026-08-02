import type { Metadata } from "next";
import { AuthorizeConsent } from "./AuthorizeConsent";

/**
 * OAuth consent screen for MCP clients (ChatGPT, Claude, Cursor).
 *
 * No `layout.tsx` next to it on purpose: this app already mounts
 * `<Providers>` — and therefore `AuthProvider` — in the root layout, so the
 * client component below can call `useAuth()` here. In a project where the
 * providers live under a route group instead, this page renders outside
 * them and throws "useAuth must be used within AuthProvider".
 */
export const metadata: Metadata = {
  title: "Hubungkan aplikasi | CareerPack",
  // A consent URL carries someone's live PKCE challenge in the query string.
  robots: { index: false, follow: false },
};

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (key: string): string =>
    typeof sp[key] === "string" ? (sp[key] as string) : "";

  return (
    <AuthorizeConsent
      responseType={one("response_type")}
      clientId={one("client_id")}
      redirectUri={one("redirect_uri")}
      codeChallenge={one("code_challenge")}
      codeChallengeMethod={one("code_challenge_method")}
      scope={one("scope")}
      state={one("state")}
      resource={one("resource")}
    />
  );
}
