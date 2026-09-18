import { afterEach, describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";

declare global {
  interface ImportMeta {
    glob(pattern: string): Record<string, () => Promise<Record<string, unknown>>>;
  }
}

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

const originalAppUrl = process.env.APP_URL;
const originalSiteUrl = process.env.CONVEX_SITE_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
  if (originalSiteUrl === undefined) delete process.env.CONVEX_SITE_URL;
  else process.env.CONVEX_SITE_URL = originalSiteUrl;
});

describe("MCP OAuth discovery", () => {
  it("falls back to the public CareerPack app origin when APP_URL is missing", async () => {
    delete process.env.APP_URL;
    process.env.CONVEX_SITE_URL = "https://site.careerpack.org";

    const t = convexTest(schema, modules);
    const res = await t.fetch("/.well-known/oauth-authorization-server", {
      method: "GET",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.issuer).toBe("https://site.careerpack.org");
    expect(body.authorization_endpoint).toBe("https://careerpack.org/oauth/authorize");
    expect(body.token_endpoint).toBe("https://careerpack.org/api/oauth/token");
    expect(body.registration_endpoint).toBe("https://site.careerpack.org/oauth/register");
    expect(body.grant_types_supported).toContain("authorization_code");
    expect(body.grant_types_supported).toContain("client_credentials");
    expect(body.token_endpoint_auth_methods_supported).toContain("client_secret_post");
  });
});
