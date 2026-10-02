import { describe, expect, it } from "vitest";
import { isSameOrigin, stripBypassHeaders } from "../../tests/support/bypass-headers";

describe("isSameOrigin", () => {
  const base = "https://newma-preview.vercel.app";
  it("matches any path on the same scheme, host and port", () => {
    expect(isSameOrigin(`${base}/primitives?x=1`, base)).toBe(true);
  });
  it("rejects other hosts, schemes and ports", () => {
    expect(isSameOrigin("https://third-party.invalid/a", base)).toBe(false);
    expect(isSameOrigin("http://newma-preview.vercel.app/", base)).toBe(false);
    expect(isSameOrigin("http://localhost:3101/", "http://localhost:3100")).toBe(false);
  });
  it("treats an unparseable URL as foreign", () => {
    expect(isSameOrigin("not a url", base)).toBe(false);
  });
});

describe("stripBypassHeaders", () => {
  it("removes both bypass headers case-insensitively and keeps the rest", () => {
    const stripped = stripBypassHeaders({
      accept: "*/*",
      "X-Vercel-Protection-Bypass": "secret",
      "x-vercel-set-bypass-cookie": "true",
    });
    expect(stripped).toEqual({ accept: "*/*" });
  });
  it("returns a new object and leaves the input untouched", () => {
    const input = { "x-vercel-protection-bypass": "secret", accept: "*/*" };
    const stripped = stripBypassHeaders(input);
    expect(stripped).not.toBe(input);
    expect(input["x-vercel-protection-bypass"]).toBe("secret");
  });
});
