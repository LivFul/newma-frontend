"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import type { License, LicenseOptions, LicensePurpose } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { SelectField, TextField } from "../../_components/fields";
import { AgreementRules } from "./agreement-rules";
import { W7ErrorNotice } from "./w7-error-notice";

type Props = Readonly<{ options: LicenseOptions; allowed: boolean }>;

const PURPOSES: readonly { value: LicensePurpose; label: string }[] = [
  { value: "research", label: "Research" },
  { value: "commercial", label: "Commercial" },
];
const NO_CREDENTIAL = "";
const DEFAULT_TERM_MONTHS = "12";

/** Partner-only license request (A2); one stable idempotency key per form, reset on success. */
export function LicenseRequestForm({ options, allowed }: Props) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const agreements = options.agreements.filter((a) => a.latest);
  const [agreementId, setAgreementId] = useState(agreements[0]?.id ?? "");
  const [licensee, setLicensee] = useState(options.licensee_organizations[0]?.id ?? "");
  const [purpose, setPurpose] = useState<LicensePurpose>("research");
  const [scope, setScope] = useState("");
  const [term, setTerm] = useState(DEFAULT_TERM_MONTHS);
  const [credential, setCredential] = useState(NO_CREDENTIAL);
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();
  const agreement = agreements.find((a) => a.id === agreementId);
  // An edited form is a different request: it needs a new key; an unchanged retry replays.
  const edited =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      reset();
    };

  const submit = () => {
    if (busy || !allowed) return;
    setError(undefined);
    void run(async () => {
      const result = await postJson<License>("/api/demo/licenses", {
        agreement_id: agreementId,
        licensee_organization_id: licensee,
        purpose,
        scope_summary: scope,
        term_months: Number(term),
        ...(credential === NO_CREDENTIAL ? {} : { credential_ref: credential }),
        idempotency_key: key,
      });
      if (!result.ok) return setError(result.error);
      reset();
      router.push(`/demo/w7-settlement/licenses/${encodeURIComponent(result.data.id)}`);
    });
  };

  return (
    <form
      aria-label="Request a license"
      className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <SelectField
        label="Agreement"
        value={agreementId}
        onChange={edited(setAgreementId)}
        options={agreements.map((a) => ({
          value: a.id,
          label: `Version ${a.version}: ${a.authority}`,
        }))}
      />
      <SelectField
        label="Licensee organization"
        value={licensee}
        onChange={edited(setLicensee)}
        options={options.licensee_organizations.map((o) => ({
          value: o.id,
          label: o.display_name,
        }))}
      />
      <div className="sm:col-span-2">
        {agreement ? <AgreementRules agreement={agreement} /> : null}
      </div>
      <SelectField
        label="Purpose"
        value={purpose}
        onChange={edited((value: string) => setPurpose(value as LicensePurpose))}
        options={PURPOSES}
      />
      <TextField label="Term (months)" type="number" value={term} onChange={edited(setTerm)} />
      <div className="sm:col-span-2">
        <TextField label="Scope" value={scope} onChange={edited(setScope)} multiline />
      </div>
      <SelectField
        label="Credential (optional, simulated)"
        value={credential}
        onChange={edited(setCredential)}
        options={[
          { value: NO_CREDENTIAL, label: "None" },
          ...options.credentials.map((c) => ({
            value: c.credential_ref,
            label: `${c.credential_ref}: ${c.description}`,
          })),
        ]}
      />
      <p className="self-end text-sm text-fg-muted">
        Credential check is optional and simulated; no attribute is disclosed and no proof is
        checked.
      </p>
      <div className="sm:col-span-2 space-y-2">
        <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
          Request license
        </Button>
        <W7ErrorNotice error={error} />
      </div>
    </form>
  );
}
