import type { AssetEvidence, FieldDisclosure } from "@/lib/demo/types";

/**
 * What the client-side export form may receive: ids, stage, purpose and field labels. Values never
 * cross into a client component (they would be serialised into the page payload).
 */
export type ExportPackInfo = Readonly<
  Pick<AssetEvidence, "asset_id" | "requested_stage" | "stage" | "purpose"> & {
    fields: readonly Pick<FieldDisclosure, "path" | "label" | "status">[];
  }
>;

export function toExportPackInfo(pack: AssetEvidence): ExportPackInfo {
  return {
    asset_id: pack.asset_id,
    requested_stage: pack.requested_stage,
    stage: pack.stage,
    purpose: pack.purpose,
    fields: pack.fields.map(({ path, label, status }) => ({ path, label, status })),
  };
}
