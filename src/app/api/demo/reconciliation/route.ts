import { withSession } from "@/lib/demo/bff";
import { isUuid } from "@/lib/demo/guards";
import { proxy, validationError } from "@/lib/demo/proxy";

/** GET: sample reconciliation for one work package. */
export const GET = withSession(async ({ req, sessionId }) => {
  const workPackageId = req.nextUrl.searchParams.get("work_package_id");
  if (!isUuid(workPackageId)) return validationError("work_package_id is required.");
  return proxy("/v1/reconciliation", { sessionId, query: { work_package_id: workPackageId } });
});
