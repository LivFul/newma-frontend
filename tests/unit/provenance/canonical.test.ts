// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CanonicalJsonError, canonicalJson } from "@/lib/provenance/canonical";
import { sha256Hex } from "@/lib/provenance/sha256";

type Vector = { name: string; input: unknown; canonical: string; sha256: string };
const vectors: Vector[] = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/canonical/vectors.json"), "utf8"),
);

describe("canonicalJson matches the backend vectors byte-for-byte", () => {
  it("has vectors", () => expect(vectors.length).toBeGreaterThan(0));

  it.each(vectors.map((v) => [v.name, v] as const))("%s", async (_name, vector) => {
    const canonical = canonicalJson(vector.input);
    expect(canonical).toBe(vector.canonical);
    expect(await sha256Hex(canonical)).toBe(vector.sha256);
  });
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
    [1e16, "1e+16"],
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
