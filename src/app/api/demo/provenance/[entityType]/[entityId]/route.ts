import { isSafeId } from "@/lib/demo/bff";
import { isEntityType } from "@/lib/demo/parse-provenance";
import { invalidId, proxy, validationError, withParams } from "@/lib/demo/proxy";

type Params = { entityType: string; entityId: string };

/** GET: the append-only signed event timeline of one entity (ascending seq). */
export const GET = withParams<Params>(async ({ sessionId }, { entityType, entityId }) => {
  if (!isEntityType(entityType)) return validationError("Unknown entity type.");
  if (!isSafeId(entityId)) return invalidId();
  return proxy(`/v1/provenance/${entityType}/${entityId}`, { sessionId });
});
