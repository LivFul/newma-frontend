import type { PersonaId } from "@/lib/personas";

// Who may act, mirroring the P3 contract persona column (A-P3-04). UI hints only: the backend's
// 403 persona_forbidden is the authority and is always rendered.
export type ActionId =
  | "create_rights_record"
  | "withdraw_rights"
  | "ingest_source"
  | "decide_claim"
  | "publish_release"
  | "run_agent_query"
  | "decide_gate"
  | "create_work_package"
  | "import_assay"
  | "record_disposition"
  | "accept_import"
  | "edit_eln_record"
  | "view_reconciliation"
  | "request_license"
  | "check_credential"
  | "decide_license"
  | "create_settlement"
  | "settlement_finance"
  | "approve_distribution"
  | "manage_benefit"
  // P5b (A-P5B-09)
  | "export_evidence"
  | "view_exports"
  | "edit_charter"
  | "edit_quota"
  | "view_custodian"
  | "view_grievances"
  | "raise_grievance"
  | "acknowledge_grievance";

export const PERSONA_ACTIONS: Readonly<Record<ActionId, readonly PersonaId[]>> = Object.freeze({
  create_rights_record: ["community_liaison", "data_steward"],
  withdraw_rights: ["community_liaison"],
  ingest_source: ["data_steward"],
  decide_claim: ["data_steward"],
  publish_release: ["data_steward"],
  run_agent_query: ["scientist"],
  decide_gate: ["scientific_approver"],
  create_work_package: ["scientist"],
  import_assay: ["wet_lab_cro"],
  record_disposition: ["scientist"],
  accept_import: ["scientist"],
  edit_eln_record: ["wet_lab_cro"],
  view_reconciliation: ["scientist", "wet_lab_cro", "data_steward"],
  request_license: ["partner"],
  check_credential: ["partner", "tenant_admin"],
  decide_license: ["tenant_admin"],
  create_settlement: ["finance"],
  settlement_finance: ["finance"],
  approve_distribution: ["finance", "tenant_admin"],
  manage_benefit: ["community_liaison"],
  export_evidence: ["partner"],
  view_exports: ["partner", "tenant_admin"],
  edit_charter: ["tenant_admin"],
  edit_quota: ["tenant_admin"],
  view_custodian: ["community_liaison", "data_steward", "tenant_admin"],
  view_grievances: ["community_liaison", "data_steward", "tenant_admin"],
  raise_grievance: ["community_liaison"],
  acknowledge_grievance: ["data_steward"],
});

export function canAct(persona: PersonaId, action: ActionId): boolean {
  return PERSONA_ACTIONS[action].includes(persona);
}
