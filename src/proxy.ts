import { type NextRequest, NextResponse } from "next/server";
import { buildCsp } from "@/lib/security/csp";

// Per-request CSP nonce for the dynamically rendered pages (A-P4-16; rationale in
// src/lib/security/csp.ts). The policy goes on the request, where Next reads the nonce and stamps it
// on its scripts, and on the response as Content-Security-Policy-Report-Only. Static pages get the
// nonce-free policy from next.config.ts, which skips these paths so no page carries two policies.
const HEADER = "Content-Security-Policy-Report-Only";
const NONCE_BYTES = 16;

function newNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(NONCE_BYTES));
  return btoa(String.fromCharCode(...bytes));
}

export function proxy(request: NextRequest): NextResponse {
  const policy = buildCsp({
    nodeEnv: process.env.NODE_ENV,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    nonce: newNonce(),
  });
  const headers = new Headers(request.headers);
  headers.set(HEADER, policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set(HEADER, policy);
  return response;
}

export const config = {
  matcher: ["/access", "/demo", "/demo/:path*"],
};
