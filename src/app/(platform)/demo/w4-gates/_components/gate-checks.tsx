import type { Gate } from "@/lib/demo/types";

export function GateChecks({ checks }: { checks: Gate["checks"] }) {
  if (checks.length === 0) return <p className="text-sm text-fg-muted">No automated checks.</p>;
  return (
    <ul aria-label="Automated checks" className="space-y-1 text-sm">
      {checks.map((check) => (
        <li key={check.code} data-passed={check.passed ? "true" : "false"}>
          <span aria-hidden="true">{check.passed ? "✓ " : "✕ "}</span>
          {check.message}: {check.passed ? "passed" : "failed"}
        </li>
      ))}
    </ul>
  );
}
