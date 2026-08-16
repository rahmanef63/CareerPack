import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";

// Same glob dance as authCheckEmail.test.ts — convex-test needs the whole
// function module graph (incl. `_generated`) before it can route `t.fetch`.
declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

// Same two-glob dance as convex/admin/webhooks.test.ts: from a test inside
// `convex/mcp/`, the parent glob misses this very directory, and convex-test
// roots its module paths at `../`. So glob the current dir too and re-root
// those keys to `../mcp/...`, or `internal.mcp.register.*` never resolves.
const modules = Object.fromEntries(
  Object.entries({
    ...import.meta.glob("../**/*.{ts,js}"),
    ...Object.fromEntries(
      Object.entries(import.meta.glob("./**/*.{ts,js}")).map(([path, loader]) => [
        path.replace(/^\.\//, "../mcp/"),
        loader,
      ]),
    ),
  }).filter(
    ([path]) => !path.endsWith(".d.ts") && !/\.(test|spec|config)\./.test(path),
  ),
);

const REGISTER_RATE_MAX = 20;

function register(
  t: ReturnType<typeof convexTest>,
  body: unknown,
  ip = "203.0.113.9",
) {
  return t.fetch("/oauth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

const CHATGPT = "https://chatgpt.com/connector/oauth/abc123";

describe("POST /oauth/register", () => {
  it("issues a public client id for an allowed callback", async () => {
    const t = convexTest(schema, modules);
    const res = await register(t, {
      redirect_uris: [CHATGPT],
      client_name: "ChatGPT",
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.client_id).toMatch(/^cp_[0-9a-f]+$/);
    // No secret, ever: these are public clients and PKCE is the proof.
    expect(body.client_secret).toBeUndefined();
    expect(body.token_endpoint_auth_method).toBe("none");
    expect(body.redirect_uris).toEqual([CHATGPT]);
  });

  it("refuses a callback outside the redirect allowlist", async () => {
    const t = convexTest(schema, modules);
    // The whole point of the endpoint being unauthenticated is that this
    // check holds. Without it, anyone could register a client pointing at
    // their own host and then phish a signed-in user through the real
    // consent screen.
    const res = await register(t, {
      redirect_uris: ["https://evil.example/callback"],
      client_name: "Definitely ChatGPT",
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_redirect_uri");
  });

  it("accepts the Connectors Gateway callback, but not the domain around it", async () => {
    const t = convexTest(schema, modules);
    const gateway = await register(t, {
      redirect_uris: ["https://connectors.rahmanef.com/oauth/callback"],
      client_name: "Connectors Gateway",
    });
    expect(gateway.status).toBe(201);

    // The allowlist matcher also accepts any SUBDOMAIN of an entry, so the
    // entry is the exact host. A sibling app on the same domain must not be
    // able to receive an authorization code minted here.
    const sibling = await register(t, {
      redirect_uris: ["https://mso.rahmanef.com/oauth/callback"],
      client_name: "Something else entirely",
    });
    expect(sibling.status).toBe(400);
    expect((await sibling.json()).error).toBe("invalid_redirect_uri");
  });

  it("refuses a client that wants to authenticate with a secret", async () => {
    const t = convexTest(schema, modules);
    const res = await register(t, {
      redirect_uris: [CHATGPT],
      token_endpoint_auth_method: "client_secret_post",
    });

    // Answering "sure" would have the client send a secret on every token
    // request that this server never checks — worse than refusing, because
    // it reads as authentication.
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_client_metadata");
  });

  it("caps registrations per IP", async () => {
    const t = convexTest(schema, modules);
    for (let i = 0; i < REGISTER_RATE_MAX; i++) {
      const ok = await register(t, { redirect_uris: [CHATGPT] });
      expect(ok.status).toBe(201);
    }

    const over = await register(t, { redirect_uris: [CHATGPT] });
    expect(over.status).toBe(429);

    // A different address still works: the bucket is per-IP, not global.
    const other = await register(t, { redirect_uris: [CHATGPT] }, "198.51.100.4");
    expect(other.status).toBe(201);
  });
});

describe("createAuthCode against a registered client", () => {
  it("refuses a callback the client never registered", async () => {
    const t = convexTest(schema, modules);
    const created = await register(t, {
      redirect_uris: [CHATGPT],
      client_name: "ChatGPT",
    });
    const { client_id } = await created.json();

    const userId = await t.run(async (ctx) =>
      ctx.db.insert("users", { email: "ada@example.com" }),
    );
    const asUser = t.withIdentity({ subject: userId });

    // Same host, still allow-listed — and still refused, because this client
    // said up front which callbacks it uses. Registration has to narrow what
    // a client may ask for, or it buys nothing over not registering at all.
    await expect(
      asUser.mutation(api.mcp.oauth.createAuthCode, {
        clientId: client_id,
        redirectUri: "https://chatgpt.com/connector/oauth/someone-elses-id",
        codeChallenge: "a".repeat(43),
        codeChallengeMethod: "S256",
      }),
    ).rejects.toThrow(/tidak terdaftar/);

    // The one it did register still works.
    const { code } = await asUser.mutation(api.mcp.oauth.createAuthCode, {
      clientId: client_id,
      redirectUri: CHATGPT,
      codeChallenge: "a".repeat(43),
      codeChallengeMethod: "S256",
    });
    expect(code).toBeTruthy();
  });
});
