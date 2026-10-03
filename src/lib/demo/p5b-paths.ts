// The P5b Contract-table paths (docs/plans/p5b.md rows 11-17) the pinned OpenAPI spec does not carry
// yet; each repin makes the corresponding member redundant (DemoPath is a union).
export type P5bPendingPath =
  | "/v1/custodian/view"
  | "/v1/grievances"
  | `/v1/grievances/${string}/acknowledge`
  | "/v1/demo/config";
