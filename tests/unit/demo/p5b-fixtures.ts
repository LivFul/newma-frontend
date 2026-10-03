// Builders for the P5b Contract shapes used by the W8-W10 component tests.
import type {
  AssetEvidence,
  CampaignSummary,
  CharterOut,
  CreditUsage,
  ExportRecord,
  FieldDisclosure,
  Grievance,
  Thresholds,
} from "@/lib/demo/types";

export const disclosedField = (over: Partial<FieldDisclosure> = {}): FieldDisclosure => ({
  path: "identity.name",
  section: "identity",
  label: "Compound name",
  status: "disclosed",
  value: "Synthetic compound alpha",
  withheld_reason: null,
  synthetic: true,
  ...over,
});

export const withheldField = (over: Partial<FieldDisclosure> = {}): FieldDisclosure => ({
  path: "provenance.collection_location",
  section: "provenance",
  label: "Collection location",
  status: "withheld",
  value: null,
  withheld_reason: {
    code: "restricted_field",
    message: "This field is never disclosed.",
    rights_record_id: null,
  },
  synthetic: true,
  ...over,
});

export const evidence = (over: Partial<AssetEvidence> = {}): AssetEvidence => ({
  asset_id: "asset-1",
  display_id: "DEMO-C-001",
  label: "Synthetic",
  purpose: "research",
  requested_stage: null,
  stage: "H1",
  gate_status: "PASS",
  released: true,
  not_released_reason: null,
  package_version: 1,
  content_sha256: "a".repeat(64),
  available_stages: [
    { stage: "H1", version: 1, gate_status: "PASS", released: true },
    { stage: "H2", version: 1, gate_status: "HOLD", released: false },
  ],
  policy: {
    decision: "allow",
    reasons: [
      {
        code: "rights_valid_for_purpose",
        message: "Rights are valid for this purpose.",
        rights_record_id: "rec-1",
        remediation: null,
      },
    ],
    rights_record_ids: ["rec-1"],
    policy_version: "demo-policy-1",
  },
  fields: [disclosedField(), withheldField()],
  generated_at: "2030-01-01T00:00:00Z",
  synthetic: true,
  ...over,
});

export const exportRecord = (over: Partial<ExportRecord> = {}): ExportRecord => ({
  id: "exp-1",
  asset_id: "asset-1",
  display_id: "DEMO-C-001",
  stage: "H1",
  package_version: 1,
  recipient: "Partner Biologics A — fictional",
  purpose: "research",
  expires_at: "2030-02-01T00:00:00Z",
  status: "active",
  created_at: "2030-01-01T00:00:00Z",
  created_by_persona: "partner",
  policy_decision_id: "dec-1",
  event_id: "evt-1",
  body_sha256: "b".repeat(64),
  disclosed: [disclosedField()],
  withheld: [withheldField()],
  suspended_reasons: [],
  signature_label: "Demo signature, not production key",
  synthetic: true,
  ...over,
});

export const thresholds = (over: Partial<Thresholds> = {}): Thresholds => ({
  potency_um_max: 10,
  replicates_min: 3,
  controls_required: true,
  ...over,
});

export const charter = (over: Partial<CharterOut> = {}): CharterOut => ({
  id: "camp-1",
  name: "Synthetic campaign — fictional",
  protocol_version: 1,
  lock_state: "locked",
  bound_candidate_count: 4,
  thresholds: thresholds(),
  credit_quota: 1000,
  versions: [
    {
      version: 1,
      thresholds: thresholds(),
      locked: true,
      bound_candidate_count: 4,
      revision: 1,
      change_reason: "Initial synthetic protocol",
      supersedes_version: null,
      created_by_persona: "tenant_admin",
      created_at: "2030-01-01T00:00:00Z",
      event_id: "evt-c1",
    },
  ],
  synthetic: true,
  ...over,
});

export const campaign = (over: Partial<CampaignSummary> = {}): CampaignSummary => ({
  id: "camp-1",
  name: "Synthetic campaign — fictional",
  protocol_version: 1,
  lock_state: "locked",
  credit_quota: 1000,
  committed: 200,
  remaining: 800,
  exhausted: false,
  unit: "demo credits",
  synthetic: true,
  ...over,
});

export const usage = (over: Partial<CreditUsage> = {}): CreditUsage => ({
  campaign_id: "camp-1",
  unit: "demo credits",
  credit_quota: 1000,
  committed: 200,
  spent: 150,
  reserved: 50,
  remaining: 800,
  exhausted: false,
  by_kind: [
    { kind: "screening", jobs: 3, credits: 150 },
    { kind: "admet", jobs: 1, credits: 50 },
  ],
  jobs: [
    { job_id: "job-1", kind: "screening", state: "SUCCEEDED", credits: 50, counted_as: "spent" },
    { job_id: "job-2", kind: "admet", state: "RUNNING", credits: 50, counted_as: "reserved" },
  ],
  synthetic: true,
  ...over,
});

export const grievance = (over: Partial<Grievance> = {}): Grievance => ({
  id: "grv-1",
  rights_record_id: "rec-1",
  subject_display_name: "Exemplaria viridis — fictional",
  obligation_id: null,
  category: "obligation_not_met",
  category_text: "A promise in the agreement was not kept",
  description: "The promised report did not arrive.",
  status: "open",
  raised_by_persona: "community_liaison",
  raised_at: "2030-01-01T00:00:00Z",
  acknowledged_at: null,
  acknowledged_by_persona: null,
  event_id: "evt-g1",
  ...over,
});
