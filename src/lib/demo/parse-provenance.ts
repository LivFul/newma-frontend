import { isNonEmptyString, isRecord, oneOf } from "./guards";
import { isSafeId } from "./safe-id";
import { ENTITY_TYPES } from "./types";

export const isEntityType = oneOf(ENTITY_TYPES);

const MAX_SIGNATURE = 512;

/** Verify body: the manifest object (original or tampered), its signature and key id. */
export function parseVerify(body: unknown) {
  if (!isRecord(body) || !isRecord(body.manifest)) return undefined;
  const { signature, kid } = body;
  if (!isNonEmptyString(signature) || signature.length > MAX_SIGNATURE) return undefined;
  if (!isNonEmptyString(kid) || !isSafeId(kid)) return undefined;
  return { manifest: body.manifest, signature, kid };
}

export function parseTamper(body: unknown) {
  if (!isRecord(body) || typeof body.event_id !== "string" || !isSafeId(body.event_id))
    return undefined;
  return { event_id: body.event_id };
}
