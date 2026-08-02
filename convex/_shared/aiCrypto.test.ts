import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  credEncryptionAvailable,
  decryptCred,
  encryptCred,
  isEncryptedCred,
  maybeEncryptCred,
} from "./aiCrypto";

const saved: { secret?: string } = {};

beforeEach(() => {
  saved.secret = process.env.AI_CRED_SECRET;
  process.env.AI_CRED_SECRET = "test-secret-not-a-real-one";
});

afterEach(() => {
  if (saved.secret === undefined) delete process.env.AI_CRED_SECRET;
  else process.env.AI_CRED_SECRET = saved.secret;
});

describe("encrypt/decrypt round trip", () => {
  it("returns the original key and never stores it verbatim", async () => {
    const key = "sk-or-v1-0123456789abcdef0123456789abcdef";
    const blob = await encryptCred(key);

    expect(blob).not.toContain(key);
    expect(isEncryptedCred(blob)).toBe(true);
    await expect(decryptCred(blob)).resolves.toBe(key);
  });

  it("uses a fresh IV per call, so the same key never encrypts to the same blob", async () => {
    // Two identical ciphertexts would mean a fixed IV, which is the one
    // mistake that breaks GCM outright.
    const [a, b] = await Promise.all([encryptCred("sk-same"), encryptCred("sk-same")]);
    expect(a).not.toBe(b);
    await expect(decryptCred(b)).resolves.toBe("sk-same");
  });

  it("survives an empty string and non-ASCII", async () => {
    for (const value of ["", "kunci-rähmän-🔑"]) {
      await expect(decryptCred(await encryptCred(value))).resolves.toBe(value);
    }
  });
});

describe("plaintext fallback — the branch production depends on", () => {
  it("passes an untagged value straight through", async () => {
    // This is the LIVE global key on prod the day this deploys: still
    // plaintext, still has to work on the very first request.
    await expect(decryptCred("sk-live-plaintext-key")).resolves.toBe("sk-live-plaintext-key");
  });

  it("passes plaintext through even with no AI_CRED_SECRET set", async () => {
    delete process.env.AI_CRED_SECRET;
    expect(credEncryptionAvailable()).toBe(false);
    await expect(decryptCred("sk-live-plaintext-key")).resolves.toBe("sk-live-plaintext-key");
  });

  it("does not mistake a plaintext key for ciphertext", async () => {
    expect(isEncryptedCred("sk-encv1-looks-close")).toBe(false);
    expect(isEncryptedCred("")).toBe(false);
  });
});

describe("AI_CRED_SECRET unset", () => {
  it("makes maybeEncryptCred store plaintext instead of throwing", async () => {
    delete process.env.AI_CRED_SECRET;
    await expect(maybeEncryptCred("sk-new")).resolves.toBe("sk-new");
  });

  it("still encrypts when the secret is present", async () => {
    const stored = await maybeEncryptCred("sk-new");
    expect(isEncryptedCred(stored)).toBe(true);
  });

  it("refuses to encrypt a new secret with nothing to encrypt it under", async () => {
    delete process.env.AI_CRED_SECRET;
    await expect(encryptCred("sk-new")).rejects.toThrow(/AI_CRED_SECRET/);
  });

  it("reports a rotated secret instead of a bare crypto failure", async () => {
    const blob = await encryptCred("sk-new");
    process.env.AI_CRED_SECRET = "a-different-secret";
    await expect(decryptCred(blob)).rejects.toThrow(/AI_CRED_SECRET/);
  });

  it("reports a missing secret when a ciphertext row is read without one", async () => {
    const blob = await encryptCred("sk-new");
    delete process.env.AI_CRED_SECRET;
    await expect(decryptCred(blob)).rejects.toThrow(/AI_CRED_SECRET/);
  });
});

describe("whitespace-only AI_CRED_SECRET", () => {
  it("counts as unset rather than as a one-character key", async () => {
    process.env.AI_CRED_SECRET = "   ";
    expect(credEncryptionAvailable()).toBe(false);
    await expect(maybeEncryptCred("sk-new")).resolves.toBe("sk-new");
  });
});
