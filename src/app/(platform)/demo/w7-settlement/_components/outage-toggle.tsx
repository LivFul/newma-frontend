"use client";
import { useState } from "react";
import { type ClientError, requestJson } from "@/lib/demo/client";
import type { OutageState } from "@/lib/demo/types";
import { useAction } from "@/lib/demo/use-action";
import { SimulatedLabel } from "../../_components/simulated-label";
import { W7ErrorNotice } from "./w7-error-notice";

const ACTIVE_TEXT = "Chain outage simulated — new anchors stay pending";
const INACTIVE_TEXT =
  "Anchoring works normally. Switch on to simulate a chain outage; nothing else is blocked.";

/** Demo-only switch (A-P5A-F06): the state is read on load and replaced by each PUT response. */
export function OutageToggle({ initial }: { initial: OutageState }) {
  const [outage, setOutage] = useState(initial);
  const [error, setError] = useState<ClientError | undefined>();
  const { busy, run } = useAction();

  const toggle = () => {
    if (busy) return;
    setError(undefined);
    void run(async () => {
      const result = await requestJson<OutageState>("/api/demo/anchoring/outage", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !outage.active }),
      });
      if (!result.ok) return setError(result.error);
      setOutage(result.data);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={outage.active}
          aria-busy={busy || undefined}
          aria-label="Simulate chain outage (demo)"
          onClick={toggle}
          className="relative inline-flex h-8 w-14 items-center rounded-full border border-border-strong bg-bg-elevated aria-checked:bg-warning"
        >
          <span
            aria-hidden="true"
            className={`absolute h-6 w-6 rounded-full bg-fg transition-transform ${outage.active ? "translate-x-7" : "translate-x-1"}`}
          />
        </button>
        <span className="text-sm font-medium" aria-hidden="true">
          Simulate chain outage (demo)
        </span>
        <SimulatedLabel label="Optional, simulated" />
      </div>
      <p data-testid="outage-status" aria-live="polite" className="text-sm text-fg-muted">
        {outage.active ? ACTIVE_TEXT : INACTIVE_TEXT}
      </p>
      <W7ErrorNotice error={error} />
    </div>
  );
}
