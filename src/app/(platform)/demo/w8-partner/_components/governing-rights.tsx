import type { AssetEvidence } from "@/lib/demo/types";

type Props = Readonly<{
  policy: AssetEvidence["policy"];
  /** Rights record id to its fictional subject name, from the W1 registry. */
  recordNames: Readonly<Record<string, string>>;
}>;

/** The rights decision behind the pack, naming the governing records (so a W1 withdrawal shows). */
export function GoverningRights({ policy, recordNames }: Props) {
  return (
    <section
      aria-labelledby="rights-heading"
      className="space-y-2 rounded-md border border-border p-4"
    >
      <h2 id="rights-heading" className="text-xl font-semibold">
        Governing rights
      </h2>
      <p>
        Export decision: <strong data-testid="export-decision">{policy.decision}</strong>{" "}
        <span className="text-sm text-fg-muted">(policy {policy.policy_version})</span>
      </p>
      {policy.rights_record_ids.length > 0 ? (
        <p className="text-sm">
          Governing records:{" "}
          {policy.rights_record_ids.map((id) => recordNames[id] ?? id).join(", ")}
        </p>
      ) : null}
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {policy.reasons.map((reason) => (
          <li key={`${reason.code}-${reason.rights_record_id ?? "none"}`}>
            <span className="font-mono">{reason.code}</span>: {reason.message}
            {reason.remediation ? <> Remediation: {reason.remediation}</> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
