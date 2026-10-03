// P3 backend paths from the shared contract (docs/plans/p3.md), accepted by demoFetch until the
// generated `paths` carry them. Each D-item's block is deleted when its spec is repinned (D-11 to D-14 and D-16 done).
type Id = string;

type W5Paths =
  | "/v1/material-batches"
  | "/v1/work-packages"
  | `/v1/work-packages/${Id}`
  | "/v1/assay-imports"
  | `/v1/assay-imports/${Id}/acceptance`
  | "/v1/reconciliation"
  | `/v1/reconciliation/items/${Id}/disposition`
  | `/v1/demo/eln/records/${Id}/edit`
  | "/v1/retraining-proposals"
  | `/v1/retraining-proposals/${Id}/execute`;

export type ContractPath = W5Paths;
