import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, proxy } from "@/proxy";

const HEADER = "content-security-policy-report-only";
const nonceOf = (policy: string | null) => /'nonce-([^']+)'/.exec(policy ?? "")?.[1];

describe("proxy: per-request CSP nonce on the dynamic surfaces", () => {
  it("sets a nonce-based Report-Only policy on the response and forwards it to rendering", () => {
    const response = proxy(new NextRequest("http://localhost/demo/w1-rights"));
    const policy = response.headers.get(HEADER);
    expect(policy).toContain("'strict-dynamic'");
    expect(policy).not.toContain("'unsafe-inline' ");
    const nonce = nonceOf(policy);
    expect(nonce).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
    // NextResponse.next({ request }) carries overridden request headers to the renderer this way,
    // and Next reads the nonce from the request's CSP header.
    expect(response.headers.get(`x-middleware-request-${HEADER}`)).toBe(policy);
    expect(response.headers.get("x-middleware-override-headers")).toContain(HEADER);
  });

  it("generates a fresh nonce for every request", () => {
    const a = nonceOf(proxy(new NextRequest("http://localhost/access")).headers.get(HEADER));
    const b = nonceOf(proxy(new NextRequest("http://localhost/access")).headers.get(HEADER));
    expect(a).not.toBe(b);
  });

  it("runs only on the dynamically rendered pages: /access and /demo/*", () => {
    expect(config.matcher).toEqual(["/access", "/demo", "/demo/:path*"]);
  });
});
