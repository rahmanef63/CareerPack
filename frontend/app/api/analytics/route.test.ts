import { it, expect, vi, afterEach } from "vitest";

const { mutation } = vi.hoisted(() => ({ mutation: vi.fn<(reference: unknown, args: Record<string, unknown>) => Promise<unknown>>(async () => null) }));
vi.mock("convex/browser", () => ({ ConvexHttpClient: class { mutation = mutation; } }));
afterEach(() => { vi.unstubAllEnvs(); mutation.mockReset(); });

it("finishes the analytics write before the Worker request ends and never sends a raw IP", async () => {
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://api.careerpack.org");
  vi.resetModules();
  const { POST } = await import("./route");
  let finish!: () => void;
  mutation.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  let returned = false;
  const pending = POST(new Request("https://careerpack.org/api/analytics", {
    method: "POST", headers: { "cf-connecting-ip": "203.0.113.5", "cf-ipcountry": "ID" },
    body: JSON.stringify({ path: "/", viewport: "desktop" }),
  })).then(response => { returned = true; return response; });
  await vi.waitFor(() => expect(mutation).toHaveBeenCalledOnce());
  expect(returned).toBe(false);
  const payload = mutation.mock.calls[0][1];
  expect(payload).toMatchObject({ country: "ID", ipHash: expect.stringMatching(/^[a-f0-9]{64}$/) });
  expect(JSON.stringify(payload)).not.toContain("203.0.113.5");
  finish();
  expect((await pending).status).toBe(204);
});
