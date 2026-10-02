// Persona vocabulary (sprint plan §4 Sessions; P2 contract). Product vocabulary, not demo code:
// both `/access` and the demo subtree import it, so it lives outside `src/lib/demo/`.
export type PersonaId =
  | "community_liaison"
  | "scientist"
  | "data_steward"
  | "scientific_approver"
  | "wet_lab_cro"
  | "partner"
  | "finance"
  | "tenant_admin";

export type Persona = Readonly<{ id: PersonaId; label: string; description: string }>;

export const PERSONAS: readonly Persona[] = Object.freeze([
  {
    id: "community_liaison",
    label: "Community liaison",
    description: "Records community consent and benefit-sharing terms (fictional communities).",
  },
  {
    id: "scientist",
    label: "Scientist",
    description: "Runs simulated screening and ADMET jobs and reviews synthetic results.",
  },
  {
    id: "data_steward",
    label: "Data steward",
    description: "Curates synthetic taxa, targets and compound records.",
  },
  {
    id: "scientific_approver",
    label: "Scientific approver",
    description: "Moves candidates through the gate statuses.",
  },
  {
    id: "wet_lab_cro",
    label: "Wet-lab / CRO",
    description: "Receives simulated lab requests and posts synthetic assay results.",
  },
  {
    id: "partner",
    label: "Biopharma partner",
    description: "Sees the partner-facing view of shared synthetic candidates.",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Reviews illustrative settlement in demo credits.",
  },
  {
    id: "tenant_admin",
    label: "Tenant admin",
    description: "Manages the demo tenant, quotas and resets.",
  },
] as const satisfies readonly Persona[]);

const PERSONA_IDS: ReadonlySet<string> = new Set(PERSONAS.map((p) => p.id));

export function isPersonaId(value: unknown): value is PersonaId {
  return typeof value === "string" && PERSONA_IDS.has(value);
}

export function personaLabel(id: PersonaId): string {
  return PERSONAS.find((p) => p.id === id)?.label ?? id;
}
