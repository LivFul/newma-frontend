import { withSession } from "@/lib/demo/bff";
import { isUuid } from "@/lib/demo/guards";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: benefit items, optionally for one license (UUID). */
export const GET = withSession(async ({ req, sessionId }) => {
  const licenseId = req.nextUrl.searchParams.get("license_id") ?? undefined;
  if (licenseId !== undefined && !isUuid(licenseId)) return validationError("Invalid license_id.");
  return proxy("/v1/benefits", { sessionId, query: { license_id: licenseId } });
});
