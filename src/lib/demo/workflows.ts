// Workflow index W1–W10 for the dashboard. Titles are agent placeholders until the sprint plan §3.2
// names are confirmed (assumption A-P2-F04); the ids and the Must/Should split are from the plan.
export type WorkflowPhase = "P3" | "P5";

export type Workflow = Readonly<{ id: string; title: string; phase: WorkflowPhase }>;

export const WORKFLOWS: readonly Workflow[] = Object.freeze([
  { id: "W1", title: "Rights and consent view", phase: "P3" },
  { id: "W2", title: "Taxa, samples and constituents", phase: "P3" },
  { id: "W3", title: "Screening sequence (simulated compute)", phase: "P3" },
  { id: "W4", title: "ADMET prediction (simulated compute)", phase: "P3" },
  { id: "W5", title: "Scientific approval gates", phase: "P3" },
  { id: "W6", title: "Wet-lab loop (Mock ELN)", phase: "P3" },
  { id: "W7", title: "Partner sharing", phase: "P5" },
  { id: "W8", title: "Settlement in demo credits", phase: "P5" },
  { id: "W9", title: "Quotas and budgets", phase: "P5" },
  { id: "W10", title: "Custodian view", phase: "P5" },
] as const satisfies readonly Workflow[]);
