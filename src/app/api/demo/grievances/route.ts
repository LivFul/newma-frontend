import { DemoApiError, demoFetch } from "@/lib/demo/api";
import { isSafeId, readForm, seeOther, withSession } from "@/lib/demo/bff";
import {
  GRIEVANCE_REDIRECT_ERRORS,
  type GrievanceRedirectError,
  grievanceFromForm,
  parseGrievanceListQuery,
  parseGrievanceRequest,
} from "@/lib/demo/parse-grievances";
import { proxy, validationError } from "@/lib/demo/proxy";

const PAGE = "/demo/w10-custodian";
const redirectError = (code: GrievanceRedirectError) => seeOther(`${PAGE}?error=${code}`);

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
  const body = parseGrievanceRequest(grievanceFromForm(await readForm(req)));
  if (!body) return redirectError("validation_error");
  try {
    const { data } = await demoFetch<{ id?: unknown }>("/v1/grievances", {
      method: "POST",
      body,
      sessionId,
    });
    const id = typeof data?.id === "string" && isSafeId(data.id) ? data.id : "1";
    return seeOther(`${PAGE}?raised=${id}`);
  } catch (error) {
    // An invalid session still takes the JSON path, which clears the cookie.
    if (error instanceof DemoApiError && error.isInvalidSession) throw error;
    if (!(error instanceof DemoApiError) || error.status >= 500) {
      console.error("demo grievance form failed", error);
    }
    return redirectError(redirectCode(error));
  }
});
