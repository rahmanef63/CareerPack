import { it, expect } from "vitest";
import { GET } from "./route";

it("uses Cloudflare country metadata and never shares visitor-specific responses", async () => {
  for (const [header, expected] of [["id", "ID"], ["XX", null], ["T1", null], ["", null], ["bogus", null]] as const) {
    const response = GET(new Request("https://careerpack.org/api/geo", { headers: { "cf-ipcountry": header } }));
    expect(await response.json()).toEqual({ country: expected, source: expected ? "cf-ipcountry" : "none" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  }
});
