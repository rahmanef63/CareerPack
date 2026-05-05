import { describe, it, expect } from "vitest";
import {
  stripCodeFence,
  parseJsonOrThrow,
  readString,
  readNumber,
  readStringArray,
} from "./aiOutput";

describe("stripCodeFence", () => {
  it("returns input unchanged when no fence present", () => {
    expect(stripCodeFence('{"a":1}')).toBe('{"a":1}');
  });

  it("strips ```json fenced block", () => {
    const input = '```json\n{"a":1}\n```';
    expect(stripCodeFence(input)).toBe('{"a":1}');
  });

  it("strips bare ``` fenced block", () => {
    const input = '```\n{"a":1}\n```';
    expect(stripCodeFence(input)).toBe('{"a":1}');
  });

  it("trims leading/trailing whitespace", () => {
    expect(stripCodeFence('   {"a":1}   ')).toBe('{"a":1}');
  });

  it("preserves internal whitespace inside fence", () => {
    const input = '```json\n{\n  "a": 1\n}\n```';
    expect(stripCodeFence(input)).toBe('{\n  "a": 1\n}');
  });

  it("handles upper-case JSON tag", () => {
    expect(stripCodeFence('```JSON\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("returns original for partial fence", () => {
    expect(stripCodeFence('```{"a":1}')).toBe('```{"a":1}');
  });
});

describe("parseJsonOrThrow", () => {
  it("parses fenced JSON", () => {
    expect(parseJsonOrThrow('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("parses bare JSON", () => {
    expect(parseJsonOrThrow('{"a":1}')).toEqual({ a: 1 });
  });

  it("throws localized message on invalid JSON", () => {
    expect(() => parseJsonOrThrow("not json")).toThrowError(
      /format JSON tidak valid/i,
    );
  });

  it("throws on empty fenced block", () => {
    expect(() => parseJsonOrThrow("```json\n```")).toThrow();
  });
});

describe("readString", () => {
  it("returns string value as-is", () => {
    expect(readString("hello")).toBe("hello");
  });

  it("returns empty string for non-string types", () => {
    expect(readString(42)).toBe("");
    expect(readString(null)).toBe("");
    expect(readString(undefined)).toBe("");
    expect(readString({ x: 1 })).toBe("");
    expect(readString([])).toBe("");
  });
});

describe("readNumber", () => {
  it("returns finite numbers as-is", () => {
    expect(readNumber(42)).toBe(42);
    expect(readNumber(0)).toBe(0);
    expect(readNumber(-1.5)).toBe(-1.5);
  });

  it("parses numeric strings", () => {
    expect(readNumber("42")).toBe(42);
    expect(readNumber("  42  ")).toBe(42);
    expect(readNumber("-3.14")).toBe(-3.14);
  });

  it("rejects non-numeric strings", () => {
    expect(readNumber("forty-two")).toBeUndefined();
    expect(readNumber("4.2.0")).toBeUndefined();
    expect(readNumber("4e2")).toBeUndefined();
    expect(readNumber("")).toBeUndefined();
  });

  it("rejects non-finite + non-string types", () => {
    expect(readNumber(NaN)).toBeUndefined();
    expect(readNumber(Infinity)).toBeUndefined();
    expect(readNumber(null)).toBeUndefined();
    expect(readNumber({})).toBeUndefined();
    expect(readNumber([])).toBeUndefined();
  });
});

describe("readStringArray", () => {
  it("returns array of valid strings", () => {
    expect(readStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("filters non-strings + empty strings", () => {
    expect(readStringArray(["a", 1, null, "", "  ", "b"])).toEqual(["a", "b"]);
  });

  it("returns empty array for non-array", () => {
    expect(readStringArray("not array")).toEqual([]);
    expect(readStringArray(null)).toEqual([]);
    expect(readStringArray(undefined)).toEqual([]);
    expect(readStringArray({ a: 1 })).toEqual([]);
  });

  it("handles AI-returned realistic skills array", () => {
    const aiOutput = ["React", "TypeScript", "  Next.js  ", null, "", "Node.js"];
    expect(readStringArray(aiOutput)).toEqual([
      "React",
      "TypeScript",
      "  Next.js  ",
      "Node.js",
    ]);
  });
});
