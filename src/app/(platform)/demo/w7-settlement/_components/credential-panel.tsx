import { Badge } from "@/components/ui";
import type { License } from "@/lib/demo/types";
import { formatInstant, humanize } from "../../_components/fields";
import { allowedLabels } from "../../_components/persona-forbidden-notice";
import { SimulatedLabel } from "../../_components/simulated-label";
import { ActionButton } from "./action-button";

type Props = Readonly<{ license: License; allowed: boolean }>;

function Result({ license }: { license: License }) {
  const { credential } = license;
  return (
    <div data-testid="credential-result" className="space-y-1 text-sm">
      <p className="flex flex-wrap items-center gap-2">
        {credential.status === "verified" ? (
          <Badge tone="success">Verified</Badge>
        ) : (
          <Badge tone="danger">Failed: {humanize(credential.reason ?? "no reason given")}</Badge>
        )}
        <span>Checked {formatInstant(credential.checked_at)}</span>
      </p>
      <p>
        Proof reference: <span className="font-mono">{credential.proof_ref ?? "none"}</span>
      </p>
      <p className="text-fg-muted">No attributes disclosed</p>
    </div>
  );
}

const ALLOWED = ["partner", "tenant_admin"] as const;

function unavailableReason(license: License, allowed: boolean): string | undefined {
  if (!allowed) return `Only ${allowedLabels(ALLOWED)} can do this. Switch persona in the header.`;
  if (!license.next_actions.includes("credential_check")) {
    return "The check cannot run in this state.";
  }
  if (!license.credential.credential_ref) {
    return "No credential reference was provided with the request; the check is optional.";
  }
  return undefined;
}

/** Optional, simulated credential check (A-P5A-07): not a security control. */
export function CredentialPanel({ license, allowed }: Props) {
  const { credential } = license;
  const checked = credential.status !== "not_requested";
  return (
    <section aria-labelledby="credential-heading" className="space-y-3">
      <h2
        id="credential-heading"
        className="flex flex-wrap items-center gap-3 text-xl font-semibold"
      >
        Credential check
        <SimulatedLabel label="Optional, simulated" />
      </h2>
      <p className="text-sm text-fg-muted">
        Credential check is optional and simulated: a fixed table of fictional references answers
        it, no cryptographic proof is checked and nothing about the holder is disclosed.
      </p>
      <p className="text-sm">
        Credential reference:{" "}
        <span className="font-mono">{credential.credential_ref ?? "none provided"}</span>
      </p>
      {checked ? (
        <Result license={license} />
      ) : (
        <ActionButton
          label="Run credential check"
          endpoint={`/api/demo/licenses/${encodeURIComponent(license.id)}/credential-check`}
          disabledReason={unavailableReason(license, allowed)}
        />
      )}
    </section>
  );
}
