import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceLabelBadge } from "@/components/evidence/evidence-label-badge";
import { EVIDENCE_LABELS, EVIDENCE_LABEL_TEXT, isEvidenceLabel } from "@/lib/evidence";
import { SyntheticBadge } from "@/components/ui/synthetic-badge";

describe("EvidenceLabelBadge", () => {
  it("knows the six PRD §3.2 labels with their UI texts", () => {
    expect(EVIDENCE_LABELS.map((l) => EVIDENCE_LABEL_TEXT[l])).toEqual([
      "Literature-reported",
      "Tentative annotation",
      "Computational prediction",
      "Measured observation",
      "Scientist-accepted",
      "Unresolved / conflicting",
    ]);
    expect(isEvidenceLabel("measured_observation")).toBe(true);
    expect(isEvidenceLabel("predicted")).toBe(false);
  });

  it.each(EVIDENCE_LABELS)("renders %s as text with an accessible prefix", (label) => {
    render(<EvidenceLabelBadge label={label} />);
    const badge = screen.getByTestId("evidence-label");
    expect(badge).toHaveAttribute("data-label", label);
    expect(badge).toHaveTextContent(`Evidence: ${EVIDENCE_LABEL_TEXT[label]}`);
  });
});

describe("SyntheticBadge", () => {
  it("says Synthetic", () => {
    render(<SyntheticBadge />);
    expect(screen.getByText("Synthetic")).toBeInTheDocument();
  });
});
