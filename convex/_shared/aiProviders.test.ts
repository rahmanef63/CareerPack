import { describe, it, expect } from "vitest";
import { AI_PROVIDERS, listProvidersPublic, providerOAuth } from "./aiProviders";

describe("declared auth capability", () => {
  it("gives every provider at least one usable way in", async () => {
    for (const [id, spec] of Object.entries(AI_PROVIDERS)) {
      expect(spec.auth.apiKey ?? spec.auth.oauth, `${id} declares no auth method`).toBeDefined();
    }
  });

  it("resolves the OAuth flow by capability, never by provider name", () => {
    expect(providerOAuth("openrouter")).toMatchObject({
      kind: "pkce_key",
      handoff: "redirect",
      callbackPath: "/oauth/openrouter/callback",
    });
    expect(providerOAuth("openai")).toBeNull();
    expect(providerOAuth("custom")).toBeNull();
    expect(providerOAuth("tidak-ada")).toBeNull();
  });

  it("declares OAuth for exactly the providers convex/ai/oauth.ts can finish", () => {
    // A declared flow with no adapter renders a button whose finish step
    // fails; an adapter with no declaration is a flow no UI can start. Pin
    // the list so adding either half alone trips here.
    const withOAuth = listProvidersPublic()
      .filter((p) => p.auth.oauth)
      .map((p) => p.id);
    expect(withOAuth).toEqual(["openrouter"]);
  });

  it("keeps 'error' out of the id space the callback shares with it", () => {
    // `frontend/slices/settings/lib/aiConnectResult.ts` reads one `?ai=` param
    // for both outcomes: a provider id means success, the literal "error" means
    // failure. A provider actually named `error` would make every successful
    // connect to it render as a failed one — this is the assertion that file
    // cites as its safety argument.
    expect(Object.keys(AI_PROVIDERS)).not.toContain("error");
  });

  it("requires a callbackPath on every redirect-handoff flow", () => {
    for (const [id, spec] of Object.entries(AI_PROVIDERS)) {
      if (spec.auth.oauth?.handoff !== "redirect") continue;
      expect(spec.auth.oauth.callbackPath, `${id} redirects nowhere`).toMatch(/^\//);
    }
  });
});

describe("public provider payload", () => {
  it("derives docsUrl from auth.apiKey so the two cannot drift", () => {
    const byId = new Map(listProvidersPublic().map((p) => [p.id, p]));
    expect(byId.get("groq")?.docsUrl).toBe(AI_PROVIDERS.groq.auth.apiKey?.docsUrl);
    // "custom" points at an endpoint we know nothing about — no docs link.
    expect(byId.get("custom")?.docsUrl).toBeUndefined();
  });

  it("carries no credential material — listAIProviders is unauthenticated", () => {
    const serialized = JSON.stringify(listProvidersPublic());
    for (const leak of ["clientId", "client_id", "apiKey\":\"", "secret", "token"]) {
      expect(serialized).not.toContain(leak);
    }
  });
});
