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
// W7 (D-17): every shape below is generated from the pinned contract (docs/plans/p5a.md Contract).
// Money is an integer in demo credits, shares are integer basis points (always "Illustrative").
// ---------------------------------------------------------------------------------------------
// Settlements (A8–A20): generated from the pinned contract.
export const SETTLEMENT_STATES = [
  "submitted",
  "reviewed",
  "approved",
  "disputed",
  "receipts_reconciled",
  "distribution_authorized",
  "funded",
  "paid",
  "audited",
  "paused",
] as const satisfies readonly Schemas["SettlementOut"]["state"][];
export type SettlementState = Schemas["SettlementOut"]["state"];
// Licenses (A1–A7): generated from the pinned contract.
export type LicenseState = Schemas["LicenseOut"]["status"];
export type CredentialStatus = Schemas["CredentialOut"]["status"];
export type LicenseAction = Schemas["LicenseOut"]["next_actions"][number];
export type SettlementAction = Schemas["SettlementOut"]["next_actions"][number];
export type ReceiptStatus = Schemas["ReceiptOut"]["status"];
export type LedgerKind = Schemas["LedgerEntryOut"]["kind"];
export type BenefitStatus = Schemas["BenefitItemOut"]["status"];
export type AnchorStatus = Schemas["AnchorOut"]["status"];
export type LicensePurpose = Schemas["LicenseOut"]["purpose"];

export type AgreementRule = Schemas["RuleOut"];
export type AgreementView = Schemas["AgreementView"];
export type LicenseCredential = Schemas["CredentialOut"];
export type LicenseDecision = Schemas["DecisionOut"];
export type License = Schemas["LicenseOut"];
export type LicenseOptions = Schemas["LicenseOptions"];

export type Receipt = Schemas["ReceiptOut"];
export type CalcLine = Schemas["CalcLineOut"];
export type Calculation = Schemas["CalculationOut"];
export type SettlementApproval = Schemas["ApprovalOut"];
export type LedgerEntry = Schemas["LedgerEntryOut"];
export type Commitment = Schemas["CommitmentOut"];
export type Anchor = Schemas["AnchorOut"];
export type SettlementHistoryEntry = Schemas["HistoryEntry"];
export type Settlement = Schemas["SettlementOut"];
export type SettlementSummary = Schemas["SettlementSummary"];
export type ApprovalResult = Schemas["ApprovalCreated"];
export type BenefitItem = Schemas["BenefitItemOut"];
export type Beneficiary = Schemas["BeneficiaryOut"];
export type OutageState = Schemas["OutageOut"];
export type EntityEvents = Schemas["EntityEvents"];

// ---------------------------------------------------------------------------------------------
// P5b contract shapes (docs/plans/p5b.md Contract table, rows 1-17). W8 and W9 are generated from
// the pinned contract; all rows are generated from the pinned contract.
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

// Repinned (D-18): generated from the pinned contract.
export type FieldDisclosure = Schemas["FieldDisclosureOut"];
export type AssetEvidence = Schemas["AssetEvidenceOut"];
export type ExportRecord = Schemas["ExportRecordOut"];
export type ExportSummary = Schemas["ExportSummaryOut"];
export type Thresholds = Schemas["Thresholds"];
export type CampaignSummary = Schemas["CampaignSummaryOut"];
export type CharterVersion = Schemas["CharterVersionOut"];
export type CharterOut = Schemas["CharterOut"];
export type CharterChange = Schemas["CharterChangeOut"];
export type CreditUsage = Schemas["CreditUsageOut"];

export type Grievance = Schemas["GrievanceOut"];
export type CustodianObligation = Schemas["CustodianObligation"];
export type CustodianUse = Schemas["UseText"];
export type CustodianAgreement = Schemas["CustodianAgreement"];
export type CustodianView = Schemas["CustodianViewOut"];

export type DemoConfig = Schemas["DemoConfigOut"];
