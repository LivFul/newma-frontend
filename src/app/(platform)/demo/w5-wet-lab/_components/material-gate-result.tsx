import { Badge } from "@/components/ui";
import type { WorkPackage } from "@/lib/demo/types";

export function MaterialGateResult({ gate }: { gate: WorkPackage["material_gate"] }) {
  return (
    <div
      className="space-y-1 text-sm"
      data-testid="material-gate"
      data-passed={gate.passed ? "true" : "false"}
    >
      <p className="flex items-center gap-2">
        Material gate{" "}
        <Badge tone={gate.passed ? "success" : "warning"}>
          {gate.passed ? "passed" : "not met"}
        </Badge>
      </p>
      <ul className="list-disc pl-5">
        {gate.reasons.map((reason, index) => (
          <li key={`${reason.code}:${index}`}>
            <span className="font-mono">{reason.code}</span>: {reason.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
