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
  | "view_reconciliation";

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
});

export function canAct(persona: PersonaId, action: ActionId): boolean {
  return PERSONA_ACTIONS[action].includes(persona);
}
