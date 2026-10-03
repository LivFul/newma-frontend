import type { components } from "@/lib/api/generated/schema";
import type { EvidenceLabel } from "@/lib/evidence";
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

export type EvidenceRef = Readonly<{
  label: EvidenceLabel;
  claim_id: string | null;
  source_ref: string | null;
}>;

export type Taxon = Readonly<{
  id: string;
  display_name: string;
  accepted_name: string;
  synonyms: readonly string[];
  verification_status: string;
  evidence: readonly EvidenceRef[];
  withheld_fields: readonly string[];
  synthetic: boolean;
}>;

export type ConstituentRelationship =
  | "reported_in_taxon"
  | "detected_in_sample"
  | "tentatively_annotated"
  | "isolated_structure_confirmed";

export type Compound = Readonly<{
  id: string;
  display_id: string;
  identity_status: ConstituentRelationship;
  stereochemistry_status: "defined" | "ambiguous";
  quarantined: boolean;
  evidence: readonly EvidenceRef[];
  withheld_fields: readonly string[];
  synthetic: boolean;
}>;

export type Observation = Readonly<{
  id: string;
  compound_id: string | null;
  target_id: string;
  endpoint: string;
  value: number | null;
  units: string;
  qualifier: string;
  concentration_um: number | null;
  replicate_index: number;
  run_status: string;
  evidence_label: EvidenceLabel;
  out_of_domain: boolean;
  revision: number;
  superseded: boolean;
  withheld_fields: readonly string[];
  synthetic: boolean;
}>;

export type SourceRecord = Readonly<{
  id: string;
  title: string;
  source_type: string;
  source_ref: string;
  clearance_status: "cleared" | "uncleared";
  rights_record_id: string | null;
  synthetic: boolean;
}>;

export type ClaimStatus = "pending_review" | "quarantined" | "approved" | "rejected" | "released";

export type Claim = Readonly<{
  id: string;
  source_record_id: string;
  subject_type: string;
  subject_id: string;
  statement_synthetic: string;
  source_location: string;
  extraction_method: string;
  evidence_label: EvidenceLabel;
  confidence: number;
  status: ClaimStatus;
  quarantine_reason: string | null;
  reviewer_persona: string | null;
  reviewed_at: string | null;
  release_id: string | null;
}>;

export type IngestionRun = Readonly<{
  id: string;
  source_record_id: string;
  policy_decision_id: string;
  claims: readonly Claim[];
}>;

export type CuratedRelease = Readonly<{
  id: string;
  version: number;
  claim_ids: readonly string[];
  manifest_sha256: string;
  event_id: string;
}>;

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

export type AgentStepStatus = "pending" | "running" | "done" | "held" | "failed";
export type AgentStatus = "running" | "held" | "completed" | "failed";

export type Hypothesis = Readonly<{
  rank: number;
  compound_id: string;
  display_id: string;
  target_id: string;
  score_synthetic: number;
  score_label: "Synthetic";
  evidence_label: "computational_prediction";
  uncertainty: number | string;
  limitations: readonly string[];
}>;

export type WorkPackageProposal = Readonly<Record<string, unknown>>;

export type AgentQuery = Readonly<{
  id: string;
  label: "Simulated agent";
  status: AgentStatus;
  objective: string;
  steps: readonly Readonly<{
    key: AgentStepKey;
    title: string;
    status: AgentStepStatus;
    detail: string;
  }>[];
  retrieval_scope: Readonly<{
    included: readonly Readonly<{
      subject_id: string;
      display_name: string;
      evidence_label: EvidenceLabel;
    }>[];
    withheld: readonly Readonly<{ subject_id: string; reason_code: string }>[];
  }>;
  budget: Readonly<{
    requested_credits: number;
    estimated_credits: number;
    remaining_quota: number;
  }>;
  job_ids: readonly string[];
  hypotheses: readonly Hypothesis[];
  work_package_proposal: WorkPackageProposal | null;
  remediation: readonly string[];
  created_at: string;
  updated_at: string;
}>;

export type AgentQueryRequest = Readonly<{
  objective: string;
  target_id: string;
  budget_credits: number;
  idempotency_key: string;
}>;

export const GATE_STAGES = ["H0", "H1", "H2", "H3", "L1", "L2", "D"] as const;
export type GateStage = (typeof GATE_STAGES)[number];
export type GateStatus = "NOT_STARTED" | "PENDING" | "PASS" | "FAIL" | "HOLD" | "INVALIDATED";

export type Candidate = Readonly<{
  id: string;
  compound_id: string;
  display_id: string;
  rank: number;
  current_stage: GateStage;
  last_reviewed_update_at: string | null;
}>;

export type Gate = Readonly<{
  id: string;
  stage: GateStage;
  status: GateStatus;
  missing_requirements: readonly string[];
  checks: readonly Readonly<{ code: string; passed: boolean; message: string }>[];
  rationale: string | null;
  evidence_package_version: number | null;
  decided_at: string | null;
  signature: string | null;
  kid: string | null;
}>;

export type CandidateGates = Readonly<{
  candidate_id: string;
  current_stage: GateStage;
  can_advance_to: GateStage | null;
  gates: readonly Gate[];
}>;

export type GateDecisionValue = "pass" | "fail" | "hold";

export type GateDecisionRequest = Readonly<{
  decision: GateDecisionValue;
  rationale: string;
  evidence_package_version: number;
  confirm_candidate_display_id: string;
  idempotency_key: string;
}>;

export type GateDecision = Readonly<{
  id: string;
  gate_id: string;
  candidate_id: string;
  stage: GateStage;
  decision: GateDecisionValue;
  status_after: GateStatus;
  rationale: string;
  evidence_package_version: number;
  manifest: unknown;
  manifest_sha256: string;
  signature: string;
  kid: string;
  signature_label: string;
  event_id: string;
  decided_at: string;
}>;

export type EvidencePackage = Readonly<{
  version: number;
  stage: GateStage;
  created_at: string;
  content_sha256: string;
}>;

export type EvidenceDiff = Readonly<{
  from_version: number;
  to_version: number;
  added: readonly Readonly<{ path: string; value: unknown }>[];
  removed: readonly Readonly<{ path: string; value: unknown }>[];
  changed: readonly Readonly<{ path: string; before: unknown; after: unknown }>[];
}>;

export const ENTITY_TYPES = [
  "rights_record",
  "policy_decision",
  "claim",
  "curated_release",
  "agent_query",
  "gate",
  "work_package",
  "assay_import",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export type ProvenanceEvent = Readonly<{
  id: string;
  seq: number;
  event_type: string;
  actor_persona: string;
  authority: string;
  occurred_at: string;
  policy_version: string;
  entity_version: number;
  payload: unknown;
  payload_sha256: string;
  signature: string;
  kid: string;
}>;

export type ProvenanceTimeline = Readonly<{
  entity_type: EntityType;
  entity_id: string;
  events: readonly ProvenanceEvent[];
}>;

export type EventManifest = Readonly<{
  event_id: string;
  manifest: unknown;
  canonical: string;
  sha256: string;
  signature: string;
  kid: string;
  signature_label: string;
}>;

export type VerifyResult = Readonly<{ valid: boolean; sha256: string; reasons: readonly string[] }>;

export type TamperResult = Readonly<{
  event_id: string;
  manifest: unknown;
  signature: string;
  kid: string;
  tampered_path: string;
  label: "Demo tamper toggle";
}>;

export type MaterialBatch = Readonly<{
  id: string;
  compound_id: string;
  batch_ref: string;
  quantity_mg: number;
  purity_synthetic: number;
  availability: "available" | "reserved" | "unavailable";
  identity_accepted: boolean;
  synthetic: boolean;
}>;

// TA §3 wet-lab loop states, exactly the backend lab/state_machine.py LAB_STATES.
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

export type WorkPackageStatus =
  "held" | "submitted" | "executing" | "results_available" | "in_review" | "accepted";

export type WorkPackage = Readonly<{
  id: string;
  candidate_id: string;
  material_batch_id: string;
  status: WorkPackageStatus;
  loop_state: LoopState;
  learning_loop_state: LoopState | null;
  material_gate: Readonly<{
    passed: boolean;
    reasons: readonly Readonly<{ code: string; message: string }>[];
  }>;
  eln: Readonly<{ adapter_label: "Mock ELN"; record_id: string; revision: number }> | null;
  job_id: string | null;
  holds: readonly Readonly<{ code: string; disposition: string | null }>[];
  created_at: string;
}>;

export type WorkPackageRequest = Readonly<{
  candidate_id: string;
  material_batch_id: string;
  hypothesis: string;
  assay_endpoint: string;
  protocol_version: string;
  controls: readonly string[];
  concentrations_um: readonly number[];
  replicates: number;
  deliverables: readonly string[];
  scenario: "standard" | "missing_sample";
  idempotency_key: string;
}>;

export type AssayImport = Readonly<{
  id: string;
  work_package_id: string;
  eln_record_id: string;
  eln_revision: number;
  checksum_sha256: string;
  duplicate_detection_key: string;
  status: "quarantined" | "reconciled" | "accepted" | "needs_review" | "superseded";
  observation_ids: readonly string[];
  duplicate: boolean;
  gate_effect?: Readonly<{ gate_id: string; stage: "H2"; status_after: GateStatus }>;
}>;

export type ReconciliationItem = Readonly<{
  id: string;
  sample_ref: string;
  status: "matched" | "missing" | "substituted" | "mislabeled" | "insufficient";
  disposition: string | null;
  owner_persona: string;
  rationale: string | null;
}>;

export type Reconciliation = Readonly<{
  work_package_id: string;
  status: "reconciled" | "hold";
  items: readonly ReconciliationItem[];
}>;

export type Disposition = "repeat_sample" | "exclude_sample" | "accept_with_deviation";

export type RetrainingProposal = Readonly<{
  id: string;
  status: "blocked_pending_authorization";
  reason: string;
  source_import_id: string;
  created_at: string;
}>;

export type ElnEditResult = Readonly<{
  record_id: string;
  revision: number;
  adapter_label: "Mock ELN";
}>;
