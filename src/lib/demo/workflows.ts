// Workflow index W1–W10 for the dashboard. W1–W7 carry the sprint plan §3.2 names (A-P3-21);
// W8–W10 keep the A-P2-F04 placeholders until P5. W1–W6 link to their pages from P3 on.
export type WorkflowPhase = "P3" | "P5";

export type Workflow = Readonly<{ id: string; title: string; phase: WorkflowPhase; href?: string }>;

export const WORKFLOWS: readonly Workflow[] = Object.freeze([
  { id: "W1", title: "Rights & use authorization", phase: "P3", href: "/demo/w1-rights" },
  { id: "W2", title: "Ingestion & curation", phase: "P3", href: "/demo/w2-evidence" },
  { id: "W3", title: "Agentic discovery", phase: "P3", href: "/demo/w3-agent" },
  { id: "W4", title: "Scientific review & gates", phase: "P3", href: "/demo/w4-gates" },
  { id: "W5", title: "Closed-loop wet lab", phase: "P3", href: "/demo/w5-wet-lab" },
  { id: "W6", title: "Signed provenance", phase: "P3", href: "/demo/w6-provenance" },
  { id: "W7", title: "Licensing & benefit settlement", phase: "P5" },
  { id: "W8", title: "Settlement in demo credits", phase: "P5" },
  { id: "W9", title: "Quotas and budgets", phase: "P5" },
  { id: "W10", title: "Custodian view", phase: "P5" },
] as const satisfies readonly Workflow[]);
