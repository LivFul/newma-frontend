// The P5b Contract-table paths (docs/plans/p5b.md rows 1-17), typed here until the pinned OpenAPI
// spec carries them; each repin makes the corresponding member redundant (DemoPath is a union).
export type P5bPendingPath =
  | `/v1/assets/${string}/evidence`
  | "/v1/exports"
  | `/v1/exports/${string}`
  | "/v1/campaigns"
  | `/v1/campaigns/${string}/charter`
  | `/v1/campaigns/${string}/quota`
  | `/v1/campaigns/${string}/credit-usage`
  | "/v1/custodian/view"
  | "/v1/grievances"
  | `/v1/grievances/${string}/acknowledge`
  | "/v1/demo/config";
