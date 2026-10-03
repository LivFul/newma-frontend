// Browser-side calls to the BFF (never to the API). Returns a tagged result instead of throwing.
export type ClientError = Readonly<{ code: string; message: string; details?: unknown }>;

export type ClientResult<T> =
  | Readonly<{ ok: true; status: number; data: T; replayed: boolean }>
  | Readonly<{ ok: false; status: number; error: ClientError }>;

const NETWORK_ERROR: ClientError = {
  code: "network_error",
  message: "The demo could not be reached. Try again.",
};

function toError(status: number, body: unknown): ClientError {
  if (typeof body === "object" && body !== null) {
    const { code, message, details } = body as Partial<ClientError>;
    if (typeof code === "string" && typeof message === "string") {
      return details === undefined ? { code, message } : { code, message, details };
    }
  }
  return { code: "upstream_error", message: `The request failed (${status}).` };
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<ClientResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok)
    return { ok: false, status: response.status, error: toError(response.status, body) };
  const replayed = response.headers.get("idempotent-replayed") === "true";
  return { ok: true, status: response.status, data: body as T, replayed };
}

/** POST JSON; an undefined body sends no body (for action routes such as execute). */
export function postJson<T>(url: string, body: unknown): Promise<ClientResult<T>> {
  if (body === undefined) return requestJson<T>(url, { method: "POST" });
  return requestJson<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
