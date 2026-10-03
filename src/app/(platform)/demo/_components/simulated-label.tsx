import { Badge } from "@/components/ui/badge";

// Verbatim prompt §3.1 labels wherever a simulated component appears.
export type SimulatedComponentLabel =
  | "Simulated agent"
  | "Simulated workflow engine"
  | "Simulated compute"
  | "Mock ELN"
  | "Demo signature, not production key"
  | "Demo sign-in"
  | "Optional, simulated";

export function SimulatedLabel({ label }: { label: SimulatedComponentLabel }) {
  return <Badge data-testid="simulated-label">{label}</Badge>;
}
