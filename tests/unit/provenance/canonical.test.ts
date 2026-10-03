// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CanonicalJsonError,
  canonicalJson,
  hasIntegralFloatRisk,
} from "@/lib/provenance/canonical";
import { sha256Hex } from "@/lib/provenance/sha256";

type Vector = { name: string; input: unknown; canonical: string; sha256: string; scope?: string };
const vectors: Vector[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/canonical/vectors.json"), "utf8"),
);

// "python_only" vectors hold integral floats / -0.0, which JavaScript cannot represent after a
// JSON round trip; the browser must flag them (hasIntegralFloatRisk), never claim a match.
const shared = vectors.filter((v) => v.scope !== "python_only");
const pythonOnly = vectors.filter((v) => v.scope === "python_only");

describe("canonicalJson matches the backend vectors byte-for-byte", () => {
  it("has vectors", () => expect(shared.length).toBeGreaterThan(0));

  it.each(shared.map((v) => [v.name, v] as const))("%s", async (_name, vector) => {
    const canonical = canonicalJson(vector.input);
    expect(canonical).toBe(vector.canonical);
    expect(await sha256Hex(canonical)).toBe(vector.sha256);
  });

  it.each(pythonOnly.map((v) => [v.name, v] as const))(
    "%s (python_only) differs in the browser and is detectable in the server's canonical text",
    (_name, vector) => {
      expect(canonicalJson(vector.input)).not.toBe(vector.canonical);
      expect(hasIntegralFloatRisk(vector.canonical)).toBe(true);
    },
  );
});

describe("canonicalJson rules", () => {
  it("sorts keys by code point, not UTF-16 units (non-BMP vs U+FFFD)", () => {
    // U+1F33F is 0xD83C 0xDF3F in UTF-16 (sorts before U+FFFD by unit) but after it by code point.
    expect(canonicalJson({ "🌿": 1, "�": 2, a: 3 })).toBe('{"a":3,"�":2,"🌿":1}');
  });

  it("escapes like Python json.dumps(ensure_ascii=False)", () => {
    expect(canonicalJson({ s: 'q"b\\n\n\r\t\b\f\u0001\u001f\u007f—' })).toBe(
      '{"s":"q\\"b\\\\n\\n\\r\\t\\b\\f\\u0001\\u001f\u007f—"}',
    );
  });

  it.each([
    [1.5, "1.5"],
    [0.1, "0.1"],
    [-2.5, "-2.5"],
    [1e21, "1e+21"],
    [1.5e-5, "1.5e-05"],
    [0.0001, "0.0001"],
    [123.456, "123.456"],
    [1e-7, "1e-07"],
    [42, "42"],
    [-9007199254740991, "-9007199254740991"],
  ])("formats %d as Python repr/int %s", (value, text) => {
    expect(canonicalJson(value)).toBe(text);
  });

  it.each([NaN, Infinity, -Infinity, undefined, () => 1, Symbol("x"), BigInt(1)])(
    "rejects %s",
    (value) => {
      expect(() => canonicalJson({ v: value })).toThrow(CanonicalJsonError);
    },
  );

  it("rejects lone surrogates (Python cannot UTF-8 encode them)", () => {
    expect(() => canonicalJson({ s: "\uD800" })).toThrow(CanonicalJsonError);
    expect(() => canonicalJson({ ["\uDC00"]: 1 })).toThrow(CanonicalJsonError);
  });

  it.each([2 ** 53, -(2 ** 53), 1e16, 1e20, 123456789012345680000])(
    "throws on the integral number %s beyond ±(2^53−1): int or float is ambiguous after JSON.parse (A-P3-F06)",
    (value) => {
      expect(() => canonicalJson({ v: value })).toThrow(CanonicalJsonError);
    },
  );

  it("keeps the vector's float 1e+21 (every double above 2^53 is integral, so only >= 1e21 is allowed)", () => {
    expect(canonicalJson(1e21)).toBe("1e+21");
  });

  it("detects the JSON round-trip limitation: a parsed 1.0 is not the Python float 1.0", () => {
    // The backend writes the float 1.0 as `1.0`; after JSON.parse it is the integer 1, so the
    // browser's canonical form differs and the workbench reports the mismatch (M2).
    const roundTripped = canonicalJson(JSON.parse('{"a":1.0}'));
    expect(roundTripped).toBe('{"a":1}');
    expect(roundTripped).not.toBe('{"a":1.0}');
    expect(hasIntegralFloatRisk('{"a":1.0}')).toBe(true);
    expect(hasIntegralFloatRisk('{"a":-0.0,"b":2e0}')).toBe(true);
    expect(hasIntegralFloatRisk('{"a":1,"b":1.5,"s":"1.0"}')).toBe(false);
  });

  it("prints negative zero as Python float -0.0 (a Python int is never -0)", () => {
    expect(canonicalJson(-0)).toBe("-0.0");
  });

  it("rejects nesting deeper than the cap (no stack overflow on hostile input)", () => {
    const deep = Array.from({ length: 200 }).reduce<unknown>((inner) => ({ a: inner }), 1);
    expect(() => canonicalJson(deep)).toThrow(CanonicalJsonError);
  });

  it("does not mutate its input", () => {
    const input = Object.freeze({ b: Object.freeze([2, 1]), a: 1 });
    expect(canonicalJson(input)).toBe('{"a":1,"b":[2,1]}');
  });
});

describe("sha256Hex", () => {
  it("hashes UTF-8 bytes", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    const expected = createHash("sha256").update("植物 — 🌿", "utf8").digest("hex");
    expect(await sha256Hex("植物 — 🌿")).toBe(expected);
  });
});
