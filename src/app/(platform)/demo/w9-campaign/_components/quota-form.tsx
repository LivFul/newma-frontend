"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { type ClientError, putJson } from "@/lib/demo/client";
import { THRESHOLD_LIMITS } from "@/lib/demo/parse-campaigns";
import type { CampaignSummary } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { ErrorNotice } from "../../_components/error-notice";
import { TextField } from "../../_components/fields";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";

const invalid = (message: string): ClientError => ({ code: "validation_error", message });
const WHOLE_NUMBER = /^[0-9]{1,7}$/;

type Props = Readonly<{ campaignId: string; current: number; allowed: boolean }>;

/** Tenant admin sets the credit quota; it may go below what is committed (new jobs are then refused). */
export function QuotaForm({ campaignId, current, allowed }: Props) {
  const router = useRouter();
  const [quota, setQuota] = useState(String(current));
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<string | undefined>();
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const submit = () => {
    if (busy || !allowed) return;
    setResult(undefined);
    if (reason.trim().length < THRESHOLD_LIMITS.reasonMin) {
      return setError(invalid("A reason of at least 3 characters is required."));
    }
    const value = Number(quota);
    if (!WHOLE_NUMBER.test(quota) || value > THRESHOLD_LIMITS.quotaMax) {
      return setError(invalid("The quota must be a whole number between 0 and 1,000,000."));
    }
    setError(undefined);
    void run(async () => {
      const response = await putJson<CampaignSummary>(
        `/api/demo/campaigns/${encodeURIComponent(campaignId)}/quota`,
        { credit_quota: value, reason: reason.trim() },
      );
      if (response.ok) {
        setResult(
          `Quota set to ${response.data.credit_quota} demo credits (${response.data.remaining} remaining)`,
        );
        setReason("");
      } else setError(response.error);
      router.refresh();
    });
  };

  return (
    <section aria-labelledby="quota-form-heading" className="space-y-3">
      <h2 id="quota-form-heading" className="text-xl font-semibold">
        Set the credit quota
      </h2>
      {allowed ? null : <PersonaForbiddenNotice allowed={["tenant_admin"]} />}
      <form
        aria-label="Set the credit quota"
        aria-busy={busy || undefined}
        className="grid gap-4 rounded-md border border-border p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={!allowed} className="contents">
          <TextField
            label="Credit quota (demo credits)"
            type="number"
            value={quota}
            onChange={setQuota}
          />
          <TextField label="Reason for the quota" value={reason} onChange={setReason} />
        </fieldset>
        <div>
          <Button type="submit" aria-busy={busy || undefined} aria-disabled={!allowed || undefined}>
            Set quota
          </Button>
        </div>
      </form>
      <div role="status" aria-live="polite">
        {result ? (
          <p className="rounded-md border border-border-strong px-3 py-2 text-sm">{result}</p>
        ) : null}
      </div>
      <ErrorNotice error={error} />
    </section>
  );
}
