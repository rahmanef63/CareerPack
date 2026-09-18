import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHATGPT_CAREERPACK_PLUGIN_URL } from "./externalLinks";

const root = process.cwd();
const APP_ID = "asdk_app_6a7ed7c4fd54819197496ceb6abf03b1";

function json(path: string): unknown {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as unknown;
}

describe("CareerPack registered app package", () => {
  it("binds the exact registered ChatGPT app id and public connect URL", () => {
    const app = json(".app.json") as {
      apps: { careerpack: { id: string; required: boolean } };
    };

    expect(app.apps.careerpack).toEqual({ id: APP_ID, required: true });
    expect(CHATGPT_CAREERPACK_PLUGIN_URL).toBe(
      "https://chatgpt.com/plugins/plugin_asdk_app_6a7ed7c4fd54819197496ceb6abf03b1",
    );
  });

  it("keeps all public MCP/OAuth endpoints on CareerPack custom domains", () => {
    const mcp = json("plugin/.mcp.json") as {
      mcpServers: {
        careerpack: {
          url: string;
          oauth: { authServerMetadataUrl: string };
        };
      };
    };
    const server = mcp.mcpServers.careerpack;

    expect(server.url).toBe("https://site.careerpack.org/mcp");
    expect(server.oauth.authServerMetadataUrl).toBe(
      "https://site.careerpack.org/.well-known/oauth-authorization-server",
    );
    expect(JSON.stringify(mcp)).not.toContain("convex.site");
    expect(JSON.stringify(mcp)).not.toContain("convex.cloud");
  });

  it("publishes legal URLs and the OpenAI app binding from the Codex manifest", () => {
    const manifest = json(".codex-plugin/plugin.json") as {
      apps: string;
      mcpServers: string;
      interface: {
        websiteURL: string;
        privacyPolicyURL: string;
        termsOfServiceURL: string;
        composerIcon: string;
        logo: string;
      };
    };

    expect(manifest.apps).toBe("./.app.json");
    expect(manifest.mcpServers).toBe("./plugin/.mcp.json");
    expect(manifest.interface.websiteURL).toBe("https://careerpack.org/");
    expect(manifest.interface.privacyPolicyURL).toBe("https://careerpack.org/privacy");
    expect(manifest.interface.termsOfServiceURL).toBe("https://careerpack.org/terms");
    expect(manifest.interface.composerIcon).toBe("./assets/icon.png");
    expect(manifest.interface.logo).toBe("./assets/icon.png");
  });

  it("ships a 256x256 PNG icon under ChatGPT's 10 KB upload limit", () => {
    const path = join(root, ".codex-plugin/assets/icon.png");
    const file = readFileSync(path);

    expect(statSync(path).size).toBeLessThanOrEqual(10_000);
    expect(file.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(file.readUInt32BE(16)).toBe(256);
    expect(file.readUInt32BE(20)).toBe(256);
  });
});
