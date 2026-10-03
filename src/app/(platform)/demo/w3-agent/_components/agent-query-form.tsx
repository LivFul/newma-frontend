"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { type ClientError, postJson } from "@/lib/demo/client";
import { useStableKey } from "@/lib/demo/idempotency";
import type { AgentQuery } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { SelectField, TextField } from "../../_components/fields";

export const DEFAULT_OBJECTIVE =
  "Rank fictional constituents against the target and propose one first wet-lab test.";
const DEFAULT_BUDGET = "60";

type Target = Readonly<{ id: string; display_name: string }>;

export function AgentQueryForm({
  targets,
  allowed,
}: {
  targets: readonly Target[];
  allowed: boolean;
}) {
  const router = useRouter();
  const { key, reset } = useStableKey();
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [target, setTarget] = useState(targets[0]?.id ?? "");
  const [budget, setBudget] = useState(DEFAULT_BUDGET);
  const [error, setError] = useState<ClientError | undefined>();
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (pending || !allowed) return;
    setError(undefined);
    startTransition(async () => {
      const body = {
        objective,
        target_id: target,
        budget_credits: Number(budget),
        idempotency_key: key,
      };
      const result = await postJson<AgentQuery>("/api/demo/agent/queries", body);
      if (!result.ok) return setError(result.error);
      reset();
      router.push(`/demo/w3-agent?query=${encodeURIComponent(result.data.id)}`);
    });
  };

  return (
    <form
      aria-label="Ask the simulated agent"
      className="grid gap-4 rounded-md border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <TextField label="Objective" value={objective} onChange={setObjective} multiline />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Target"
          value={target}
          onChange={setTarget}
          options={targets.map((t) => ({ value: t.id, label: t.display_name }))}
        />
        <TextField
          label="Budget (demo credits)"
          type="number"
          value={budget}
          onChange={setBudget}
        />
      </div>
      <div>
        <Button
          type="submit"
          aria-busy={pending || undefined}
          aria-disabled={!allowed || undefined}
        >
          Ask the simulated agent
        </Button>
      </div>
      <ErrorNotice error={error} />
    </form>
  );
}
