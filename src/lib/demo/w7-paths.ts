// W7 (D-17) API paths, widening DemoPath until the backend spec carrying them is pinned
// (docs/plans/p5a.md Task 2: `pnpm api:update` removes the need; this file is then deleted).
export type W7Path =
  | "/v1/licenses"
  | `/v1/licenses/${string}`
  | "/v1/settlements"
  | `/v1/settlements/${string}`
  | "/v1/benefits"
  | `/v1/benefits/${string}`
  | "/v1/beneficiaries"
  | "/v1/demo/anchoring/outage";
