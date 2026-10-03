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
