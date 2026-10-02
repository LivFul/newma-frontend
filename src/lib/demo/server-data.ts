import "server-only";
import { DemoApiError, type DemoFetchInit, type DemoPath } from "./api";
import type { ClientError } from "./client";
import { requireSessionFetch } from "./current-session";

// Page-side reads: a backend 4xx becomes a renderable error (code + message, no details) so a
// workflow page degrades to a notice instead of an error boundary. Redirects still propagate.
export type Loaded<T> = Readonly<{ data?: T; error?: ClientError }>;

const UPSTREAM: ClientError = {
  code: "upstream_error",
  message: "The demo backend is unavailable",
};

const isNextControlFlow = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  typeof (error as { digest?: unknown }).digest === "string" &&
  /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test((error as { digest: string }).digest);

export async function load<T>(
  path: DemoPath,
  init: Omit<DemoFetchInit, "sessionId"> = {},
): Promise<Loaded<T>> {
  try {
    const { data } = await requireSessionFetch<T>(path, init);
    return { data };
  } catch (error) {
    if (isNextControlFlow(error)) throw error;
    if (error instanceof DemoApiError && error.status < 500) {
      return { error: { code: error.code, message: error.message } };
    }
    console.error("demo page read failed", error);
    return { error: UPSTREAM };
  }
}
