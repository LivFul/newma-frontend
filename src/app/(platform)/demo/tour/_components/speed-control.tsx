"use client";
import { useCallback, useEffect, useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { putJson, requestJson } from "@/lib/demo/client";
import {
  MAX_SPEED,
  MIN_SPEED,
  SERVER_DEFAULT_CHOICE,
  parseSpeedChoice,
} from "@/lib/demo/parse-config";
import type { DemoConfig } from "@/lib/demo/types";

const CONFIG_URL = "/api/demo/config";
const PRESET_SPEEDS = [1, 2, 4, 6, 8, 10] as const;
const RECOMMENDED_SPEED = 4;
const RANGE_MESSAGE = `The demo speed must be from ${MIN_SPEED} to ${MAX_SPEED}.`;

const choiceOf = (config: DemoConfig): string =>
  config.speed_source === "tenant_override" ? String(config.speed_factor) : SERVER_DEFAULT_CHOICE;

function SpeedOptions({ config }: Readonly<{ config: DemoConfig }>) {
  const choice = choiceOf(config);
  const extra =
    choice !== SERVER_DEFAULT_CHOICE && !PRESET_SPEEDS.some((s) => String(s) === choice);
  return (
    <>
      {PRESET_SPEEDS.map((speed) => (
        <option key={speed} value={speed}>
          {speed}×
        </option>
      ))}
      {extra ? <option value={choice}>{choice}×</option> : null}
      <option value={SERVER_DEFAULT_CHOICE}>Server default</option>
    </>
  );
}

/**
 * The demo-speed control (A-P5B-17): reads and writes the tenant's override of the simulated
 * workflow engine speed through the BFF only. The server default stays a deploy-time setting.
 */
export function SpeedControl() {
  const selectId = useId();
  const [config, setConfig] = useState<DemoConfig | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    void requestJson<DemoConfig>(CONFIG_URL).then((result) => {
      if (!live) return;
      if (result.ok) {
        setConfig(result.data);
        setError(undefined);
      } else {
        setError("Could not read the demo speed.");
      }
    });
    return () => {
      live = false;
    };
  }, [attempt]);

  const choose = useCallback(async (choice: string) => {
    const speed = parseSpeedChoice(choice);
    if (speed === undefined) return setError(RANGE_MESSAGE);
    setError(undefined);
    setBusy(true);
    const result = await putJson<DemoConfig>(CONFIG_URL, { speed_factor: speed });
    setBusy(false);
    if (result.ok) setConfig(result.data);
    else setError(result.error.message);
  }, []);

  return (
    <section aria-labelledby="speed-heading" className="space-y-3" data-testid="demo-speed">
      <h2 id="speed-heading" className="flex flex-wrap items-center gap-2 text-xl font-semibold">
        Demo speed <Badge>Simulated workflow engine</Badge>
      </h2>
      {config ? (
        <p>
          <strong>Demo speed: {config.speed_factor}×</strong>{" "}
          <span className="text-fg-muted">
            {config.speed_source === "tenant_override" ? "(your override)" : "(server default)"}
          </span>
        </p>
      ) : error ? null : (
        <p className="text-fg-muted">Reading the demo speed…</p>
      )}
      {config ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={selectId} className="text-sm font-medium">
            Set demo speed
          </label>
          <select
            id={selectId}
            value={choiceOf(config)}
            disabled={busy}
            aria-busy={busy || undefined}
            onChange={(event) => void choose(event.target.value)}
            className="min-h-10 w-fit rounded-md border border-border-strong bg-bg-elevated px-3 text-fg"
          >
            <SpeedOptions config={config} />
          </select>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
          {error}
          {!config ? (
            <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          ) : null}
        </p>
      ) : null}
      <p className="text-sm text-fg-muted">
        The server sets the default speed (SIM_SPEED_FACTOR). This override applies to simulated
        compute for this demo tenant only, and a reset keeps it. {RECOMMENDED_SPEED}× is the
        recommended speed: the three-minute W3 budget was measured at it.
      </p>
    </section>
  );
}
