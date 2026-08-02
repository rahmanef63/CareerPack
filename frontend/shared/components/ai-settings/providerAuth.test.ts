import { describe, it, expect } from "vitest";

import { AI_PROVIDERS } from "../../../../convex/_shared/aiProviders";
import { providerAffordances, type ProviderOption } from "./providerAuth";

/** `listAIProviders` row for a real provider, which is what the form receives. */
function optionFor(id: string): ProviderOption {
  const spec = AI_PROVIDERS[id];
  return {
    id: spec.id,
    label: spec.label,
    baseUrl: spec.baseUrl,
    defaultModel: spec.defaultModel,
    models: [...spec.models],
    docsUrl: spec.auth.apiKey?.docsUrl,
    auth: spec.auth,
  };
}

describe("providerAffordances", () => {
  it("offers only the key form for an apiKey-only provider", () => {
    const a = providerAffordances(optionFor("openai"));
    expect(a.oauth).toBeNull();
    expect(a.apiKey?.docsUrl).toBe("https://platform.openai.com/api-keys");
    expect(a.baseUrl).toBe("optional");
  });

  it("offers both paths for a provider that declares a redirect OAuth", () => {
    const a = providerAffordances(optionFor("openrouter"));
    expect(a.oauth?.label).toBe("Masuk dengan OpenRouter");
    expect(a.oauth?.handoff).toBe("redirect");
    expect(a.apiKey).not.toBeNull();
  });

  it("asks for the base URL when the provider ships no endpoint", () => {
    const a = providerAffordances(optionFor("custom"));
    expect(a.baseUrl).toBe("required");
    expect(a.apiKey).toEqual({});
    expect(a.oauth).toBeNull();
  });

  it("hides an OAuth flow whose handoff has no widget yet", () => {
    const a = providerAffordances({
      id: "x",
      label: "X",
      baseUrl: "https://x/v1",
      defaultModel: "m",
      models: [],
      auth: { apiKey: {}, oauth: { kind: "pkce_token", handoff: "paste", label: "Masuk dengan X" } },
    });
    expect(a.oauth).toBeNull();
    expect(a.apiKey).toEqual({});
  });

  it("hides the key field when the descriptor declares no apiKey", () => {
    const a = providerAffordances({
      id: "y",
      label: "Y",
      baseUrl: "https://y/v1",
      defaultModel: "m",
      models: [],
      auth: { oauth: { kind: "pkce_key", handoff: "redirect", label: "Masuk dengan Y" } },
    });
    expect(a.apiKey).toBeNull();
    expect(a.oauth).not.toBeNull();
  });

  it("keeps the key field for a row that carries no auth descriptor", () => {
    const a = providerAffordances({
      id: "z",
      label: "Z",
      baseUrl: "https://z/v1",
      defaultModel: "m",
      models: [],
    });
    expect(a.apiKey).toEqual({});
  });

  it("renders nothing provider-specific while the list is loading", () => {
    expect(providerAffordances(undefined)).toEqual({
      oauth: null,
      apiKey: {},
      baseUrl: "optional",
    });
  });

  it("gives every shipped provider at least one way to authenticate", () => {
    for (const id of Object.keys(AI_PROVIDERS)) {
      const a = providerAffordances(optionFor(id));
      expect(a.oauth ?? a.apiKey, `${id} has no auth affordance`).not.toBeNull();
    }
  });
});
