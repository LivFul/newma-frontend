import { DemoApiError, demoFetch } from "@/lib/demo/api";
import { BffError, isSafeId, readForm, seeOther, withSession } from "@/lib/demo/bff";
import { EXPIRED_ROUTE } from "@/lib/demo/routes";
import {
  GRIEVANCE_REDIRECT_ERRORS,
  type GrievanceRedirectError,
  grievanceFromForm,
  parseGrievanceListQuery,
  parseGrievanceRequest,
} from "@/lib/demo/parse-grievances";
import { proxy, validationError } from "@/lib/demo/proxy";

const PAGE = "/demo/w10-custodian";
// The fragment lands the reader on the notice; `for` reopens the form that failed (record ids only).
const OUTCOME = "#outcome";
function redirectError(code: GrievanceRedirectError, recordId?: string) {
  const form = recordId && isSafeId(recordId) ? `&for=${recordId}` : "";
  return seeOther(`${PAGE}?error=${code}${form}${OUTCOME}`);
}

/** Only allow-listed codes travel in the redirect; anything else reads as upstream_error. */
function redirectCode(error: unknown): GrievanceRedirectError {
  const code = error instanceof DemoApiError && error.status < 500 ? error.code : undefined;
  return GRIEVANCE_REDIRECT_ERRORS.find((known) => known === code) ?? "upstream_error";
}

/** GET: the grievance queue (community liaison, data steward, tenant admin). */
export const GET = withSession(async ({ req, sessionId }) => {
  const query = parseGrievanceListQuery(req.nextUrl.searchParams);
  if (!query) return validationError("Unknown status or record id.");
  return proxy("/v1/grievances", { sessionId, query });
});

/**
 * POST (plain HTML form, works without JS): creates the grievance and answers 303 back to W10.
 * The redirect carries the new id or an allow-listed error code, never the typed description.
 */
export const POST = withSession(async ({ req, sessionId }) => {
  let form: URLSearchParams;
  try {
    form = await readForm(req);
  } catch (error) {
    if (error instanceof BffError && error.status === 413) return redirectError("validation_error");
    throw error;
  }
  const recordId = form.get("rights_record_id") ?? undefined;
  const body = parseGrievanceRequest(grievanceFromForm(form));
  if (!body) return redirectError("validation_error", recordId);
  try {
    const { data } = await demoFetch<{ id?: unknown }>("/v1/grievances", {
      method: "POST",
      body,
      sessionId,
    });
    const id = typeof data?.id === "string" && isSafeId(data.id) ? data.id : "1";
    return seeOther(`${PAGE}?raised=${id}${OUTCOME}`);
  } catch (error) {
    // An expired session goes through the route that clears the cookie, not a JSON error page.
    if (error instanceof DemoApiError && error.isInvalidSession) return seeOther(EXPIRED_ROUTE);
    if (!(error instanceof DemoApiError) || error.status >= 500) {
      console.error("demo grievance form failed", error);
    }
    return redirectError(redirectCode(error), recordId);
  }
});
