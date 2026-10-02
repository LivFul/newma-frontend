// P3 backend paths from the shared contract (docs/plans/p3.md), accepted by demoFetch until the
// generated `paths` carry them. Each D-item's block is deleted when its spec is repinned.
type Id = string;

type W1Paths =
  | "/v1/rights/records"
  | `/v1/rights/records/${Id}`
  | `/v1/rights/records/${Id}/withdraw`
  | "/v1/policy/evaluate"
  | "/v1/retrieval/cache";

type W2Paths =
  | "/v1/taxa"
  | "/v1/compounds"
  | "/v1/observations"
  | "/v1/curation/source-records"
  | "/v1/ingestion/runs"
  | "/v1/curation/queue"
  | `/v1/curation/claims/${Id}/decisions`
  | "/v1/curation/releases";

type W3Paths = "/v1/agent/queries" | `/v1/agent/queries/${Id}`;

type W4Paths =
  | "/v1/candidates"
  | `/v1/candidates/${Id}/gates`
  | `/v1/candidates/${Id}/evidence-packages`
  | `/v1/candidates/${Id}/evidence-packages/diff`
  | `/v1/gates/${Id}/decisions`;

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

type W6Paths =
  | `/v1/provenance/${Id}/${Id}`
  | `/v1/provenance/events/${Id}/manifest`
  | "/v1/provenance/verify"
  | "/v1/demo/provenance/tamper";

export type ContractPath = W1Paths | W2Paths | W3Paths | W4Paths | W5Paths | W6Paths;
