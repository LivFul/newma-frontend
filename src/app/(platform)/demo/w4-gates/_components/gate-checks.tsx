import { Mark } from "@/components/ui/mark";
import type { Gate } from "@/lib/demo/types";

/** On a gate that has not started, an unmet check is not met yet rather than failed. */
export function GateChecks({
  checks,
  pending = false,
}: {
  checks: Gate["checks"];
  pending?: boolean;
}) {
  if (checks.length === 0) return <p className="text-sm text-fg-muted">No automated checks.</p>;
  return (
    <ul aria-label="Automated checks" className="space-y-1.5 text-sm">
      {checks.map((check) => (
        <li key={check.code} data-passed={check.passed ? "true" : "false"}>
          {pending && !check.passed ? (
            <span className="text-fg-muted">
              <Mark kind="ring" className="mr-2 size-3.5" />
              {check.message}: not met yet
            </span>
          ) : (
            <>
              <Mark
                kind={check.passed ? "check" : "cross"}
                className={`mr-2 size-3.5 ${check.passed ? "text-success-ink" : "text-danger"}`}
              />
              {check.message}: {check.passed ? "passed" : "failed"}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
