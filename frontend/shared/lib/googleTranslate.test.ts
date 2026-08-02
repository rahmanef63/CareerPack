import { describe, expect, it } from "vitest";

import {
  autoTranslateTarget,
  parseGoogTrans,
  SOURCE_LANG,
  targetForBrowserLang,
} from "./googleTranslate";

describe("targetForBrowserLang", () => {
  it("returns null for the source language so we never offer a no-op", () => {
    expect(targetForBrowserLang("id")).toBeNull();
    expect(targetForBrowserLang("id-ID")).toBeNull();
    expect(targetForBrowserLang(undefined)).toBeNull();
    expect(targetForBrowserLang("")).toBeNull();
  });

  it("matches on the base subtag", () => {
    expect(targetForBrowserLang("en-GB")).toBe("en");
    expect(targetForBrowserLang("de-AT")).toBe("de");
    expect(targetForBrowserLang("PT-BR")).toBe("pt");
  });

  // Traditional vs Simplified is a different script, not a formatting nuance —
  // collapsing them to a base "zh" would hand a Taiwanese reader the wrong one.
  it("keeps Chinese scripts distinct and defaults bare zh to Simplified", () => {
    expect(targetForBrowserLang("zh-TW")).toBe("zh-TW");
    expect(targetForBrowserLang("zh-HK")).toBe("zh-TW");
    expect(targetForBrowserLang("zh-CN")).toBe("zh-CN");
    expect(targetForBrowserLang("zh")).toBe("zh-CN");
  });

  it("returns null when nothing close is offered", () => {
    expect(targetForBrowserLang("sw-KE")).toBeNull();
  });
});

describe("autoTranslateTarget", () => {
  // Everything the endpoint cannot place — cf-ipcountry absent, upstream
  // timed out, Cloudflare's "XX"/"T1" non-answers — arrives here as null,
  // and all of it has to land on the offer banner rather than on a
  // translation applied off a country we had to guess.
  it("fails open to null when the country is not resolved", () => {
    expect(autoTranslateTarget(null, "en-US")).toBeNull();
    expect(autoTranslateTarget(undefined, "en-US")).toBeNull();
    expect(autoTranslateTarget("", "en-US")).toBeNull();
    expect(autoTranslateTarget("USA", "en-US")).toBeNull();
  });

  // The case the banner was built for and the reason browser language alone
  // could never auto-apply.
  it("never auto-translates a visitor inside Indonesia", () => {
    expect(autoTranslateTarget("ID", "en-US")).toBeNull();
    expect(autoTranslateTarget("id", "ja")).toBeNull();
  });

  // The mirror case, and the reason country alone is not enough either: an
  // Indonesian in Tokyo reads the copy exactly as authored.
  it("never auto-translates a reader whose browser is Indonesian", () => {
    expect(autoTranslateTarget("JP", "id-ID")).toBeNull();
    expect(autoTranslateTarget("US", "id")).toBeNull();
  });

  it("prefers the browser language over the country's", () => {
    // Korean on holiday in Germany wants Korean, not German.
    expect(autoTranslateTarget("DE", "ko-KR")).toBe("ko");
    expect(autoTranslateTarget("JP", "en-GB")).toBe("en");
  });

  it("falls back to the country's language when the browser offers none", () => {
    expect(autoTranslateTarget("JP", undefined)).toBe("ja");
    expect(autoTranslateTarget("TW", "sw-KE")).toBe("zh-TW");
    expect(autoTranslateTarget("BR", undefined)).toBe("pt");
  });

  // An unmapped country tells us nothing about the reader beyond "not here",
  // and English beats Indonesian they cannot read.
  it("defaults an unmapped country to English", () => {
    expect(autoTranslateTarget("NG", undefined)).toBe("en");
    expect(autoTranslateTarget("vn", "vi")).toBe("en");
  });
});

describe("parseGoogTrans", () => {
  it("is null when the cookie is absent", () => {
    expect(parseGoogTrans("")).toBeNull();
    expect(parseGoogTrans("theme=dark; careerpack:locale-pref=id")).toBeNull();
  });

  it("reads the target out of Google's /source/target value", () => {
    expect(parseGoogTrans(`googtrans=/${SOURCE_LANG}/ja`)).toBe("ja");
    expect(parseGoogTrans(`theme=dark; googtrans=/${SOURCE_LANG}/zh-CN; a=b`)).toBe("zh-CN");
  });

  // Google percent-encodes the slashes when IT writes the cookie from its own
  // widget, so a raw split would yield "%2Fid%2Fja" as a single segment.
  it("decodes a percent-encoded value", () => {
    expect(parseGoogTrans(`googtrans=%2F${SOURCE_LANG}%2Fko`)).toBe("ko");
  });

  // Google writes this when a user picks "Indonesian" in its own widget.
  // Treating it as active would suppress the offer banner AND keep loading
  // the script on a page that is not being translated.
  it("treats a same-language cookie as untranslated", () => {
    expect(parseGoogTrans(`googtrans=/${SOURCE_LANG}/${SOURCE_LANG}`)).toBeNull();
  });

  // A prefix match would make `googtrans_extra=…` look like the real cookie.
  it("does not match a longer cookie name that starts the same", () => {
    expect(parseGoogTrans("googtrans_backup=/id/ja")).toBeNull();
  });
});
