// PRD §3.2 evidence distinctions (A-P3-01). Product vocabulary: no demo imports here.
export const EVIDENCE_LABELS = [
  "literature_reported",
  "tentative_annotation",
  "computational_prediction",
  "measured_observation",
  "scientist_accepted",
  "unresolved_conflicting",
] as const;

export type EvidenceLabel = (typeof EVIDENCE_LABELS)[number];

export const EVIDENCE_LABEL_TEXT: Readonly<Record<EvidenceLabel, string>> = Object.freeze({
  literature_reported: "Literature-reported",
  tentative_annotation: "Tentative annotation",
  computational_prediction: "Computational prediction",
  measured_observation: "Measured observation",
  scientist_accepted: "Scientist-accepted",
  unresolved_conflicting: "Unresolved / conflicting",
});

const LABEL_SET: ReadonlySet<string> = new Set(EVIDENCE_LABELS);

export function isEvidenceLabel(value: unknown): value is EvidenceLabel {
  return typeof value === "string" && LABEL_SET.has(value);
}
