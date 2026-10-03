import "server-only";
import { isSafeId, readJson } from "./bff";
import { invalidId, proxy, validationError, withParams } from "./proxy";

// Route-handler factories for the W7 BFF (Contract A2–A24): every handler checks the path id,
// validates the body with its parser before any upstream call, and forwards through `proxy`
// (status, Idempotent-Replayed and the allow-listed error details pass through).
type Collection = "licenses" | "settlements" | "benefits";

/** POST /api/demo/{collection}/{id}/{action}: id-scoped idempotent action. */
export function postAction(
  collection: Collection,
  action: string,
  parse: (body: unknown) => unknown,
) {
  return withParams<{ id: string }>(async ({ req, sessionId }, { id }) => {
    if (!isSafeId(id)) return invalidId();
    const body = parse(await readJson(req));
    if (!body) return validationError();
    return proxy(`/v1/${collection}/${id}/${action}`, { method: "POST", body, sessionId });
  });
}

/** GET /api/demo/{collection}/{id}[/{suffix}]: one read (polled by the settlement page). */
export function getById(collection: Collection, suffix = "") {
  return withParams<{ id: string }>(async ({ sessionId }, { id }) =>
    isSafeId(id) ? proxy(`/v1/${collection}/${id}${suffix}`, { sessionId }) : invalidId(),
  );
}
