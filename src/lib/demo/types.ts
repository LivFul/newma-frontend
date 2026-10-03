import type { components } from "@/lib/api/generated/schema";
import type { PersonaId } from "@/lib/personas";

type Schemas = components["schemas"];

/** GET /v1/demo/sessions/current. The contract types persona as string; we narrow to PersonaId. */
export type DemoSession = Omit<Schemas["SessionCurrent"], "persona"> & { persona: PersonaId };
export type SessionCreated = Omit<Schemas["SessionCreated"], "persona"> & { persona: PersonaId };
export type ResetResult = Schemas["ResetResult"];
export type DemoErrorEnvelope = Schemas["ErrorResponse"];

// ---------------------------------------------------------------------------------------------
// P3 contract shapes (docs/plans/p3.md Contract table). Hand-derived until the backend spec for
// each D-item lands; then the workflow switches to components["schemas"] (one repin per D-item).
// ---------------------------------------------------------------------------------------------
export type Items<T> = Readonly<{ items: readonly T[] }>;
export type Page<T> = Readonly<{ items: readonly T[]; next_cursor: string | null }>;

export const PURPOSES = [
  "research",
  "commercial",
  "disclosure",
  "model_training",
  "onward_transfer",
] as const satisfies readonly Schemas["PolicyEvaluateRequest"]["purpose"][];
export type Purpose = (typeof PURPOSES)[number];
export const POLICY_ACTIONS = [
  "ingest",
  "retrieve",
  "compute",
  "lab_transfer",
  "export",
  "train",
  "commercialise",
] as const satisfies readonly Schemas["PolicyEvaluateRequest"]["action"][];
export type PolicyAction = (typeof POLICY_ACTIONS)[number];
export const ASSET_TYPES = [
  "taxon",
  "compound",
  "observation",
  "dataset",
] as const satisfies readonly Schemas["PolicyEvaluateRequest"]["asset_type"][];
export type AssetType = (typeof ASSET_TYPES)[number];
export const SUBJECT_TYPES = [
  "taxon",
  "compound",
  "dataset",
] as const satisfies readonly Schemas["RightsRecordCreate"]["subject_type"][];
export type SubjectType = (typeof SUBJECT_TYPES)[number];
export type Decision = Schemas["PolicyDecisionOut"]["decision"];
export type RightsStatus = Schemas["RightsRecordOut"]["status"];

// W1 (D-11): generated from the pinned contract.
export type RightsRecord = Schemas["RightsRecordOut"];
export type CacheEntry = Schemas["CacheEntryOut"];
export type PolicyReason = Schemas["PolicyReasonOut"];
export type PolicyRequest = Schemas["PolicyEvaluateRequest"];
export type PolicyDecision = Schemas["PolicyDecisionOut"];
export type WithdrawResult = Schemas["WithdrawResult"];

// W2 (D-12): generated from the pinned contract.
export type EvidenceRef = Schemas["EvidenceRefOut"];
export type Taxon = Schemas["TaxonOut"];
export type ConstituentRelationship = Schemas["CompoundOut"]["identity_status"];
export type Compound = Schemas["CompoundOut"];
export type Observation = Schemas["ObservationOut"];
export type SourceRecord = Schemas["SourceRecordOut"];
export type ClaimStatus = Schemas["ClaimOut"]["status"];
export type Claim = Schemas["ClaimOut"];
export type IngestionRun = Schemas["IngestionRunOut"];
export type CuratedRelease = Schemas["ReleaseOut"];

export type AgentStepKey =
  | "qualified_procedure"
  | "policy_scope"
  | "retrieval"
  | "hypotheses"
  | "screening_request"
  | "budget_check"
  | "docking_job"
  | "admet_job"
  | "ranking"
  | "work_package_proposal";

// W3 (D-13): generated from the pinned contract.
export type AgentQuery = Schemas["AgentQueryOut"];
export type AgentStep = Schemas["AgentStep"];
export type AgentStepStatus = AgentStep["status"];
export type AgentStatus = AgentQuery["status"];
export type Hypothesis = Schemas["HypothesisOut"];
export type WorkPackageProposal = Schemas["WorkPackageProposal"];
export type AgentQueryRequest = Schemas["AgentQueryCreate"];

// W4 (D-14): generated from the pinned contract.
export const GATE_STAGES = [
  "H0",
  "H1",
  "H2",
  "H3",
  "L1",
  "L2",
  "D",
] as const satisfies readonly Schemas["GateOut"]["stage"][];
export type GateStage = Schemas["GateOut"]["stage"];
export type GateStatus = Schemas["GateOut"]["status"];
export type Candidate = Schemas["CandidateOut"];
export type Gate = Schemas["GateOut"];
export type CandidateGates = Schemas["GateTracker"];
export type GateDecisionValue = Schemas["GateDecisionRequest"]["decision"];
export type GateDecisionRequest = Schemas["GateDecisionRequest"];
export type GateDecision = Schemas["GateDecisionOut"];
export type EvidencePackage = Schemas["EvidencePackageSummary"];
export type EvidenceDiff = Schemas["EvidenceDiffOut"];

// W6 (D-16): generated from the pinned contract.
export const ENTITY_TYPES = [
  "rights_record",
  "policy_decision",
  "claim",
  "curated_release",
  "agent_query",
  "gate",
  "work_package",
  "assay_import",
] as const satisfies readonly Schemas["TimelineOut"]["entity_type"][];
export type EntityType = Schemas["TimelineOut"]["entity_type"];
export type ProvenanceEvent = Schemas["EventOut"];
export type ProvenanceTimeline = Schemas["TimelineOut"];
export type EventManifest = Schemas["ManifestOut"];
export type VerifyResult = Schemas["VerifyOut"];
export type TamperResult = Schemas["TamperOut"];

// W5 (D-15): generated from the pinned contract.
export type MaterialBatch = Schemas["MaterialBatchOut"];

export const LOOP_STATES = [
  "authorization",
  "prioritization",
  "material_gate",
  "assay_request",
  "wet_lab_validation",
  "results_ingestion",
  "evidence_review",
  "assay_gate",
  "confirmed_hit",
  "biological_gate",
  "supported_hit",
  "lead_gate",
  "early_lead",
  "reviewed_update",
  "retraining_review",
  "model_validation",
  "investigation",
  "hold",
  "terminated",
] as const;
export type LoopState = (typeof LOOP_STATES)[number];

export type WorkPackageStatus = Schemas["WorkPackageOut"]["status"];
export type WorkPackage = Schemas["WorkPackageOut"];
export type WorkPackageRequest = Schemas["WorkPackageCreate"];
export type AssayImport = Schemas["AssayImportOut"] & { gate_effect?: Schemas["GateEffect"] };
export type ReconciliationItem = Schemas["ReconItemOut"];
export type Reconciliation = Schemas["ReconciliationOut"];
export type Disposition = Schemas["DispositionRequest"]["disposition"];
export type RetrainingProposal = Schemas["RetrainingProposalOut"];
export type ElnEditResult = Schemas["ElnEditOut"];

// ---------------------------------------------------------------------------------------------
// P5b contract shapes (docs/plans/p5b.md Contract table, rows 1-17). Hand-derived until the backend
// spec for each D-item lands; then the workflow switches to components["schemas"] (repin commits).
// ---------------------------------------------------------------------------------------------
export const EXPORT_PURPOSES = ["research", "commercial"] as const;
export type ExportPurpose = (typeof EXPORT_PURPOSES)[number];
export const FIELD_STATUSES = ["disclosed", "withheld"] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];
export const WITHHELD_CODES = [
  "no_rights_record",
  "consent_withdrawn",
  "rights_disputed",
  "consent_expired",
  "pic_mat_missing",
  "purpose_not_permitted",
  "jurisdiction_mismatch",
  "restricted_field",
  "stage_not_passed",
] as const;
export type WithheldCode = (typeof WITHHELD_CODES)[number];
export const EXPORT_STATUSES = ["active", "expired", "suspended"] as const;
export type ExportStatus = (typeof EXPORT_STATUSES)[number];
export const LOCK_STATES = ["open", "locked"] as const;
export type LockState = (typeof LOCK_STATES)[number];
export const CHANGE_OUTCOMES = [
  "updated_open_version",
  "new_protocol_version",
  "unchanged",
] as const;
export type ChangeOutcome = (typeof CHANGE_OUTCOMES)[number];
export const OBLIGATION_STATUSES = ["fulfilled", "due", "overdue"] as const;
export type ObligationStatus = (typeof OBLIGATION_STATUSES)[number];
export const GRIEVANCE_CATEGORIES = [
  "obligation_not_met",
  "use_outside_agreement",
  "consent_concern",
  "benefit_not_received",
  "other",
] as const;
export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];
export const GRIEVANCE_STATUSES = ["open", "acknowledged"] as const;
export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export type FieldDisclosure = Readonly<{
  path: string;
  section: string;
  label: string;
  status: FieldStatus;
  value: unknown;
  withheld_reason: Readonly<{
    code: WithheldCode;
    message: string;
    rights_record_id: string | null;
  }> | null;
  synthetic: true;
}>;

export type AssetEvidence = Readonly<{
  asset_id: string;
  display_id: string;
  label: "Synthetic";
  purpose: ExportPurpose;
  requested_stage: GateStage | null;
  stage: GateStage | null;
  gate_status: GateStatus | null;
  released: boolean;
  not_released_reason: Readonly<{ code: string; message: string }> | null;
  package_version: number | null;
  content_sha256: string | null;
  available_stages: readonly Readonly<{
    stage: GateStage;
    version: number;
    gate_status: GateStatus;
    released: boolean;
  }>[];
  policy: Readonly<{
    decision: Decision;
    reasons: readonly PolicyReason[];
    rights_record_ids: readonly string[];
    policy_version: string;
  }>;
  fields: readonly FieldDisclosure[];
  generated_at: string;
  synthetic: true;
}>;

export type ExportRecord = Readonly<{
  id: string;
  asset_id: string;
  display_id: string;
  stage: GateStage;
  package_version: number;
  recipient: string;
  purpose: ExportPurpose;
  expires_at: string;
  status: ExportStatus;
  created_at: string;
  created_by_persona: string;
  policy_decision_id: string;
  event_id: string;
  body_sha256: string;
  disclosed: readonly FieldDisclosure[];
  withheld: readonly FieldDisclosure[];
  suspended_reasons: readonly PolicyReason[];
  signature_label: string;
  synthetic: true;
}>;

export type ExportSummary = Readonly<{
  id: string;
  asset_id: string;
  display_id: string;
  stage: GateStage;
  recipient: string;
  purpose: ExportPurpose;
  expires_at: string;
  status: ExportStatus;
  created_at: string;
  disclosed_count: number;
  withheld_count: number;
}>;

export type Thresholds = Readonly<{
  potency_um_max: number;
  replicates_min: number;
  controls_required: boolean;
  note?: string;
}>;

export type CampaignSummary = Readonly<{
  id: string;
  name: string;
  protocol_version: number;
  lock_state: LockState;
  credit_quota: number;
  committed: number;
  remaining: number;
  exhausted: boolean;
  unit: string;
  synthetic: true;
}>;

export type CharterVersion = Readonly<{
  version: number;
  thresholds: Thresholds;
  locked: boolean;
  bound_candidate_count: number;
  revision: number;
  change_reason: string;
  supersedes_version: number | null;
  created_by_persona: string;
  created_at: string;
  event_id: string | null;
}>;

export type CharterOut = Readonly<{
  id: string;
  name: string;
  protocol_version: number;
  lock_state: LockState;
  bound_candidate_count: number;
  thresholds: Thresholds;
  credit_quota: number;
  versions: readonly CharterVersion[];
  synthetic: true;
}>;

export type CharterChange = Readonly<{
  outcome: ChangeOutcome;
  previous_version: number;
  charter: CharterOut;
  event_id: string | null;
}>;

export type CreditUsage = Readonly<{
  campaign_id: string;
  unit: string;
  credit_quota: number;
  committed: number;
  spent: number;
  reserved: number;
  remaining: number;
  exhausted: boolean;
  by_kind: readonly Readonly<{ kind: string; jobs: number; credits: number }>[];
  jobs: readonly Readonly<{
    job_id: string;
    kind: string;
    state: string;
    credits: number;
    counted_as: "spent" | "reserved";
  }>[];
  synthetic: true;
}>;

export type Grievance = Readonly<{
  id: string;
  rights_record_id: string;
  subject_display_name: string;
  obligation_id: string | null;
  category: GrievanceCategory;
  category_text: string;
  description: string;
  status: GrievanceStatus;
  raised_by_persona: string;
  raised_at: string;
  acknowledged_at: string | null;
  acknowledged_by_persona: string | null;
  event_id: string;
}>;

export type CustodianObligation = Readonly<{
  id: string;
  text: string;
  due_on: string | null;
  status: ObligationStatus;
  status_text: string;
  fulfilled_on: string | null;
}>;

export type CustodianUse = Readonly<{ purpose: Purpose; text: string }>;

export type CustodianAgreement = Readonly<{
  rights_record_id: string;
  title: string;
  authority: string;
  status: RightsStatus;
  status_text: string;
  validity_text: string;
  uses_allowed: readonly CustodianUse[];
  uses_not_allowed: readonly CustodianUse[];
  obligations: readonly CustodianObligation[];
  grievances: readonly Grievance[];
  can_raise_grievance: boolean;
}>;

export type CustodianView = Readonly<{
  generated_at: string;
  summary: Readonly<{
    agreements: number;
    uses_allowed: number;
    obligations: number;
    obligations_fulfilled: number;
    obligations_overdue: number;
    open_grievances: number;
  }>;
  agreements: readonly CustodianAgreement[];
  synthetic: true;
}>;

export type DemoConfig = Readonly<{
  speed_factor: number;
  speed_source: "server_default" | "tenant_override";
  server_speed_factor: number;
  min_speed_factor: 1;
  max_speed_factor: 10;
}>;

/** A rights record as W1 reads it once the backend adds the grievance counter (row 15). */
export type RightsRecordWithGrievances = RightsRecord & { open_grievance_count?: number };
