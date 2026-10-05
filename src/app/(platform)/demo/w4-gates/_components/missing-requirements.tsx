import type { ClientError } from "@/lib/demo/client";
import { isRecord, isStringArray } from "@/lib/demo/guards";
import { ErrorNotice } from "../../_components/error-notice";

export function MissingRequirements({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="hatch-held border border-warning-ink p-1.5 text-sm">
      <div className="bg-bg-elevated px-3 py-2">
        <p className="place text-fg">Missing requirements</p>
        <ul className="mt-2 list-disc space-y-0.5 pl-5">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function detail(error: ClientError, key: string): unknown {
  return isRecord(error.details) ? error.details[key] : undefined;
}

/** Gate refusals with their allowlisted details; everything else falls back to ErrorNotice. */
export function GateErrorNotice({ error }: { error: ClientError | undefined }) {
  if (!error) return null;
  const missing = detail(error, "missing_requirements");
  const current = detail(error, "current_version");
  const reason = detail(error, "reason");
  const known =
    (error.code === "gate_requirements_missing" && isStringArray(missing)) ||
    (error.code === "evidence_package_stale" && current !== undefined) ||
    (error.code === "gate_not_decidable" && typeof reason === "string");
  if (!known) return <ErrorNotice error={error} />;
  return (
    <div role="alert" className="space-y-1 rounded-md border border-danger px-3 py-2 text-sm">
      <p>
        {error.message} <span className="font-mono">({error.code})</span>
      </p>
      {isStringArray(missing) ? (
        <ul className="list-disc pl-5">
          {missing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {current !== undefined ? <p>Current version: {String(current)}</p> : null}
      {typeof reason === "string" ? <p className="font-mono">{reason}</p> : null}
    </div>
  );
}
