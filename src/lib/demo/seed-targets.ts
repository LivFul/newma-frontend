import "server-only";
import { createHash } from "node:crypto";

// The P3 contract has no targets list, but the agent needs a target id. The backend loader clones
// the seed into each session tenant as uuid5(tenant_id, fixture_id) (newma_api/demo/loader.py), so
// the page derives the tenant's ids of the three seeded targets ([Agent assumption A-P3-F01]).
const SEED_TARGETS = [
  { fixture_id: "c36d0680-ff9b-59c5-bbf8-9e86152e25a5", display_name: "Target-α — fictional" },
  { fixture_id: "28be920e-6a2a-5b2b-9caa-5c12330631ba", display_name: "Target-β — fictional" },
  { fixture_id: "eb773722-a440-5289-9f0e-6d0459ad3d97", display_name: "Target-γ — fictional" },
] as const;

export type TargetOption = Readonly<{ id: string; display_name: string }>;

const HEX = /^[0-9a-f]{32}$/;

/** RFC 4122 version-5 UUID (SHA-1), byte-identical to Python's uuid.uuid5. */
export function uuid5(namespace: string, name: string): string {
  const ns = namespace.replaceAll("-", "").toLowerCase();
  if (!HEX.test(ns)) throw new Error("uuid5 namespace must be a UUID");
  const hash = createHash("sha1").update(Buffer.from(ns, "hex")).update(name, "utf8").digest();
  const bytes = Uint8Array.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The tenant's seeded targets; an unexpected tenant id yields none (the form then has no target). */
export function seededTargets(tenantId: string): readonly TargetOption[] {
  try {
    return SEED_TARGETS.map((t) => ({
      id: uuid5(tenantId, t.fixture_id),
      display_name: t.display_name,
    }));
  } catch {
    return [];
  }
}
