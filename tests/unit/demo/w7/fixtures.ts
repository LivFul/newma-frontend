// Contract-shaped W7 fixtures (docs/plans/p5a.md): synthetic, fictional, integer demo credits.
import type {
  AgreementView,
  Anchor,
  Calculation,
  Commitment,
  License,
  LicenseOptions,
  Receipt,
  Settlement,
} from "@/lib/demo/types";

export const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const SHA = "c".repeat(64);

export const agreement = (over: Partial<AgreementView> = {}): AgreementView => ({
  id: UUID(1),
  version: 2,
  rights_record_id: UUID(2),
  authority: "Community Cooperative A, fictional",
  illustrative: true,
  unit: "demo credits",
  rules: [
    {
      beneficiary_id: "b-a",
      beneficiary_display_name: "Community Cooperative A, fictional",
      basis: "net_demo_credits",
      share_basis_points: 2500,
    },
    {
      beneficiary_id: "b-b",
      beneficiary_display_name: "Community Cooperative B, fictional",
      basis: "net_demo_credits",
      share_basis_points: 1500,
    },
  ],
  reserve_basis_points: 6000,
  nonmonetary_benefits: ["training_workshop"],
  latest: true,
  ...over,
});

export const options = (): LicenseOptions => ({
  agreements: [agreement(), agreement({ id: UUID(9), version: 1, latest: false })],
  licensee_organizations: [{ id: UUID(3), display_name: "Demo Biopharma Partner, fictional" }],
  credentials: [
    { credential_ref: "DEMO-CRED-VALID-001", description: "Valid (fictional)" },
    { credential_ref: "DEMO-CRED-EXPIRED-001", description: "Expired (fictional)" },
  ],
});

export const license = (over: Partial<License> = {}): License => ({
  id: UUID(10),
  display_id: "DEMO-L-001",
  agreement: agreement(),
  licensee_organization_id: UUID(3),
  licensee_display_name: "Demo Biopharma Partner, fictional",
  purpose: "research",
  scope_summary: "Illustrative research scope",
  term_months: 12,
  status: "requested",
  next_actions: ["credential_check", "decide"],
  credential: {
    status: "not_requested",
    label: "Optional, simulated",
    credential_ref: "DEMO-CRED-VALID-001",
    proof_ref: null,
    reason: null,
    checked_at: null,
  },
  decision: null,
  requested_by_persona: "partner",
  event_id: UUID(11),
  created_at: "2030-01-01T00:00:00Z",
  ...over,
});

export const receipt = (over: Partial<Receipt> = {}): Receipt => ({
  id: UUID(20),
  settlement_id: UUID(30),
  external_ref: "DEMO-R-001",
  amount_demo_credits: 400,
  status: "recorded",
  duplicate_of: null,
  dispute_reason: null,
  recorded_by_persona: "finance",
  created_at: "2030-01-01T00:00:00Z",
  ...over,
});

export const calculation = (over: Partial<Calculation> = {}): Calculation => ({
  distributable_demo_credits: 600,
  held_demo_credits: 0,
  lines: [
    {
      kind: "beneficiary",
      beneficiary_id: "b-a",
      beneficiary_display_name: "Community Cooperative A, fictional",
      share_basis_points: 2500,
      amount_demo_credits: 150,
    },
    {
      kind: "beneficiary",
      beneficiary_id: "b-b",
      beneficiary_display_name: "Community Cooperative B, fictional",
      share_basis_points: 1500,
      amount_demo_credits: 90,
    },
    {
      kind: "reserve",
      beneficiary_id: null,
      beneficiary_display_name: null,
      share_basis_points: 6000,
      amount_demo_credits: 360,
    },
    {
      kind: "residual",
      beneficiary_id: null,
      beneficiary_display_name: null,
      share_basis_points: 0,
      amount_demo_credits: 0,
    },
  ],
  sha256: SHA,
  frozen: false,
  label: "Illustrative",
  ...over,
});

export const anchor = (over: Partial<Anchor> = {}): Anchor => ({
  status: "not_requested",
  label: "Optional, simulated",
  job_id: null,
  job_state: null,
  receipt_ref: null,
  manifest_sha256: null,
  requested_at: null,
  anchored_at: null,
  ...over,
});

export const commitment = (over: Partial<Commitment> = {}): Commitment => ({
  event_id: UUID(40),
  manifest_sha256: "d".repeat(64),
  signature: "sig".repeat(30),
  kid: "demo-key-1",
  signature_label: "Demo signature, not production key",
  committed_at: "2030-01-02T00:00:00Z",
  summary: {
    distributable_demo_credits: 600,
    ledger_total_demo_credits: 600,
    rules_sha256: "1".repeat(64),
    receipts_sha256: "2".repeat(64),
    ledger_sha256: "3".repeat(64),
  },
  ...over,
});

export const settlement = (over: Partial<Settlement> = {}): Settlement => ({
  id: UUID(30),
  display_id: "DEMO-S-002",
  license_id: UUID(10),
  license_display_id: "DEMO-L-001",
  agreement: agreement(),
  state: "reviewed",
  next_actions: ["record_receipt", "dispute", "evidence_approval"],
  receipts: [receipt({ amount_demo_credits: 600 })],
  totals: { recorded_demo_credits: 600, held_demo_credits: 0, duplicate_count: 0 },
  calculation: calculation(),
  approvals: { required: 2, eligible_personas: ["finance", "tenant_admin"], items: [] },
  ledger: [],
  commitment: null,
  anchor: anchor(),
  history: [
    {
      from: null,
      event: "submit",
      to: "submitted",
      persona: "finance",
      at: "2030-01-01T00:00:00Z",
    },
  ],
  seeded_example: false,
  created_at: "2030-01-01T00:00:00Z",
  ...over,
});
