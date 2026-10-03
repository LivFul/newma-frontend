"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useAction } from "@/lib/demo/use-action";
import {
  type AssetType,
  POLICY_ACTIONS,
  PURPOSES,
  type PolicyAction,
  type PolicyDecision,
  type Purpose,
  type RightsRecord,
} from "@/lib/demo/types";
import { type PersonaId, personaLabel } from "@/lib/personas";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, humanize } from "../../_components/fields";
import { DecisionCard } from "./decision-card";

type Props = Readonly<{ records: readonly RightsRecord[]; tenantId: string; persona: PersonaId }>;

const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: humanize(value) }));
const assetValue = (record: RightsRecord) => `${record.subject_type}:${record.subject_id}`;

function assetOptions(records: readonly RightsRecord[]) {
  const seen = new Map<string, string>();
  for (const record of records) {
    if (!seen.has(assetValue(record)))
      seen.set(assetValue(record), `${record.subject_display_name} (${humanize(record.status)})`);
  }
  return [...seen].map(([value, label]) => ({ value, label }));
}

/** RM §1.3 inputs: tenant and persona come from the session (read-only); the user picks the rest. */
export function PolicyEvaluator({ records, tenantId, persona }: Props) {
  const router = useRouter();
  const assets = assetOptions(records);
  const [asset, setAsset] = useState(assets[0]?.value ?? "");
  const [purpose, setPurpose] = useState<Purpose>("research");
  const [action, setAction] = useState<PolicyAction>("retrieve");
  const [decision, setDecision] = useState<PolicyDecision | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  // A decision belongs to the inputs it was evaluated for: changing any input clears it.
  // The generation also drops any response still in flight for the previous inputs.
  const generation = useRef(0);
  const changed = (set: (value: string) => void) => (value: string) => {
    generation.current += 1;
    setDecision(undefined);
    set(value);
  };

  const evaluate = () => {
    const separator = asset.indexOf(":");
    const assetType = asset.slice(0, separator);
    const assetId = separator > 0 ? asset.slice(separator + 1) : "";
    if (busy || !assetId) return;
    setError(undefined);
    const issued = generation.current;
    void run(async () => {
      const body = { purpose, action, asset_type: assetType as AssetType, asset_id: assetId };
      const result = await postJson<PolicyDecision>("/api/demo/policy/evaluate", body);
      if (generation.current !== issued) return;
      if (!result.ok) {
        setDecision(undefined);
        return setError(result.error);
      }
      setDecision(result.data);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <form
        aria-label="Evaluate policy"
        className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          evaluate();
        }}
      >
        <dl className="grid gap-1 text-sm sm:col-span-2 sm:grid-cols-2">
          <div>
            <dt className="text-fg-muted">Tenant (from session)</dt>
            <dd className="font-mono">{tenantId}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Persona (from session)</dt>
            <dd>{personaLabel(persona)}</dd>
          </div>
        </dl>
        <SelectField label="Asset" value={asset} options={assets} onChange={changed(setAsset)} />
        <SelectField
          label="Purpose"
          value={purpose}
          options={options(PURPOSES)}
          onChange={changed((v) => setPurpose(v as Purpose))}
        />
        <SelectField
          label="Action"
          value={action}
          options={options(POLICY_ACTIONS)}
          onChange={changed((v) => setAction(v as PolicyAction))}
        />
        <div className="flex items-end">
          <Button type="submit" aria-busy={busy || undefined}>
            Evaluate policy
          </Button>
        </div>
      </form>
      <ErrorNotice error={error} />
      <div role="status" aria-live="polite">
        {decision ? <DecisionCard decision={decision} /> : null}
      </div>
    </div>
  );
}
