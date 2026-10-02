import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { type DemoFetchInit, type DemoFetchResult, type DemoPath, demoFetch } from "./api";
import { BffError, type SessionContext, errorJson, noStore, withSession } from "./bff";

// Thin forwarding for the P3 BFF routes: status, Idempotent-Replayed and no-store pass through;
// errors are mapped (with the details allowlist) by withSession.
const REPLAY_HEADER = "Idempotent-Replayed";

export function forward(result: DemoFetchResult<unknown>): NextResponse {
  const response = noStore(result.data ?? null, { status: result.status });
  const replayed = result.headers.get(REPLAY_HEADER);
  if (replayed) response.headers.set(REPLAY_HEADER, replayed);
  return response;
}

export async function proxy(path: DemoPath, init: DemoFetchInit): Promise<NextResponse> {
  return forward(await demoFetch(path, init));
}

export const validationError = (message = "The request body is invalid."): NextResponse =>
  errorJson(422, "validation_error", message);

export const invalidId = (): NextResponse => errorJson(400, "invalid_id", "Invalid id.");

export function rejectBody(message?: string): never {
  throw new BffError(422, "validation_error", message ?? "The request body is invalid.");
}

type RouteContext<P> = { params: Promise<P> };

/** withSession for dynamic segments: guards run before params are looked at. */
export function withParams<P>(handler: (ctx: SessionContext, params: P) => Promise<NextResponse>) {
  return (req: NextRequest, { params }: RouteContext<P>): Promise<NextResponse> =>
    withSession(async (ctx) => handler(ctx, await params))(req);
}
