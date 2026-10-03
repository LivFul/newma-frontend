// Workflow index W1–W10 for the dashboard. All ten carry the sprint plan §3.2 names (A-P3-21,
// A-P5B-20) and link to their pages: W1–W6 from P3, W7–W10 from P5.
export type WorkflowPhase = "P3" | "P5";

export type Workflow = Readonly<{ id: string; title: string; phase: WorkflowPhase; href?: string }>;

export const WORKFLOWS: readonly Workflow[] = Object.freeze([
  { id: "W1", title: "Rights & use authorization", phase: "P3", href: "/demo/w1-rights" },
  { id: "W2", title: "Ingestion & curation", phase: "P3", href: "/demo/w2-evidence" },
  { id: "W3", title: "Agentic discovery", phase: "P3", href: "/demo/w3-agent" },
  { id: "W4", title: "Scientific review & gates", phase: "P3", href: "/demo/w4-gates" },
  { id: "W5", title: "Closed-loop wet lab", phase: "P3", href: "/demo/w5-wet-lab" },
  { id: "W6", title: "Signed provenance", phase: "P3", href: "/demo/w6-provenance" },
  { id: "W7", title: "Licensing & benefit settlement", phase: "P5", href: "/demo/w7-settlement" },
  { id: "W8", title: "Partner portal & controlled export", phase: "P5", href: "/demo/w8-partner" },
  { id: "W9", title: "Campaign, quotas & cost", phase: "P5", href: "/demo/w9-campaign" },
  { id: "W10", title: "Custodian view", phase: "P5", href: "/demo/w10-custodian" },
] as const satisfies readonly Workflow[]);
